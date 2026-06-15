import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .cache import atomic_write_text
from .data_loader import hydrate_fixture_teams, hydrate_team_ref, load_fixtures

BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world"
TIMEOUT_SECONDS = 10
TOURNAMENT_START = date(2026, 6, 11)
TOURNAMENT_END = date(2026, 7, 19)
FIXTURES_PATH = Path(__file__).resolve().parents[1] / "data" / "fixtures.json"

# Bounded concurrency for the per-fixture summary calls. ESPN's public API is
# unauthenticated and rate-limited, so keep the fan-out small and polite.
SUMMARY_WORKERS = int(os.environ.get("ESPN_SUMMARY_WORKERS", "6"))


def _build_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=SUMMARY_WORKERS, pool_maxsize=SUMMARY_WORKERS)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


# Reused across calls so connection pooling and retry policy apply everywhere.
_SESSION = _build_session()


def get_scoreboard(date_yyyymmdd: str | None = None) -> dict[str, Any]:
    url = f"{BASE}/scoreboard"
    params = {}

    if date_yyyymmdd:
        params["dates"] = date_yyyymmdd

    response = _SESSION.get(url, params=params, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()


def get_scoreboard_range(start: date = TOURNAMENT_START, end: date = TOURNAMENT_END) -> dict[str, Any]:
    return get_scoreboard(f"{start:%Y%m%d}-{end:%Y%m%d}")


def get_today_scoreboard() -> dict[str, Any]:
    today = date.today().strftime("%Y%m%d")
    return get_scoreboard(today)


def get_match_summary(event_id: str) -> dict[str, Any]:
    url = f"{BASE}/summary"
    response = _SESSION.get(url, params={"event": event_id}, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()


def extract_fixtures(scoreboard: dict[str, Any]) -> list[dict[str, Any]]:
    fixtures = []

    for event in scoreboard.get("events", []):
        competitions = event.get("competitions") or []
        if not competitions:
            continue

        competition = competitions[0]
        competitors = competition.get("competitors") or []
        home = next((competitor for competitor in competitors if competitor.get("homeAway") == "home"), None)
        away = next((competitor for competitor in competitors if competitor.get("homeAway") == "away"), None)
        if not home or not away:
            continue

        status_payload = competition.get("status", {}).get("type", {})
        status_name = status_payload.get("name", "")
        status = _normalise_status(status_name)
        home_score = _score_or_none(home) if status != "scheduled" else None
        away_score = _score_or_none(away) if status != "scheduled" else None
        # ESPN sets `winner` on finished games and resolves penalty shootouts, so
        # it is more reliable than comparing regulation scores for knockouts.
        home_winner = bool(home.get("winner")) if status == "finished" else None
        away_winner = bool(away.get("winner")) if status == "finished" else None

        home_team = hydrate_team_ref(name=home["team"].get("displayName"), code=home["team"].get("abbreviation"))
        away_team = hydrate_team_ref(name=away["team"].get("displayName"), code=away["team"].get("abbreviation"))

        fixtures.append({
            "id": event["id"],
            "kickoff": event["date"],
            "status": status,
            "espnStatus": status_name,
            "minute": competition.get("status", {}).get("displayClock") if status == "live" else None,
            "homeTeam": home_team["team"],
            "homeCode": home_team["code"],
            "awayTeam": away_team["team"],
            "awayCode": away_team["code"],
            "homeScore": home_score,
            "awayScore": away_score,
            "homeWinner": home_winner,
            "awayWinner": away_winner,
            "stage": _normalise_stage(event),
            "group": None,
            "events": []
        })

    return fixtures


def get_fixtures() -> list[dict[str, Any]]:
    # The full sweepstake state is driven by the persisted fixture file. Daily
    # ESPN reads are used to hydrate/update that file and power /fixtures/today.
    return load_fixtures()


def get_live_fixtures() -> list[dict[str, Any]]:
    return [fixture for fixture in get_fixtures() if fixture["status"] == "live"]


def refresh_all() -> dict[str, Any]:
    fixtures = hydrate_fixtures()
    # Atomic replace: the background poller writes this file while request
    # threads read it via load_fixtures(), so a plain write would expose
    # half-written JSON and cause intermittent 500s during each poll cycle.
    atomic_write_text(FIXTURES_PATH, json.dumps(fixtures, indent=2, ensure_ascii=False) + "\n")
    return {"source": "espn", "fixtures": len(fixtures), "message": "Persisted ESPN tournament fixtures."}


def hydrate_fixtures(start: date = TOURNAMENT_START, end: date = TOURNAMENT_END) -> list[dict[str, Any]]:
    fixtures = extract_fixtures(get_scoreboard_range(start, end))

    # Match summaries (goals, cards) are only relevant once a game is under way.
    # Fetch them concurrently with a bounded pool so a full tournament refresh is
    # a handful of seconds rather than one blocking request per fixture.
    pending = [fixture for fixture in fixtures if fixture["status"] in ("finished", "live")]
    for fixture in fixtures:
        fixture["events"] = []

    if pending:
        with ThreadPoolExecutor(max_workers=SUMMARY_WORKERS) as executor:
            futures = {executor.submit(_safe_match_events, fixture["id"]): fixture for fixture in pending}
            for future in as_completed(futures):
                futures[future]["events"] = future.result()

    hydrated = [hydrate_fixture_teams(fixture) for fixture in fixtures]
    return sorted(hydrated, key=lambda item: item["kickoff"])


def _safe_match_events(event_id: str) -> list[dict[str, Any]]:
    # Degrade a single fixture's events to empty on any failure (network OR a
    # malformed/parse error in the summary payload) so one bad event can't abort
    # the whole tournament refresh.
    try:
        return extract_match_events(get_match_summary(event_id))
    except (requests.RequestException, ValueError, KeyError, TypeError):
        return []


def extract_match_events(summary: dict[str, Any]) -> list[dict[str, Any]]:
    events = []
    seen = set()

    for play in summary.get("keyEvents", []):
        play_type = (play.get("type", {}).get("type") or "").lower()
        if play.get("scoringPlay") is True or play_type in {"goal", "goal---header", "own-goal"}:
            event_type = "goal"
        elif play_type == "red-card":
            event_type = "red_card"
        elif play_type == "yellow-card":
            event_type = "yellow_card"
        else:
            continue

        team = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
        if not team["team"]:
            continue

        event = {
            "team": team["team"],
            "teamCode": team["code"],
            "type": event_type,
            "minute": _event_minute(play),
        }
        player = _event_player(play)
        if player:
            event["player"] = player

        dedupe_key = (event["team"], event["type"], event["minute"], event.get("player"))
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        events.append(event)

    return events


def _normalise_status(status_name: str) -> str:
    status = status_name.upper()
    if "FINAL" in status or "FULL_TIME" in status or "POST" in status:
        return "finished"
    if "IN_PROGRESS" in status or "HALFTIME" in status or "LIVE" in status:
        return "live"
    return "scheduled"


def _score_or_none(competitor: dict[str, Any]) -> int | None:
    score = competitor.get("score")
    if score in (None, ""):
        return None
    try:
        return int(score)
    except (TypeError, ValueError):
        return None


# ESPN season slugs vary in hyphenation ("quarter-finals" vs "quarterfinals"),
# so we match on an alphanumeric-only key. The canonical values MUST match the
# keys in sweepstake.STAGE_RANKS or elimination/underdog ranking silently breaks
# (a plain .title() yields "Round Of 16", which would not match "Round of 16").
_STAGE_BY_SLUG = {
    "groupstage": "Group stage",
    "roundof32": "Round of 32",
    "roundof16": "Round of 16",
    "quarterfinals": "Quarter-final",
    "quarterfinal": "Quarter-final",
    "semifinals": "Semi-final",
    "semifinal": "Semi-final",
    "final": "Final",
    "thirdplace": "Third place",
    "3rdplace": "Third place",
}


def _normalise_stage(event: dict[str, Any]) -> str:
    slug = event.get("season", {}).get("slug")
    if slug:
        key = re.sub(r"[^a-z0-9]", "", slug.lower())
        if key in _STAGE_BY_SLUG:
            return _STAGE_BY_SLUG[key]
        return slug.replace("-", " ").title()
    return (event.get("league") or {}).get("name") or "World Cup"


def _event_minute(play: dict[str, Any]) -> int:
    display = play.get("clock", {}).get("displayValue") or ""
    match = re.search(r"\d+", display)
    if match:
        return int(match.group(0))

    value = play.get("clock", {}).get("value")
    if isinstance(value, (int, float)):
        return int((value + 59) // 60)

    return 0


def _event_player(play: dict[str, Any]) -> str | None:
    participants = play.get("participants") or []
    if not participants:
        return None
    return participants[0].get("athlete", {}).get("displayName")

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


def get_fixture_detail(event_id: str) -> dict[str, Any] | None:
    fixture = next((item for item in get_fixtures() if str(item.get("id")) == str(event_id)), None)
    if fixture is None:
        return None

    summary = get_match_summary(str(event_id))
    refreshed_fixture = {
        **fixture,
        "events": extract_match_events(summary),
        "lineups": extract_match_lineups(summary),
    }
    return {
        "fixture": hydrate_fixture_teams(refreshed_fixture),
        "lineups": refreshed_fixture["lineups"],
    }


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
        status = _normalise_status(status_payload)
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
            "events": [],
            "lineups": {},
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
        fixture["lineups"] = {}

    if pending:
        with ThreadPoolExecutor(max_workers=SUMMARY_WORKERS) as executor:
            futures = {executor.submit(_safe_match_detail, fixture["id"]): fixture for fixture in pending}
            for future in as_completed(futures):
                detail = future.result()
                futures[future]["events"] = detail["events"]
                futures[future]["lineups"] = detail["lineups"]

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


def _safe_match_detail(event_id: str) -> dict[str, Any]:
    try:
        summary = get_match_summary(event_id)
        return {
            "events": extract_match_events(summary),
            "lineups": extract_match_lineups(summary),
        }
    except (requests.RequestException, ValueError, KeyError, TypeError):
        return {"events": [], "lineups": {}}


def extract_match_events(summary: dict[str, Any]) -> list[dict[str, Any]]:
    events = []
    seen = set()

    for play in summary.get("keyEvents", []):
        play_type = (play.get("type", {}).get("type") or "").lower()
        if play_type == "own-goal":
            event_type = "own_goal"
            team = _own_goal_responsible_team(summary, play)
            beneficiary = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
        elif play.get("scoringPlay") is True or play_type in {"goal", "goal---header"}:
            event_type = "goal"
            team = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
        elif play_type == "red-card":
            event_type = "red_card"
            team = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
        elif play_type == "yellow-card":
            event_type = "yellow_card"
            team = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
        elif play_type == "substitution":
            team = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
            if not team["team"]:
                continue

            minute = _event_minute(play)
            sub_in_player, sub_out_player = _substitution_players(play)
            if sub_in_player:
                event = {
                    "team": team["team"],
                    "teamCode": team["code"],
                    "type": "sub_on",
                    "minute": minute,
                    "player": sub_in_player,
                }
                dedupe_key = (event["team"], event["type"], event["minute"], event.get("player"))
                if dedupe_key not in seen:
                    seen.add(dedupe_key)
                    events.append(event)

            if sub_out_player:
                event = {
                    "team": team["team"],
                    "teamCode": team["code"],
                    "type": "sub_off",
                    "minute": minute,
                    "player": sub_out_player,
                }
                dedupe_key = (event["team"], event["type"], event["minute"], event.get("player"))
                if dedupe_key not in seen:
                    seen.add(dedupe_key)
                    events.append(event)
            continue
        else:
            continue

        if not team["team"]:
            continue

        event = {
            "team": team["team"],
            "teamCode": team["code"],
            "type": event_type,
            "minute": _event_minute(play),
        }
        if event_type == "own_goal" and beneficiary["team"]:
            event["beneficiaryTeam"] = beneficiary["team"]
            event["beneficiaryTeamCode"] = beneficiary["code"]
        player = _event_player(play)
        if player:
            event["player"] = player

        dedupe_key = (event["team"], event["type"], event["minute"], event.get("player"))
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        events.append(event)

    return events


def extract_match_lineups(summary: dict[str, Any]) -> dict[str, dict[str, Any]]:
    lineups: dict[str, dict[str, Any]] = {}

    for roster in summary.get("rosters", []):
        side = (roster.get("homeAway") or "").lower()
        if side not in {"home", "away"}:
            continue

        team = hydrate_team_ref(
            name=roster.get("team", {}).get("displayName"),
            code=roster.get("team", {}).get("abbreviation"),
        )

        players = [_normalise_lineup_player(player) for player in roster.get("roster", [])]
        starters = sorted((player for player in players if player["starter"]), key=_lineup_sort_key)
        bench = sorted((player for player in players if not player["starter"]), key=_lineup_sort_key)

        lineups[side] = {
            "team": team["team"],
            "teamCode": team["code"],
            "teamLogo": team["logo"],
            "formation": roster.get("formation"),
            "winner": bool(roster.get("winner")) if roster.get("winner") is not None else None,
            "starters": starters,
            "bench": bench,
        }

    return lineups

def _own_goal_responsible_team(summary: dict[str, Any], play: dict[str, Any]) -> dict[str, Any]:
    beneficiary = hydrate_team_ref(name=play.get("team", {}).get("displayName"), code=play.get("team", {}).get("abbreviation"))
    competitors = (((summary.get("header") or {}).get("competitions") or [{}])[0].get("competitors") or [])

    for competitor in competitors:
        team = hydrate_team_ref(name=competitor.get("team", {}).get("displayName"), code=competitor.get("team", {}).get("abbreviation"))
        if not team["team"]:
            continue
        if beneficiary["code"] and team["code"] == beneficiary["code"]:
            continue
        if team["team"] == beneficiary["team"]:
            continue
        return team

    # Fallback if the summary payload is missing competitors. This preserves the
    # prior behaviour rather than dropping the event entirely.
    return beneficiary


def _normalise_lineup_player(player: dict[str, Any]) -> dict[str, Any]:
    athlete = player.get("athlete", {})
    position = player.get("position", {})

    return {
        "id": athlete.get("id"),
        "name": athlete.get("displayName") or athlete.get("fullName") or athlete.get("shortName") or "Unknown player",
        "shortName": athlete.get("shortName") or athlete.get("displayName") or athlete.get("fullName") or "Unknown player",
        "jersey": player.get("jersey"),
        "starter": bool(player.get("starter")),
        "subbedIn": bool(player.get("subbedIn")),
        "subbedOut": bool(player.get("subbedOut")),
        "formationPlace": player.get("formationPlace"),
        "position": position.get("displayName") or position.get("name"),
        "positionCode": position.get("abbreviation"),
    }


def _lineup_sort_key(player: dict[str, Any]) -> tuple[int, str]:
    place = player.get("formationPlace")
    try:
        numeric_place = int(str(place))
    except (TypeError, ValueError):
        numeric_place = 999

    name = str(player.get("name") or "")
    return numeric_place, name


def _normalise_status(status_type: dict[str, Any]) -> str:
    # Prefer ESPN's canonical state ("pre" | "in" | "post") — it covers every
    # in-play phase (first half, second half, extra time, penalties, ...).
    # String-matching the status name missed phases like STATUS_FIRST_HALF and
    # wrongly reported live games as scheduled.
    state = (status_type.get("state") or "").lower()
    if state == "in":
        return "live"
    if state == "post" or status_type.get("completed") is True:
        return "finished"
    if state == "pre":
        return "scheduled"

    # Fallback for any payload missing `state`: match on the status name.
    name = (status_type.get("name") or "").upper()
    if "FINAL" in name or "FULL_TIME" in name or "POST" in name:
        return "finished"
    if "HALF" in name or "PROGRESS" in name or "LIVE" in name or "EXTRA" in name or "PENALT" in name:
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


def _substitution_players(play: dict[str, Any]) -> tuple[str | None, str | None]:
    participants = play.get("participants") or []
    names = [participant.get("athlete", {}).get("displayName") for participant in participants if participant.get("athlete", {}).get("displayName")]

    if len(names) >= 2:
        return names[0], names[1]

    text = (play.get("text") or "").strip()
    match = re.search(r"\.\s*(?P<in>.+?)\s+replaces\s+(?P<out>.+?)(?:\.|$)", text)
    if match:
        return match.group("in").strip(), match.group("out").strip()

    return (names[0], None) if names else (None, None)

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

import requests

from .data_loader import load_fixtures, load_team_aliases

BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world"
TIMEOUT_SECONDS = 10
TOURNAMENT_START = date(2026, 6, 11)
TOURNAMENT_END = date(2026, 7, 19)
FIXTURES_PATH = Path(__file__).resolve().parents[1] / "data" / "fixtures.json"


def get_scoreboard(date_yyyymmdd: str | None = None) -> dict[str, Any]:
    url = f"{BASE}/scoreboard"
    params = {}

    if date_yyyymmdd:
        params["dates"] = date_yyyymmdd

    response = requests.get(url, params=params, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()


def get_scoreboard_range(start: date = TOURNAMENT_START, end: date = TOURNAMENT_END) -> dict[str, Any]:
    return get_scoreboard(f"{start:%Y%m%d}-{end:%Y%m%d}")


def get_today_scoreboard() -> dict[str, Any]:
    today = date.today().strftime("%Y%m%d")
    return get_scoreboard(today)


def get_match_summary(event_id: str) -> dict[str, Any]:
    url = f"{BASE}/summary"
    response = requests.get(url, params={"event": event_id}, timeout=TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()


def extract_fixtures(scoreboard: dict[str, Any], aliases: dict[str, str] | None = None) -> list[dict[str, Any]]:
    aliases = aliases or load_team_aliases()
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

        fixtures.append({
            "id": event["id"],
            "kickoff": event["date"],
            "status": status,
            "espnStatus": status_name,
            "minute": competition.get("status", {}).get("displayClock") if status == "live" else None,
            "homeTeam": _normalise_team(home["team"]["displayName"], aliases),
            "awayTeam": _normalise_team(away["team"]["displayName"], aliases),
            "homeScore": home_score,
            "awayScore": away_score,
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


def get_standings() -> dict[str, Any]:
    # TODO: ESPN's public site API is enough for fixtures, but standings may need another endpoint/provider.
    return {"source": "espn", "groups": []}


def refresh_all() -> dict[str, Any]:
    fixtures = hydrate_fixtures()
    FIXTURES_PATH.write_text(json.dumps(fixtures, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"source": "espn", "fixtures": len(fixtures), "message": "Persisted ESPN tournament fixtures."}


def hydrate_fixtures(start: date = TOURNAMENT_START, end: date = TOURNAMENT_END) -> list[dict[str, Any]]:
    aliases = load_team_aliases()
    fixtures = extract_fixtures(get_scoreboard_range(start, end), aliases)

    for fixture in fixtures:
        if fixture["status"] not in ("finished", "live"):
            continue
        try:
            summary = get_match_summary(fixture["id"])
            fixture["events"] = extract_match_events(summary, aliases)
        except requests.RequestException:
            fixture["events"] = []

    return sorted(fixtures, key=lambda item: item["kickoff"])


def extract_match_events(summary: dict[str, Any], aliases: dict[str, str] | None = None) -> list[dict[str, Any]]:
    aliases = aliases or load_team_aliases()
    events = []
    seen = set()

    for play in summary.get("keyEvents", []):
        play_type = (play.get("type", {}).get("type") or "").lower()
        if play.get("scoringPlay") is True or play_type in {"goal", "goal---header", "own-goal"}:
            event_type = "goal"
        elif play_type == "red-card":
            event_type = "red_card"
        else:
            continue

        team = _normalise_team(play.get("team", {}).get("displayName", ""), aliases)
        if not team:
            continue

        event = {
            "team": team,
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


def _normalise_team(team: str, aliases: dict[str, str]) -> str:
    return aliases.get(team, team)


def _normalise_stage(event: dict[str, Any]) -> str:
    slug = event.get("season", {}).get("slug")
    if slug == "group-stage":
        return "Group stage"
    if slug:
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

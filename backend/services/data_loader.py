import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def load_json(filename: str) -> Any:
    path = DATA_DIR / filename
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise RuntimeError(f"Missing data file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid JSON in {path}: {exc}") from exc


def load_draw() -> dict[str, list[dict[str, Any]]]:
    return hydrate_draw(load_json("draw.json"))


def load_fixtures() -> list[dict[str, Any]]:
    fixtures = load_json("fixtures.json")
    return [hydrate_fixture_teams(fixture) for fixture in fixtures]


def load_countries() -> list[dict[str, Any]]:
    return load_json("countries.json")


def load_team_aliases() -> dict[str, str]:
    return load_json("team_aliases.json")


def build_team_lookup(
    draw: dict[str, list[dict[str, Any]]]
) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for owner, teams in draw.items():
        for team in teams:
            entry = {"owner": owner, "pot": team["pot"], "team": team["team"], "code": team.get("code")}
            lookup[team["team"]] = entry
            if team.get("code"):
                lookup[team["code"]] = entry

    return lookup


@lru_cache(maxsize=1)
def build_country_indexes() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    countries = load_countries()
    by_name: dict[str, dict[str, Any]] = {}
    by_code: dict[str, dict[str, Any]] = {}

    for country in countries:
        entry = {"name": country["name"], "code": country["code"], "aliases": country.get("aliases", [])}
        by_name[country["name"].casefold()] = entry
        by_code[country["code"].upper()] = entry
        for alias in country.get("aliases", []):
            by_name[alias.casefold()] = entry

    return by_name, by_code


def resolve_country(name: str | None = None, code: str | None = None) -> dict[str, Any] | None:
    by_name, by_code = build_country_indexes()

    if code:
        matched_by_code = by_code.get(code.upper())
        if matched_by_code:
            return matched_by_code

    if name:
        matched_by_name = by_name.get(name.casefold())
        if matched_by_name:
            return matched_by_name

    return None


def hydrate_team_ref(name: str | None = None, code: str | None = None) -> dict[str, Any]:
    country = resolve_country(name=name, code=code)
    if country:
        resolved_code = country["code"]
        return {"team": country["name"], "code": resolved_code, "logo": _espn_team_logo_url(resolved_code)}

    fallback_name = name or code or "Unknown"
    fallback_code = _fallback_team_code(fallback_name)
    logo = _espn_team_logo_url(code.upper()) if code and len(code) == 3 and code.isalpha() else None
    return {"team": fallback_name, "code": fallback_code, "logo": logo}


def hydrate_draw(draw: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    hydrated: dict[str, list[dict[str, Any]]] = {}
    for owner, teams in draw.items():
        hydrated[owner] = []
        for team in teams:
            ref = hydrate_team_ref(name=team.get("team"), code=team.get("code"))
            hydrated[owner].append({**team, **ref})
    return hydrated


def hydrate_fixture_teams(fixture: dict[str, Any]) -> dict[str, Any]:
    home = hydrate_team_ref(name=fixture.get("homeTeam"), code=fixture.get("homeCode"))
    away = hydrate_team_ref(name=fixture.get("awayTeam"), code=fixture.get("awayCode"))

    events = []
    for event in fixture.get("events", []):
        team = hydrate_team_ref(name=event.get("team"), code=event.get("teamCode"))
        events.append({**event, "team": team["team"], "teamCode": team["code"], "teamLogo": team["logo"]})

    lineups: dict[str, dict[str, Any]] = {}
    for side, lineup in (fixture.get("lineups") or {}).items():
        team = hydrate_team_ref(name=lineup.get("team"), code=lineup.get("teamCode"))
        lineups[side] = {
            **lineup,
            "team": team["team"],
            "teamCode": team["code"],
            "teamLogo": team["logo"],
        }

    return {
        **fixture,
        "homeTeam": home["team"],
        "homeCode": home["code"],
        "homeLogo": home["logo"],
        "awayTeam": away["team"],
        "awayCode": away["code"],
        "awayLogo": away["logo"],
        "events": events,
        "lineups": lineups,
    }


def _espn_team_logo_url(code: str | None) -> str | None:
    if not code or len(code) != 3 or not code.isalpha():
        return None
    return f"https://a.espncdn.com/i/teamlogos/countries/500/{code.lower()}.png"


def _fallback_team_code(name: str) -> str:
    words = [word for word in "".join(char if char.isalpha() or char.isspace() else " " for char in name).split() if word]
    if not words:
        return "TBD"
    if len(words) == 1:
        return words[0][:3].upper().ljust(3, "X")
    return "".join(word[0] for word in words)[:3].upper().ljust(3, "X")

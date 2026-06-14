import json
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
    return load_json("draw.json")


def load_fixtures() -> list[dict[str, Any]]:
    return load_json("fixtures.json")


def load_team_aliases() -> dict[str, str]:
    return load_json("team_aliases.json")


def build_team_lookup(
    draw: dict[str, list[dict[str, Any]]],
    aliases: dict[str, str] | None = None
) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for owner, teams in draw.items():
        for team in teams:
            lookup[team["team"]] = {"owner": owner, "pot": team["pot"], "team": team["team"]}

    for alias, canonical in (aliases or {}).items():
        if canonical in lookup:
            lookup[alias] = lookup[canonical]

    return lookup

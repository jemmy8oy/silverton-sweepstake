from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def parse_kickoff(value: str) -> datetime:
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    return datetime.fromisoformat(value)


def readable_kickoff(value: str, tz_name: str = "Europe/London") -> str:
    kickoff = parse_kickoff(value).astimezone(ZoneInfo(tz_name))
    return kickoff.strftime("%a %d %b, %H:%M")


def is_today(value: str, tz_name: str = "Europe/London") -> bool:
    now = datetime.now(timezone.utc).astimezone(ZoneInfo(tz_name)).date()
    kickoff_date = parse_kickoff(value).astimezone(ZoneInfo(tz_name)).date()
    return kickoff_date == now


def normalise_team_name(team: str, aliases: dict[str, str]) -> str:
    return aliases.get(team, team)

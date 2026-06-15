from collections import defaultdict
from typing import Any

from .normalise import is_today, readable_kickoff


STAGE_RANKS = {
    "Group stage": 1,
    "Round of 32": 2,
    "Round of 16": 3,
    "Quarter-final": 4,
    "Semi-final": 5,
    # Third-place playoff is contested by the semi-final losers, so it ranks
    # alongside the semis. It must be present (and >= a knockout rank) or its
    # loser is never marked eliminated. Keep in sync with football_api stage map.
    "Third place": 5,
    "Final": 6
}


def enrich_fixture(fixture: dict[str, Any], team_lookup: dict[str, dict[str, Any]]) -> dict[str, Any]:
    home = team_lookup.get(fixture.get("homeCode")) or team_lookup.get(fixture["homeTeam"], {})
    away = team_lookup.get(fixture.get("awayCode")) or team_lookup.get(fixture["awayTeam"], {})
    home_owner = home.get("owner", "Unassigned")
    away_owner = away.get("owner", "Unassigned")

    return {
        **fixture,
        "homeTeamCode": fixture.get("homeCode"),
        "homeTeamLogo": fixture.get("homeLogo"),
        "awayTeamCode": fixture.get("awayCode"),
        "awayTeamLogo": fixture.get("awayLogo"),
        "homeOwner": home_owner,
        "awayOwner": away_owner,
        "homePot": home.get("pot"),
        "awayPot": away.get("pot"),
        "isOwnerVsOwner": home_owner != "Unassigned" and away_owner != "Unassigned" and home_owner != away_owner,
        "isSelfMatch": home_owner != "Unassigned" and home_owner == away_owner,
        "displayTitle": f"{fixture['homeTeam']} vs {fixture['awayTeam']}",
        "readableKickoff": readable_kickoff(fixture["kickoff"])
    }


def enrich_fixtures(fixtures: list[dict[str, Any]], team_lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted((enrich_fixture(fixture, team_lookup) for fixture in fixtures), key=lambda item: item["kickoff"])


def _empty_team_stats(team: str, code: str | None, logo: str | None, owner: str, pot: int) -> dict[str, Any]:
    return {
        "team": team,
        "code": code,
        "logo": logo,
        "owner": owner,
        "pot": pot,
        "played": 0,
        "wins": 0,
        "draws": 0,
        "losses": 0,
        "goalsFor": 0,
        "goalsAgainst": 0,
        "goalDifference": 0,
        "points": 0,
        "yellowCards": 0,
        "redCards": 0,
        "furthestStage": "Group stage",
        "furthestStageRank": STAGE_RANKS["Group stage"],
        "alive": True
    }


def compute_team_stats(draw: dict[str, list[dict[str, Any]]], fixtures: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    stats: dict[str, dict[str, Any]] = {}
    for owner, teams in draw.items():
        for team in teams:
            stats[team["team"]] = _empty_team_stats(team["team"], team.get("code"), team.get("logo"), owner, team["pot"])

    for fixture in fixtures:
        for event in fixture.get("events", []):
            team = event.get("team")
            if team in stats and event.get("type") == "red_card":
                stats[team]["redCards"] += 1
            if team in stats and event.get("type") == "yellow_card":
                stats[team]["yellowCards"] += 1

        if fixture["status"] not in ("finished", "live"):
            continue
        if fixture["homeScore"] is None or fixture["awayScore"] is None:
            continue

        home_team = fixture["homeTeam"]
        away_team = fixture["awayTeam"]
        if home_team not in stats or away_team not in stats:
            continue

        home = stats[home_team]
        away = stats[away_team]
        stage_rank = STAGE_RANKS.get(fixture.get("stage", "Group stage"), 1)
        for team_stats in (home, away):
            team_stats["furthestStage"] = fixture.get("stage", team_stats["furthestStage"])
            team_stats["furthestStageRank"] = max(team_stats["furthestStageRank"], stage_rank)

        home["played"] += 1
        away["played"] += 1
        home["goalsFor"] += fixture["homeScore"]
        home["goalsAgainst"] += fixture["awayScore"]
        away["goalsFor"] += fixture["awayScore"]
        away["goalsAgainst"] += fixture["homeScore"]

        if fixture["homeScore"] > fixture["awayScore"]:
            home["wins"] += 1
            home["points"] += 3
            away["losses"] += 1
        elif fixture["homeScore"] < fixture["awayScore"]:
            away["wins"] += 1
            away["points"] += 3
            home["losses"] += 1
        else:
            home["draws"] += 1
            away["draws"] += 1
            home["points"] += 1
            away["points"] += 1

    eliminated = _eliminated_teams(fixtures)
    for team_stats in stats.values():
        team_stats["goalDifference"] = team_stats["goalsFor"] - team_stats["goalsAgainst"]
        team_stats["alive"] = team_stats["team"] not in eliminated

    return stats


def _eliminated_teams(fixtures: list[dict[str, Any]]) -> set[str]:
    # A team is only definitively out when it loses a knockout tie. Group-stage
    # results don't eliminate on their own (advancement needs full standings),
    # so we never falsely knock a team out during the groups — a strict
    # improvement over the old "two losses = out" placeholder.
    eliminated: set[str] = set()
    for fixture in fixtures:
        if fixture.get("status") != "finished":
            continue
        if STAGE_RANKS.get(fixture.get("stage", "Group stage"), 1) < STAGE_RANKS["Round of 32"]:
            continue
        loser = _knockout_loser(fixture)
        if loser:
            eliminated.add(loser)
    return eliminated


def _knockout_loser(fixture: dict[str, Any]) -> str | None:
    home, away = fixture.get("homeTeam"), fixture.get("awayTeam")
    home_winner, away_winner = fixture.get("homeWinner"), fixture.get("awayWinner")

    # Prefer ESPN's authoritative winner flag (it resolves penalty shootouts).
    if home_winner is True and away_winner is False:
        return away
    if away_winner is True and home_winner is False:
        return home

    # Fall back to the regulation score only when it's decisive. A drawn score
    # with no winner flag means we can't tell who advanced, so keep both alive.
    home_score, away_score = fixture.get("homeScore"), fixture.get("awayScore")
    if home_score is not None and away_score is not None and home_score != away_score:
        return away if home_score > away_score else home
    return None


def build_owner_summaries(draw: dict[str, list[dict[str, Any]]], fixtures: list[dict[str, Any]], enriched: list[dict[str, Any]]) -> list[dict[str, Any]]:
    team_stats = compute_team_stats(draw, fixtures)
    summaries = []

    for owner, teams in draw.items():
        owned_stats = [team_stats[team["team"]] for team in teams]
        summaries.append({
            "owner": owner,
            "teamCount": len(teams),
            "teams": [
                {
                    **team,
                    "stats": team_stats[team["team"]],
                    "alive": team_stats[team["team"]]["alive"]
                }
                for team in teams
            ],
            "teamsByPot": _group_teams_by_pot(teams),
            "teamsStillAlive": sum(1 for team in owned_stats if team["alive"]),
            "wins": sum(team["wins"] for team in owned_stats),
            "draws": sum(team["draws"] for team in owned_stats),
            "losses": sum(team["losses"] for team in owned_stats),
            "points": sum(team["points"] for team in owned_stats),
            "goalsFor": sum(team["goalsFor"] for team in owned_stats),
            "goalsAgainst": sum(team["goalsAgainst"] for team in owned_stats),
            "yellowCards": sum(team["yellowCards"] for team in owned_stats),
            "redCards": sum(team["redCards"] for team in owned_stats),
            "upcomingMatches": _matches_for_owner(owner, enriched, "scheduled"),
            "liveMatches": _matches_for_owner(owner, enriched, "live"),
            "completedResults": _matches_for_owner(owner, enriched, "finished"),
            "headToHeads": _head_to_heads_for_owner(owner, enriched),
            "bestTeam": _best_team(owned_stats),
            "worstTeam": _worst_team(owned_stats)
        })

    return sorted(summaries, key=lambda item: (-item["points"], -item["teamsStillAlive"], item["owner"]))


def get_owner_detail(owner: str, owner_summaries: list[dict[str, Any]]) -> dict[str, Any] | None:
    for summary in owner_summaries:
        if summary["owner"].lower() == owner.lower():
            return summary
    return None


def build_leaderboards(draw: dict[str, list[dict[str, Any]]], fixtures: list[dict[str, Any]], enriched: list[dict[str, Any]]) -> dict[str, Any]:
    owner_summaries = build_owner_summaries(draw, fixtures, enriched)
    team_stats = compute_team_stats(draw, fixtures)
    teams = list(team_stats.values())

    return {
        "overall": owner_summaries,
        "underdog": build_underdog_tracker(draw, fixtures),
        "mostGoalsScored": sorted(teams, key=lambda team: (-team["goalsFor"], team["team"]))[:10],
        "mostGoalsConceded": sorted(teams, key=lambda team: (-team["goalsAgainst"], team["team"]))[:10],
        "mostRedCards": sorted(teams, key=lambda team: (-team["redCards"], team["team"]))[:10],
        "worstPerformingTeam": sorted(teams, key=lambda team: (team["points"], team["goalDifference"], team["goalsFor"], team["team"]))[:10],
        "teamsStillAliveByOwner": [
            {"owner": owner["owner"], "teamsStillAlive": owner["teamsStillAlive"], "teamCount": owner["teamCount"]}
            for owner in owner_summaries
        ]
    }


def build_underdog_tracker(draw: dict[str, list[dict[str, Any]]], fixtures: list[dict[str, Any]]) -> dict[str, Any]:
    team_stats = list(compute_team_stats(draw, fixtures).values())
    ranked = sorted(
        team_stats,
        key=lambda team: (
            -team["furthestStageRank"],
            -team["pot"],
            -team["wins"],
            -team["goalDifference"],
            team["team"]
        )
    )
    leader = ranked[0] if ranked else None
    tied = []
    if leader:
        tied = [
            team for team in ranked
            if team["furthestStageRank"] == leader["furthestStageRank"]
            and team["pot"] == leader["pot"]
            and team["wins"] == leader["wins"]
            and team["goalDifference"] == leader["goalDifference"]
        ]

    return {
        "leader": leader,
        "isSplit": len(tied) > 1,
        "splitWith": tied,
        "standings": ranked[:12],
        "rules": [
            "Lowest-pot team that goes furthest wins",
            "Tiebreak: lower pot, wins, goal difference, then split"
        ]
    }


def next_owner_vs_owner(enriched: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    matches = [
        fixture for fixture in enriched
        if fixture["status"] == "scheduled" and (fixture["isOwnerVsOwner"] or fixture["isSelfMatch"])
    ]
    return matches[:limit]


def today_fixtures(enriched: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [fixture for fixture in enriched if is_today(fixture["kickoff"])]


def live_fixtures(enriched: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [fixture for fixture in enriched if fixture["status"] == "live"]


def _group_teams_by_pot(teams: list[dict[str, Any]]) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = defaultdict(list)
    for team in teams:
        grouped[str(team["pot"])].append(team["team"])
    return dict(sorted(grouped.items(), key=lambda item: item[0]))


def _matches_for_owner(owner: str, fixtures: list[dict[str, Any]], status: str) -> list[dict[str, Any]]:
    return [
        fixture for fixture in fixtures
        if fixture["status"] == status and (fixture["homeOwner"] == owner or fixture["awayOwner"] == owner)
    ]


def _head_to_heads_for_owner(owner: str, fixtures: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        fixture for fixture in fixtures
        if (fixture["isOwnerVsOwner"] or fixture["isSelfMatch"])
        and (fixture["homeOwner"] == owner or fixture["awayOwner"] == owner)
    ]


def _best_team(teams: list[dict[str, Any]]) -> dict[str, Any] | None:
    return sorted(teams, key=lambda team: (-team["points"], -team["goalDifference"], -team["goalsFor"], team["team"]))[0] if teams else None


def _worst_team(teams: list[dict[str, Any]]) -> dict[str, Any] | None:
    return sorted(teams, key=lambda team: (team["points"], team["goalDifference"], team["goalsFor"], team["team"]))[0] if teams else None

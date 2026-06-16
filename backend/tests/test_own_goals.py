import unittest

from services.football_api import extract_match_events
from services.sweepstake import compute_team_stats


class OwnGoalTests(unittest.TestCase):
    def test_extract_match_events_assigns_own_goal_to_responsible_team(self):
        summary = {
            "header": {
                "competitions": [
                    {
                        "competitors": [
                            {"team": {"displayName": "United States", "abbreviation": "USA"}},
                            {"team": {"displayName": "Paraguay", "abbreviation": "PAR"}},
                        ]
                    }
                ]
            },
            "keyEvents": [
                {
                    "clock": {"displayValue": "7'"},
                    "text": "Own Goal by Damián Bobadilla, Paraguay. USA 1, Paraguay 0.",
                    "team": {"displayName": "United States", "abbreviation": "USA"},
                    "type": {"type": "own-goal"},
                    "participants": [{"athlete": {"displayName": "Damián Bobadilla"}}],
                }
            ],
        }

        self.assertEqual(
            extract_match_events(summary),
            [
                {
                    "team": "Paraguay",
                    "teamCode": "PAR",
                    "type": "own_goal",
                    "minute": 7,
                    "beneficiaryTeam": "United States",
                    "beneficiaryTeamCode": "USA",
                    "player": "Damián Bobadilla",
                }
            ],
        )

    def test_compute_team_stats_counts_own_goals_for_owner(self):
        draw = {
            "Scarlett": [{"team": "Paraguay", "code": "PAR", "pot": 2}],
            "Arnav": [{"team": "United States", "code": "USA", "pot": 2}],
        }
        fixtures = [
            {
                "id": "760417",
                "homeTeam": "United States",
                "homeCode": "USA",
                "awayTeam": "Paraguay",
                "awayCode": "PAR",
                "status": "finished",
                "stage": "Group stage",
                "kickoff": "2026-06-13T01:00Z",
                "homeScore": 4,
                "awayScore": 1,
                "homeWinner": True,
                "awayWinner": False,
                "events": [
                    {
                        "team": "Paraguay",
                        "teamCode": "PAR",
                        "type": "own_goal",
                        "minute": 7,
                        "beneficiaryTeam": "United States",
                        "beneficiaryTeamCode": "USA",
                        "player": "Damián Bobadilla",
                    }
                ],
            }
        ]

        stats = compute_team_stats(draw, fixtures)

        self.assertEqual(stats["Paraguay"]["ownGoals"], 1)
        self.assertEqual(stats["United States"]["ownGoals"], 0)


if __name__ == "__main__":
    unittest.main()

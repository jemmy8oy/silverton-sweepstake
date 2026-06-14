import { getLeaderboards, getUnderdog } from "@/lib/api";
import OwnerAvatar from "@/components/OwnerAvatar";
import TeamLogo from "@/components/TeamLogo";
import type { Leaderboards, OwnerSummary, TeamStats, UnderdogTracker } from "@/lib/types";

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function ratio(part: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function emptyUnderdog(): UnderdogTracker {
  return {
    leader: null,
    isSplit: false,
    splitWith: [],
    standings: [],
    rules: []
  };
}

const emptyLeaderboards: Leaderboards = {
  overall: [],
  underdog: emptyUnderdog(),
  mostGoalsScored: [],
  mostGoalsConceded: [],
  mostRedCards: [],
  worstPerformingTeam: [],
  teamsStillAliveByOwner: []
};

function TeamBubble({ team, code, logo }: { team: string; code?: string; logo?: string | null }) {
  return <TeamLogo team={team} code={code} logo={logo} className="leader-team-bubble" />;
}

function nextTeam(owner: OwnerSummary) {
  const fixture = owner.upcomingMatches[0];
  if (!fixture) {
    return null;
  }

  const ownsHome = fixture.homeOwner === owner.owner && fixture.awayOwner !== owner.owner;
  if (ownsHome) {
    return {
      team: fixture.homeTeam,
      code: fixture.homeTeamCode ?? fixture.homeCode,
      logo: fixture.homeTeamLogo ?? fixture.homeLogo
    };
  }

  if (fixture.awayOwner === owner.owner) {
    return {
      team: fixture.awayTeam,
      code: fixture.awayTeamCode ?? fixture.awayCode,
      logo: fixture.awayTeamLogo ?? fixture.awayLogo
    };
  }

  return {
    team: fixture.homeTeam,
    code: fixture.homeTeamCode ?? fixture.homeCode,
    logo: fixture.homeTeamLogo ?? fixture.homeLogo
  };
}

function OverallRow({ owner, rank }: { owner: OwnerSummary; rank: number }) {
  const next = nextTeam(owner);
  const played = owner.wins + owner.draws + owner.losses;
  const goalDifference = owner.goalsFor - owner.goalsAgainst;

  return (
    <tr>
      <td>
        <div className="leader-owner-cell">
          <OwnerAvatar owner={owner.owner} className={rank === 1 ? "leader-avatar first" : "leader-avatar"} />
          <div>
            <strong>{owner.owner}</strong>
          </div>
        </div>
      </td>
      <td className="leader-stat">{played}</td>
      <td className="leader-stat">{owner.wins}</td>
      <td className="leader-stat">{owner.draws}</td>
      <td className="leader-stat">{owner.losses}</td>
      <td className="leader-stat">{owner.goalsFor}/{owner.goalsAgainst}</td>
      <td className="leader-stat">{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</td>
      <td className="leader-stat">{owner.yellowCards}</td>
      <td className="leader-stat">{owner.redCards}</td>
      <td className="leader-points">{owner.points}</td>
      <td className="leader-next">
        {next ? <TeamBubble team={next.team} code={next.code} logo={next.logo} /> : <span className="muted">-</span>}
      </td>
    </tr>
  );
}

function UnderdogRow({ team }: { team: TeamStats }) {
  return (
    <div className="underdog-row">
      <div>
        <TeamBubble team={team.team} code={team.code} logo={team.logo} />
        <div>
          <strong>{team.team}</strong>
          <span>{team.owner}</span>
        </div>
      </div>
      <div>
        <strong>{team.furthestStage}</strong>
        <span>Pot {team.pot}</span>
      </div>
    </div>
  );
}

function SquadStrength({ rows }: { rows: Leaderboards["teamsStillAliveByOwner"] }) {
  return (
    <section className="leader-card">
      <div className="leader-card-title">
        <span className="material-symbols-outlined" aria-hidden="true">
          groups
        </span>
        <h2>Squad Strength</h2>
      </div>
      <div className="squad-list">
        {rows.length ? (
          rows.map((row) => {
            const width = ratio(row.teamsStillAlive, row.teamCount);
            return (
              <div key={row.owner} className="squad-row">
                <div>
                  <span>{row.owner}</span>
                  <span>
                    {row.teamsStillAlive}/{row.teamCount} Alive
                  </span>
                </div>
                <div className="squad-meter">
                  <span className={width < 25 ? "danger" : ""} style={{ width: `${Math.max(width, row.teamsStillAlive ? 8 : 4)}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="muted">No squad data yet.</p>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  team,
  detail,
  tone
}: {
  icon: string;
  label: string;
  team: TeamStats | null;
  detail: string;
  tone: "green" | "red" | "gold" | "muted";
}) {
  return (
    <article className={`stat-leader-card ${tone}`}>
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <p>{label}</p>
      <strong>{team?.team ?? "No data"}</strong>
      <em>{team ? detail : "Pending"}</em>
    </article>
  );
}

export default async function LeaderboardsPage() {
  const [leaderboards, underdog] = await Promise.all([
    safe(getLeaderboards(), emptyLeaderboards),
    safe(getUnderdog(), emptyUnderdog())
  ]);

  const overall = leaderboards.overall;
  const underdogs = underdog.standings.length ? underdog.standings.slice(0, 4) : leaderboards.underdog.standings.slice(0, 4);
  const topScorer = leaderboards.mostGoalsScored[0] ?? null;
  const mostCards = leaderboards.mostRedCards[0] ?? null;
  const bestDefence = [...leaderboards.mostGoalsConceded].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0] ?? null;
  const worstTeam = leaderboards.worstPerformingTeam[0] ?? null;

  return (
    <main className="leaderboards-shell">
      <section className="leaderboards-hero">
        <h1>The Leaderboard</h1>
        <p>Real-time chaos tracking. Who is on top and who is doing shots?</p>
      </section>

      <div className="leaderboards-grid">
        <div className="leaderboards-main">
          <section className="overall-board">
            <div className="board-header">
              <div>
                <span className="material-symbols-outlined" aria-hidden="true">
                  emoji_events
                </span>
                <h2>Overall Leaderboard</h2>
              </div>
              <span>Live Standings</span>
            </div>
            <div className="leader-table-wrap">
              <table className="leader-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>PL</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>+/-</th>
                    <th>GD</th>
                    <th>YC</th>
                    <th>RC</th>
                    <th>PTS</th>
                    <th>Next</th>
                  </tr>
                </thead>
                <tbody>
                  {overall.length ? (
                    overall.map((owner, index) => <OverallRow key={owner.owner} owner={owner} rank={index + 1} />)
                  ) : (
                    <tr>
                      <td colSpan={11}>No leaderboard data yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>


          <section className="stat-leader-grid">
            <StatCard icon="sports_soccer" label="Top Scorers" team={topScorer} detail={`${topScorer?.goalsFor ?? 0} Goals`} tone="green" />
            <StatCard icon="style" label="Dirty Play" team={mostCards} detail={`${mostCards?.redCards ?? 0} Red Cards`} tone="red" />
            <StatCard icon="shield" label="Iron Wall" team={bestDefence} detail={`${bestDefence?.goalsAgainst ?? 0} Conceded`} tone="gold" />
            <StatCard icon="sentiment_very_dissatisfied" label="Worst Team" team={worstTeam} detail={`${worstTeam?.points ?? 0} Pts, ${worstTeam?.goalDifference ?? 0} GD`} tone="muted" />
          </section>
        </div>

        <aside className="leaderboards-side">
            <section className="leader-card underdog-watch">
              <div className="leader-card-title">
                <span className="material-symbols-outlined" aria-hidden="true">
                  trending_up
                </span>
                <h2>Underdog Watch</h2>
              </div>
              <div className="underdog-list">
                {underdogs.length ? underdogs.map((team) => <UnderdogRow key={`${team.owner}-${team.team}`} team={team} />) : <p className="muted">No underdog data yet.</p>}
              </div>
            </section>
            <SquadStrength rows={leaderboards.teamsStillAliveByOwner} />
        </aside>
      </div>
    </main>
  );
}

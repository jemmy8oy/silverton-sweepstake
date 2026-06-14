import Link from "next/link";
import { getFixtures, getLeaderboards, getLiveFixtures, getOwners, getTodayFixtures, getUnderdog } from "@/lib/api";
import type { EnrichedFixture, Leaderboards, OwnerSummary, UnderdogTracker } from "@/lib/types";

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function teamCode(team: string) {
  const words = team.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
  return (words.length === 1 ? words[0].slice(0, 3) : words.map((word) => word[0]).join("").slice(0, 3)).toUpperCase();
}

function statusLabel(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return `Live ${fixture.minute ? fixture.minute : ""}`.trim();
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return "Upcoming";
}

function scoreLabel(fixture: EnrichedFixture) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "VS";
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function TeamMark({ team, size = "md" }: { team: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`team-mark ${size}`} aria-label={team}>
      <span>{teamCode(team)}</span>
    </div>
  );
}

function OwnerLine({ owner }: { owner: string }) {
  return <span className="owner-line">{owner || "Unassigned"}</span>;
}

function FeaturedMatch({ fixture }: { fixture: EnrichedFixture | null }) {
  if (!fixture) return null;

  return (
    <div className="featured-match">
      <div className="live-tag">
        <span className="material-symbols-outlined" aria-hidden="true">
          videocam
        </span>
        {statusLabel(fixture)}
      </div>

      <div className="featured-teams">
        <div className="featured-team">
          <TeamMark team={fixture.homeTeam} size="lg" />
          <div>
            <h3>{fixture.homeTeam}</h3>
            <OwnerLine owner={fixture.homeOwner} />
          </div>
        </div>

        <div className="score-stack">
          <strong>{scoreLabel(fixture)}</strong>
          <span>{fixture.stage}</span>
        </div>

        <div className="featured-team">
          <TeamMark team={fixture.awayTeam} size="lg" />
          <div>
            <h3>{fixture.awayTeam}</h3>
            <OwnerLine owner={fixture.awayOwner} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMatch({ fixture }: { fixture: EnrichedFixture }) {
  return (
    <article className="mini-match">
      <div className="match-meta">
        <span>{fixture.readableKickoff}</span>
        <strong>{statusLabel(fixture)}</strong>
      </div>
      <div className="mini-teams">
        <div>
          <TeamMark team={fixture.homeTeam} size="sm" />
          <OwnerLine owner={fixture.homeOwner} />
        </div>
        <span>{scoreLabel(fixture)}</span>
        <div>
          <TeamMark team={fixture.awayTeam} size="sm" />
          <OwnerLine owner={fixture.awayOwner} />
        </div>
      </div>
    </article>
  );
}

function LeaderboardPanel({ owners }: { owners: OwnerSummary[] }) {
  const rows = owners.slice(0, 7);

  return (
    <section className="panel">
      <div className="panel-title">Quick Leaderboard</div>
      <div className="stack">
        {rows.length ? (
          rows.map((owner, index) => (
            <div className={index === 0 ? "leader-row first" : "leader-row"} key={owner.owner}>
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{owner.owner}</strong>
              </div>
              <em>{owner.points} pts</em>
            </div>
          ))
        ) : (
          <p className="muted">No standings yet.</p>
        )}
      </div>
      <Link className="panel-link" href="/leaderboards">
        Full leaderboard
      </Link>
    </section>
  );
}

function UnderdogPanel({ tracker }: { tracker: UnderdogTracker }) {
  const leader = tracker.leader ?? tracker.standings[0];

  return (
    <section className="panel underdog-panel">
      <div className="panel-title gold">Underdog Prize</div>
      {leader ? (
        <div className="underdog-card">
          <TeamMark team={leader.team} size="sm" />
          <div>
            <strong>{leader.team}</strong>
            <span>Owner: {leader.owner}</span>
          </div>
          <em>Pot {leader.pot}</em>
        </div>
      ) : (
        <p className="muted">No underdog leader yet.</p>
      )}
    </section>
  );
}

function BattleCard({ fixture, tone }: { fixture: EnrichedFixture; tone: "green" | "gold" | "red" }) {
  return (
    <article className={`battle-card ${tone}`}>
      <div className="battle-stripe" />
      <div className="battle-body">
        <div className="battle-meta">
          <span>{fixture.isSelfMatch ? "Same owner" : "Rivalry match"}</span>
          <strong>{fixture.readableKickoff}</strong>
        </div>
        <div className="battle-teams">
          <div>
            <TeamMark team={fixture.homeTeam} />
            <strong>{fixture.homeOwner}</strong>
          </div>
          <span>VS</span>
          <div>
            <TeamMark team={fixture.awayTeam} />
            <strong>{fixture.awayOwner}</strong>
          </div>
        </div>
        <p>
          {fixture.homeTeam} against {fixture.awayTeam}. Bragging rights are available.
        </p>
      </div>
    </article>
  );
}

const emptyUnderdog: UnderdogTracker = {
  leader: null,
  isSplit: false,
  splitWith: [],
  standings: [],
  rules: []
};

const emptyLeaderboards: Leaderboards = {
  overall: [],
  underdog: emptyUnderdog,
  mostGoalsScored: [],
  mostGoalsConceded: [],
  mostRedCards: [],
  worstPerformingTeam: [],
  teamsStillAliveByOwner: []
};

export default async function HomePage() {
  const [today, live, owners, leaderboards, underdog, fixtures] = await Promise.all([
    safe(getTodayFixtures(), [] as EnrichedFixture[]),
    safe(getLiveFixtures(), [] as EnrichedFixture[]),
    safe(getOwners(), [] as OwnerSummary[]),
    safe(getLeaderboards(), emptyLeaderboards),
    safe(getUnderdog(), emptyUnderdog),
    safe(getFixtures(), [] as EnrichedFixture[])
  ]);

  const featured = live[0] ?? today.find((fixture) => fixture.status === "live") ?? null;
  const todayMatches = today.filter((fixture) => fixture.id !== featured?.id).slice(0, 2);
  const fallbackMatches = fixtures.filter((fixture) => fixture.status !== "finished").slice(0, 2);
  const visibleMatches = todayMatches.length ? todayMatches : fallbackMatches;
  const standings = leaderboards.overall.length ? leaderboards.overall : owners;
  const battles = fixtures
    .filter((fixture) => fixture.status === "scheduled" && fixture.isOwnerVsOwner)
    .slice(0, 3);

  return (
    <main className="page-shell">

      <div className="dashboard-grid">
        <section className="live-section">

          <FeaturedMatch fixture={featured} />

          <div className="mini-grid">
            {visibleMatches.length ? (
              visibleMatches.map((fixture) => <MiniMatch key={fixture.id} fixture={fixture} />)
            ) : (
              <div className="mini-match empty-state">
                <p>No fixtures available.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="widget-stack">
          <LeaderboardPanel owners={standings} />
          <UnderdogPanel tracker={underdog} />
        </aside>
      </div>


      <section className="battle-section">
        <h2>Next Owner-vs-Owner Battles</h2>
        <div className="battle-grid">
          {battles.length ? (
            battles.map((fixture, index) => (
              <BattleCard key={fixture.id} fixture={fixture} tone={index === 0 ? "green" : index === 1 ? "gold" : "red"} />
            ))
          ) : (
            <div className="battle-empty">No owner-vs-owner fixtures are scheduled yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}

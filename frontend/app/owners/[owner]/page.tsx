import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwner, getOwners } from "@/lib/api";
import type { EnrichedFixture, OwnerSummary, OwnerTeam, TeamStats } from "@/lib/types";

type OwnerPageParams = {
  owner: string;
};

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function teamCode(team: string) {
  const words = team.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
  return (words.length === 1 ? words[0].slice(0, 3) : words.map((word) => word[0]).join("").slice(0, 3)).toUpperCase();
}

function winRate(owner: OwnerSummary) {
  const played = owner.wins + owner.draws + owner.losses;
  return played ? Math.round((owner.wins / played) * 100) : 0;
}

function scoreLabel(fixture: EnrichedFixture, owner?: string) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "vs";
  }
  if (owner && fixture.awayOwner === owner && fixture.homeOwner !== owner) {
    return `${fixture.awayScore} - ${fixture.homeScore}`;
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function matchTeamLabel(fixture: EnrichedFixture, owner: string) {
  const ownsHome = fixture.homeOwner === owner;
  return `${ownsHome ? fixture.homeTeam : fixture.awayTeam} vs ${ownsHome ? fixture.awayTeam : fixture.homeTeam}`;
}

function TeamTile({ team }: { team: OwnerTeam }) {
  return (
    <article className={team.alive ? "owner-team-card" : "owner-team-card eliminated"}>
      {!team.alive ? <span className="eliminated-stamp">Eliminated</span> : null}
      <div className="owner-team-card-top">
        <span>Pot {team.pot}</span>
        {team.stats.points > 0 ? (
          <span className="material-symbols-outlined" aria-hidden="true">
            star
          </span>
        ) : null}
      </div>
      <div className="owner-team-code">{teamCode(team.team)}</div>
      <h3>{team.team}</h3>
      <p>{team.alive ? "Active" : "Out"}</p>
    </article>
  );
}

function JourneyRow({ fixture, owner }: { fixture: EnrichedFixture; owner: string }) {
  return (
    <article className={fixture.status === "live" ? "journey-row live" : "journey-row"}>
      <div>
        <span>{fixture.status === "finished" ? "Final" : fixture.status === "live" ? "Live" : fixture.readableKickoff}</span>
        <strong>{matchTeamLabel(fixture, owner)}</strong>
      </div>
      <strong>{scoreLabel(fixture, owner)}</strong>
    </article>
  );
}

function MiniStatTeam({ label, team, tone }: { label: string; team: TeamStats | null; tone: "good" | "bad" }) {
  return (
    <div className={`mini-stat-team ${tone}`}>
      <span>{label}</span>
      <div>{team ? teamCode(team.team) : "--"}</div>
      <strong>{team?.team ?? "No data"}</strong>
      <p>{team ? `${team.points} pts` : "Pending"}</p>
    </div>
  );
}

export default async function OwnerDetailPage({ params }: { params: Promise<OwnerPageParams> }) {
  const { owner: ownerParam } = await params;
  const ownerName = decodeURIComponent(ownerParam);
  const owner = await safe(getOwner(ownerName), null as OwnerSummary | null);

  if (!owner) {
    notFound();
  }

  const allOwners = await safe(getOwners(), [] as OwnerSummary[]);
  const rank =
    [...allOwners].sort((a, b) => b.points - a.points || b.teamsStillAlive - a.teamsStillAlive).findIndex((item) => item.owner === owner.owner) + 1 || 1;
  const journey = [...owner.liveMatches, ...owner.completedResults, ...owner.upcomingMatches];

  return (
    <main className="owners-shell">
      <Link className="owner-back-link" href="/owners">
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>
        All owners
      </Link>

      <article className="owner-profile-card">
        <section className="owner-hero">
          <div className="owner-hero-main">
            <div className="owner-avatar-large">
              <span>{initials(owner.owner)}</span>
              <em>#{rank}</em>
            </div>
            <div>
              <div className="owner-title-line">
                <h1>{owner.owner}</h1>
                {rank === 1 ? (
                  <span className="material-symbols-outlined" aria-hidden="true">
                    verified
                  </span>
                ) : null}
              </div>
              <p>
                {owner.teamCount} teams, {owner.points} points, {owner.teamsStillAlive} still alive.
              </p>
            </div>
          </div>

          <div className="owner-hero-stats">
            <div>
              <span>Teams Alive</span>
              <strong>
                {owner.teamsStillAlive} / {owner.teamCount}
              </strong>
            </div>
            <div>
              <span>Win Rate</span>
              <strong>{winRate(owner)}%</strong>
            </div>
          </div>
        </section>

        <div className="owner-card-grid">
          <section className="owner-main-panel">
            <div className="owner-section-heading">
              <span className="material-symbols-outlined" aria-hidden="true">
                groups
              </span>
              <h2>Their Teams</h2>
            </div>
            <div className="owner-teams-grid">
              {owner.teams.map((team) => (
                <TeamTile key={team.team} team={team} />
              ))}
            </div>

            <div className="owner-section-heading journey-heading">
              <span className="material-symbols-outlined" aria-hidden="true">
                stadium
              </span>
              <h2>Tournament Journey</h2>
            </div>
            <div className="journey-list">
              {journey.length ? (
                journey.map((fixture) => <JourneyRow key={`${owner.owner}-${fixture.id}`} fixture={fixture} owner={owner.owner} />)
              ) : (
                <div className="journey-empty">No matches attached to this owner yet.</div>
              )}
            </div>
          </section>

          <aside className="owner-side-panel">
            <section className="head-to-head-card">
              <div className="owner-section-heading compact">
                <span className="material-symbols-outlined" aria-hidden="true">
                  swords
                </span>
                <h2>Head-to-Heads</h2>
              </div>
              <div className="h2h-list">
                {owner.headToHeads.length ? (
                  owner.headToHeads.map((fixture) => {
                    const rival = fixture.homeOwner === owner.owner ? fixture.awayOwner : fixture.homeOwner;
                    return (
                      <div key={`${owner.owner}-h2h-${fixture.id}`}>
                        <span>vs {rival}</span>
                        <strong>{scoreLabel(fixture, owner.owner)}</strong>
                      </div>
                    );
                  })
                ) : (
                  <p>No rival clashes yet.</p>
                )}
              </div>
            </section>

            <section className="owner-best-worst">
              <MiniStatTeam label="MVP Team" team={owner.bestTeam} tone="good" />
              <MiniStatTeam label="Liability" team={owner.worstTeam} tone="bad" />
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}

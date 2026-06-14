import OwnerAvatar from "@/components/OwnerAvatar";
import TeamLogo from "@/components/TeamLogo";
import type { EnrichedFixture, OwnerSummary, OwnerTeam, TeamStats } from "@/lib/types";

function winRate(owner: OwnerSummary) {
  const played = owner.wins + owner.draws + owner.losses;
  if (!played) {
    return 0;
  }
  return Math.round((owner.wins / played) * 100);
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
  const team = ownsHome ? fixture.homeTeam : fixture.awayTeam;
  const opponent = ownsHome ? fixture.awayTeam : fixture.homeTeam;
  return `${team} vs ${opponent}`;
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
      <div className="owner-team-code">
        <div className="owner-team-logo" aria-label={team.team}>
          {team.logo ? (
            <img src={team.logo} alt={`${team.team} logo`} className="owner-team-logo-image" loading="lazy" />
          ) : (
            <TeamLogo team={team.team} code={team.code} logo={team.logo} className="owner-team-logo-fallback" />
          )}
        </div>
      </div>
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
      <div>{team ? <TeamLogo team={team.team} code={team.code} logo={team.logo} className="mini-stat-team-logo" /> : "--"}</div>
      <strong>{team?.team ?? "No data"}</strong>
      <p>{team ? `${team.points} pts` : "Pending"}</p>
    </div>
  );
}

export default function OwnerProfilePanel({ owner, rank }: { owner: OwnerSummary; rank: number }) {
  const journey = [...owner.liveMatches, ...owner.completedResults, ...owner.upcomingMatches];
  const headToHeads = owner.headToHeads.slice(0, 3);

  return (
    <article className="owner-profile-card">
      <section className="owner-hero">
        <div className="owner-hero-main">
          <OwnerAvatar owner={owner.owner} className="owner-avatar-large">
            <em>#{rank}</em>
          </OwnerAvatar>
          <div>
            <div className="owner-title-line">
              <h2>{owner.owner}</h2>
              {rank === 1 ? (
                <span className="material-symbols-outlined" aria-hidden="true">
                  verified
                </span>
              ) : null}
            </div>
            <p>
              {owner.teamCount} teams, {owner.points} points, {owner.teamsStillAlive} still alive.
            </p>
            <p>{owner.wins}W {owner.draws}D {owner.losses}L</p>
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
            <h3>Their Teams</h3>
          </div>
          <div className="owner-teams-grid">
            {owner.teams.map((team) => (
              <TeamTile key={team.team} team={team} />
            ))}
          </div>

          <details className="journey-panel">
            <summary className="owner-section-heading journey-heading journey-summary">
              <span className="journey-summary-main">
                <span className="material-symbols-outlined" aria-hidden="true">
                  stadium
                </span>
                <h3>Tournament Journey</h3>
              </span>
              <span className="journey-summary-meta">
                <span>{journey.length} matches</span>
                <span className="material-symbols-outlined journey-chevron" aria-hidden="true">
                  expand_more
                </span>
              </span>
            </summary>
            <div className="journey-panel-body">
              <div className="journey-list">
                {journey.length ? (
                  journey.map((fixture) => <JourneyRow key={`${owner.owner}-${fixture.id}`} fixture={fixture} owner={owner.owner} />)
                ) : (
                  <div className="journey-empty">No matches attached to this owner yet.</div>
                )}
              </div>
            </div>
          </details>
        </section>

        <aside className="owner-side-panel">
          <section className="head-to-head-card">
            <div className="owner-section-heading compact">
              <span className="material-symbols-outlined" aria-hidden="true">
                swords
              </span>
              <h3>Head-to-Heads</h3>
            </div>
            <div className="h2h-list">
              {headToHeads.length ? (
                headToHeads.map((fixture) => {
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
  );
}

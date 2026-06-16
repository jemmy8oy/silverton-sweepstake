import OwnerAvatar from "@/components/OwnerAvatar";
import StatusBadge from "@/components/common/status-badge";
import TeamLogo from "@/components/TeamLogo";
import CollapsibleSection from "@/components/CollapsibleSection";
import { cn } from "@/lib/cn";
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
    <article
      className={cn(
        "relative border-2 border-foreground px-4 py-4",
        team.alive
          ? "bg-background"
          : "bg-destructive/10"
      )}
    >
      {!team.alive ? (
        <span className="absolute right-3 top-3 border-2 border-foreground bg-destructive px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-destructive-foreground">
          Eliminated
        </span>
      ) : null}
      <div className="flex items-start gap-4">
        <TeamLogo team={team.team} code={team.code} logo={team.logo} className="h-14 w-14 shrink-0 border-2 border-foreground bg-background p-2" />
        <div className="grid gap-1">
          <div className="flex items-center gap-2 font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <StatusBadge tone="muted">Pot {team.pot}</StatusBadge>
            {team.stats.points > 0 ? (
              <span className="material-symbols-outlined text-[color:var(--color-signal-blue)]" aria-hidden="true">
                star
              </span>
            ) : null}
          </div>
          <h3 className="font-display text-2xl font-black tracking-[-0.04em]">{team.team}</h3>
          <p className="text-sm text-muted-foreground">{team.alive ? "Active" : "Out"}</p>
        </div>
      </div>
    </article>
  );
}

function JourneyRow({ fixture, owner }: { fixture: EnrichedFixture; owner: string }) {
  return (
    <article
      className={cn(
        "flex items-center justify-between gap-4 border-2 border-foreground px-4 py-3",
        fixture.status === "live"
          ? "bg-secondary"
          : "bg-background"
      )}
    >
      <div className="grid gap-1">
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {fixture.status === "finished" ? "Final" : fixture.status === "live" ? "Live" : fixture.readableKickoff}
        </span>
        <strong className="text-sm md:text-base">{matchTeamLabel(fixture, owner)}</strong>
      </div>
      <strong className="font-display text-2xl font-black">{scoreLabel(fixture, owner)}</strong>
    </article>
  );
}

function MiniStatTeam({ label, team, tone }: { label: string; team: TeamStats | null; tone: "good" | "bad" }) {
  return (
    <div
      className={cn(
        "border-2 border-foreground px-4 py-4",
        tone === "good" ? "bg-secondary" : "bg-destructive/10"
      )}
    >
      <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <div className="mt-4 flex items-center gap-3">
        <div>{team ? <TeamLogo team={team.team} code={team.code} logo={team.logo} className="h-11 w-11 border-2 border-foreground bg-background p-2" /> : "--"}</div>
        <div className="grid gap-1">
          <strong className="font-display text-2xl font-black tracking-[-0.04em]">{team?.team ?? "No data"}</strong>
          <p className="text-sm text-muted-foreground">{team ? `${team.points} pts` : "Pending"}</p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerProfilePanel({ owner, rank }: { owner: OwnerSummary; rank: number }) {
  const journey = [...owner.liveMatches, ...owner.completedResults, ...owner.upcomingMatches];
  const headToHeads = owner.headToHeads.slice(0, 3);

  return (
    <article className="grid gap-6">
      <section className="brutal-surface px-5 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <OwnerAvatar owner={owner.owner} className="h-24 w-24 border-2 border-foreground md:h-28 md:w-28">
              <em className="absolute -bottom-1 right-0 inline-flex h-8 min-w-8 items-center justify-center border-2 border-foreground bg-accent px-2 font-mono text-[0.68rem] font-bold not-italic tracking-[0.14em] text-accent-foreground">
                #{rank}
              </em>
            </OwnerAvatar>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-4xl font-black tracking-[-0.04em] md:text-5xl">{owner.owner}</h2>
                {rank === 1 ? (
                  <span className="material-symbols-outlined text-[color:var(--color-signal-blue)]" aria-hidden="true">
                    verified
                  </span>
                ) : null}
              </div>
              <p className="max-w-[56ch] text-sm leading-7 text-muted-foreground">
                {owner.teamCount} teams, {owner.points} points, {owner.teamsStillAlive} still alive.
              </p>
              <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {owner.wins}W {owner.draws}D {owner.losses}L
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-2">
            <div className="border-2 border-foreground bg-secondary px-4 py-4">
              <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Teams Alive</span>
              <strong className="mt-2 block font-display text-3xl font-black">
                {owner.teamsStillAlive} / {owner.teamCount}
              </strong>
            </div>
            <div className="border-2 border-foreground bg-secondary px-4 py-4">
              <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Win Rate</span>
              <strong className="mt-2 block font-display text-3xl font-black">{winRate(owner)}%</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid gap-6">
          <CollapsibleSection
            title="Their Teams"
            icon="groups"
            collapseOnMobile
            meta={<span>{owner.teamsStillAlive}/{owner.teamCount} alive</span>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {owner.teams.map((team) => (
                <TeamTile key={team.team} team={team} />
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Tournament Journey"
            icon="stadium"
            collapseOnMobile
            defaultOpen={false}
            meta={<span>{journey.length} matches</span>}
          >
            <div className="grid gap-3">
              {journey.length ? (
                journey.map((fixture) => <JourneyRow key={`${owner.owner}-${fixture.id}`} fixture={fixture} owner={owner.owner} />)
              ) : (
                <div className="border-2 border-dashed border-foreground px-4 py-6 text-center text-sm text-muted-foreground">
                  No matches attached to this owner yet.
                </div>
              )}
            </div>
          </CollapsibleSection>
        </section>

        <aside className="grid gap-6">
          <CollapsibleSection
            title="Head-to-Heads"
            icon="swords"
            collapseOnMobile
            className="bg-secondary"
            headingClassName="compact"
            meta={<span>{headToHeads.length}</span>}
          >
            <div className="grid gap-3">
              {headToHeads.length ? (
                headToHeads.map((fixture) => {
                  const rival = fixture.homeOwner === owner.owner ? fixture.awayOwner : fixture.homeOwner;
                  return (
                    <div
                      key={`${owner.owner}-h2h-${fixture.id}`}
                      className="flex items-center justify-between gap-4 border-2 border-foreground bg-background px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground">vs {rival}</span>
                      <strong className="font-display text-2xl font-black">
                        {scoreLabel(fixture, owner.owner)}
                      </strong>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No rival clashes yet.</p>
              )}
            </div>
          </CollapsibleSection>

          <section className="grid gap-4">
            <MiniStatTeam label="MVP Team" team={owner.bestTeam} tone="good" />
            <MiniStatTeam label="Liability" team={owner.worstTeam} tone="bad" />
          </section>
        </aside>
      </div>
    </article>
  );
}

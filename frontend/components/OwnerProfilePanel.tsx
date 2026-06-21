import Link from "next/link";
import OwnerAvatar from "@/components/OwnerAvatar";
import StatusBadge from "@/components/common/status-badge";
import TeamLogo from "@/components/TeamLogo";
import CollapsibleSection from "@/components/CollapsibleSection";
import { cn } from "@/lib/cn";
import { buildMatchSlug } from "@/lib/match-slug";
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
        "relative px-3 py-3",
        team.alive
          ? "bg-background"
          : "bg-destructive/10"
      )}
    >
      {!team.alive ? (
        <span className="absolute right-2 top-2 border-2 border-foreground bg-destructive px-1.5 py-0.5 font-mono text-[0.54rem] font-bold uppercase tracking-[0.14em] text-destructive-foreground">
          Eliminated
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        <TeamLogo team={team.team} code={team.code} logo={team.logo} className="h-10 w-10 shrink-0 border-2 border-foreground bg-background p-1.5" />
        <div className="grid min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5 font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <StatusBadge tone="muted">Pot {team.pot}</StatusBadge>
            {team.stats.points > 0 ? (
              <span className="material-symbols-outlined text-sm text-[color:var(--color-signal-blue)]" aria-hidden="true">
                star
              </span>
            ) : null}
          </div>
          <h3 className="truncate font-display text-lg font-black tracking-[-0.04em]">{team.team}</h3>
          <p className="text-[0.72rem] text-muted-foreground">{team.alive ? "Active" : "Out"}</p>
        </div>
      </div>
    </article>
  );
}

function JourneyRow({ fixture, owner }: { fixture: EnrichedFixture; owner: string }) {
  return (
    <Link href={`/match/${buildMatchSlug(fixture)}`} className="block">
      <article
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2.5 text-xs",
          fixture.status === "live"
            ? "bg-secondary"
            : "bg-background"
        )}
      >
        <div className="grid gap-1">
          <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {fixture.status === "finished" ? "Final" : fixture.status === "live" ? "Live" : fixture.readableKickoff}
          </span>
          <strong>{matchTeamLabel(fixture, owner)}</strong>
        </div>
        <strong className="font-display text-lg font-black">{scoreLabel(fixture, owner)}</strong>
      </article>
    </Link>
  );
}

function MiniStatTeam({ label, team, tone }: { label: string; team: TeamStats | null; tone: "good" | "bad" }) {
  return (
    <div
      className={cn(
        "px-3 py-3",
        tone === "good" ? "bg-secondary" : "bg-destructive/10"
      )}
    >
      <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <div>{team ? <TeamLogo team={team.team} code={team.code} logo={team.logo} className="h-9 w-9 border-2 border-foreground bg-background p-1.5" /> : "--"}</div>
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate font-display text-lg font-black tracking-[-0.04em]">{team?.team ?? "No data"}</strong>
          <p className="text-[0.72rem] text-muted-foreground">{team ? `${team.points} pts` : "Pending"}</p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerProfilePanel({ owner, rank }: { owner: OwnerSummary; rank: number }) {
  const journey = [...owner.liveMatches, ...owner.completedResults, ...owner.upcomingMatches];
  const headToHeads = owner.headToHeads.slice(0, 3);

  return (
    <article className="grid gap-4">
      <section className="brutal-surface px-4 py-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
          <div className="flex items-center gap-3">
            <OwnerAvatar owner={owner.owner} className="h-16 w-16 border-2 border-foreground md:h-20 md:w-20">
              <em className="absolute -bottom-1 right-0 inline-flex h-6 min-w-6 items-center justify-center border-2 border-foreground bg-accent px-1.5 font-mono text-[0.56rem] font-bold not-italic tracking-[0.12em] text-accent-foreground">
                #{rank}
              </em>
            </OwnerAvatar>
            <div className="grid min-w-0 gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate font-display text-2xl font-black tracking-[-0.04em] md:text-3xl">{owner.owner}</h2>
                {rank === 1 ? (
                  <span className="material-symbols-outlined text-lg text-[color:var(--color-signal-blue)]" aria-hidden="true">
                    verified
                  </span>
                ) : null}
              </div>
              <p className="text-[0.72rem] text-muted-foreground">
                {owner.teamCount} teams, {owner.points} points, {owner.teamsStillAlive} still alive.
              </p>
              <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {owner.wins}W {owner.draws}D {owner.losses}L
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary px-3 py-3">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Alive</span>
              <strong className="mt-1 block font-display text-xl font-black">
                {owner.teamsStillAlive} / {owner.teamCount}
              </strong>
            </div>
            <div className="bg-secondary px-3 py-3">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Win Rate</span>
              <strong className="mt-1 block font-display text-xl font-black">{winRate(owner)}%</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="grid gap-4">
          <CollapsibleSection
            title="Their Teams"
            icon="groups"
            collapseOnMobile
            meta={<span>{owner.teamsStillAlive}/{owner.teamCount} alive</span>}
          >
            <div className="grid gap-2 sm:grid-cols-2">
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
            <div className="grid gap-2">
              {journey.length ? (
                journey.map((fixture) => <JourneyRow key={`${owner.owner}-${fixture.id}`} fixture={fixture} owner={owner.owner} />)
              ) : (
                <div className="border-2 border-dashed border-foreground px-3 py-5 text-center text-xs text-muted-foreground">
                  No matches attached to this owner yet.
                </div>
              )}
            </div>
          </CollapsibleSection>
        </section>

        <aside className="grid gap-4">
          <CollapsibleSection
            title="Head-to-Heads"
            icon="swords"
            collapseOnMobile
            className="bg-secondary"
            headingClassName="compact"
            meta={<span>{headToHeads.length}</span>}
          >
            <div className="grid gap-2">
              {headToHeads.length ? (
                headToHeads.map((fixture) => {
                  const rival = fixture.homeOwner === owner.owner ? fixture.awayOwner : fixture.homeOwner;
                  return (
                    <Link href={`/match/${buildMatchSlug(fixture)}`} key={`${owner.owner}-h2h-${fixture.id}`} className="block">
                      <div
                        className="flex items-center justify-between gap-3 bg-background px-3 py-2.5 text-xs"
                      >
                        <span className="text-muted-foreground">vs {rival}</span>
                        <strong className="font-display text-lg font-black">
                          {scoreLabel(fixture, owner.owner)}
                        </strong>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No rival clashes yet.</p>
              )}
            </div>
          </CollapsibleSection>

          <section className="grid gap-2">
            <MiniStatTeam label="MVP Team" team={owner.bestTeam} tone="good" />
            <MiniStatTeam label="Liability" team={owner.worstTeam} tone="bad" />
          </section>
        </aside>
      </div>
    </article>
  );
}

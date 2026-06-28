import Link from "next/link";
import OwnerAvatar from "@/components/OwnerAvatar";
import StatusBadge from "@/components/common/status-badge";
import TeamLogo from "@/components/TeamLogo";
import CollapsibleSection from "@/components/CollapsibleSection";
import MatchCard from "@/components/MatchCard";
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

function TeamTile({ team }: { team: OwnerTeam }) {
  return (
    <article
      className={cn(
        "relative rounded-xl px-3 py-3",
        team.alive
          ? "bg-neutral-50"
          : "bg-rose-50"
      )}
    >
      {!team.alive ? (
        <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-1.5 py-0.5 text-[0.58rem] font-medium text-white">
          Eliminated
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        <TeamLogo team={team.team} code={team.code} logo={team.logo} className="h-10 w-10 shrink-0 rounded-none border-0 bg-transparent p-0" />
        <div className="grid min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5 text-[0.62rem] font-medium text-neutral-400">
            <StatusBadge tone="muted">Pot {team.pot}</StatusBadge>
            {team.stats.points > 0 ? (
              <span className="material-symbols-outlined text-sm text-emerald-600" aria-hidden="true">
                star
              </span>
            ) : null}
          </div>
          <h3 className="truncate text-base font-semibold text-neutral-800">{team.team}</h3>
          <p className="text-[0.72rem] text-neutral-400">
            {team.stats.wins}W {team.stats.draws}D {team.stats.losses}L
          </p>
        </div>
      </div>
    </article>
  );
}

function MiniStatTeam({ label, team, tone }: { label: string; team: TeamStats | null; tone: "good" | "bad" }) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-3",
        tone === "good" ? "bg-emerald-50" : "bg-rose-50"
      )}
    >
      <span className="text-[0.62rem] font-medium text-neutral-400">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <div>{team ? <TeamLogo team={team.team} code={team.code} logo={team.logo} className="h-9 w-9 rounded-none border-0 bg-transparent p-0" /> : "--"}</div>
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-base font-semibold text-neutral-800">{team?.team ?? "No data"}</strong>
          <p className="text-[0.72rem] text-neutral-400">{team ? `${team.points} pts` : "Pending"}</p>
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
      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white px-4 py-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
          <div className="flex items-center gap-3">
            <OwnerAvatar owner={owner.owner} className="h-16 w-16 rounded-full md:h-20 md:w-20">
              <em className="absolute -bottom-1 right-0 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[0.62rem] font-semibold not-italic text-white">
                #{rank}
              </em>
            </OwnerAvatar>
            <div className="grid min-w-0 gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-2xl font-semibold text-neutral-900 md:text-3xl">{owner.owner}</h2>
                {rank === 1 ? (
                  <span className="material-symbols-outlined text-lg text-emerald-600" aria-hidden="true">
                    verified
                  </span>
                ) : null}
              </div>
              <p className="text-[0.72rem] text-neutral-400">
                {owner.teamCount} teams, {owner.points} points, {owner.teamsStillAlive} still alive.
              </p>
              <p className="text-[0.68rem] font-medium text-neutral-500">
                {owner.wins}W {owner.draws}D {owner.losses}L
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-neutral-50 px-3 py-3">
              <span className="text-[0.62rem] font-medium text-neutral-400">Alive</span>
              <strong className="mt-1 block text-xl font-bold text-neutral-900">
                {owner.teamsStillAlive} / {owner.teamCount}
              </strong>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-3">
              <span className="text-[0.62rem] font-medium text-neutral-400">Win Rate</span>
              <strong className="mt-1 block text-xl font-bold text-neutral-900">{winRate(owner)}%</strong>
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
                <div className="overflow-hidden rounded-xl border border-neutral-100">
                  {journey.map((fixture) => <MatchCard key={`${owner.owner}-${fixture.id}`} fixture={fixture} />)}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-200 px-3 py-5 text-center text-xs text-neutral-400">
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
            className="bg-white"
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
                        className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-3 py-2.5 text-xs last:border-b-0"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <OwnerAvatar owner={rival} className="h-7 w-7 rounded-full" />
                          <span className="min-w-0">
                            <span className="block text-[0.62rem] font-medium text-neutral-400">vs</span>
                            <strong className="block truncate text-sm font-medium text-neutral-800">{rival}</strong>
                          </span>
                        </span>
                        <strong className="text-base font-bold">
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

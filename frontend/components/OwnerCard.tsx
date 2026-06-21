import Link from "next/link";
import { aliveRatio, recordLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { OwnerSummary } from "@/lib/types";
import OwnerAvatar from "./OwnerAvatar";
import TeamBadge from "./TeamBadge";

export default function OwnerCard({ owner }: { owner: OwnerSummary }) {
  const ratio = aliveRatio(owner.teamsStillAlive, owner.teamCount);

  return (
    <article className="rounded-[24px] border border-outline-variant bg-surface-high px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-4">
        <OwnerAvatar owner={owner.owner} className="h-14 w-14" />
        <div className="grid gap-2">
          <h3 className="font-display text-3xl font-semibold tracking-tight text-white">{owner.owner}</h3>
          <div className="flex flex-wrap gap-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
            <span>{owner.teamCount} teams</span>
            <span>{owner.teamsStillAlive} alive</span>
            <span>{recordLabel(owner)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-outline-variant bg-surface-low px-4 py-3">
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Points</span>
          <strong className="mt-2 block font-display text-3xl font-semibold tracking-tight text-white">{owner.points}</strong>
        </div>
        <div className="rounded-[18px] border border-outline-variant bg-surface-low px-4 py-3">
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-muted">Goals</span>
          <strong className="mt-2 block font-display text-3xl font-semibold tracking-tight text-white">{owner.goalsFor}/{owner.goalsAgainst}</strong>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-panel">
        <span className={cn("block h-full rounded-full bg-accent", ratio < 30 && "bg-danger")} style={{ width: `${ratio}%` }} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {owner.teams.slice(0, 8).map((team) => (
          <TeamBadge key={team.team} team={team.team} code={team.code} logo={team.logo} pot={team.pot} alive={team.alive} />
        ))}
      </div>

      <Link
        className="mt-5 inline-flex items-center rounded-2xl border border-outline-variant px-4 py-2 font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-outline hover:bg-surface-highest"
        href={`/owners/${encodeURIComponent(owner.owner)}`}
      >
        Open dashboard
      </Link>
    </article>
  );
}

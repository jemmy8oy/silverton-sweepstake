import Link from "next/link";
import type { EnrichedFixture, OwnerSummary } from "@/lib/types";

export default function DashboardHero({
  owners,
  today,
  live
}: {
  owners: OwnerSummary[];
  today: EnrichedFixture[];
  live: EnrichedFixture[];
}) {
  const totalTeams = owners.reduce((sum, owner) => sum + owner.teamCount, 0);
  const alive = owners.reduce((sum, owner) => sum + owner.teamsStillAlive, 0);

  return (
    <section className="grid gap-4 overflow-hidden rounded-[22px] border border-outline-variant bg-[radial-gradient(circle_at_top_left,rgba(78,222,163,0.14),transparent_32%),linear-gradient(145deg,rgba(28,43,60,0.98),rgba(13,28,45,0.98))] px-4 py-4 shadow-[0_20px_42px_rgba(0,0,0,0.2)] lg:grid-cols-[minmax(0,1fr)_280px] md:px-5">
      <div>
        <span className="inline-flex rounded-full bg-accent px-2 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-accent-ink">Live: Matchday</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">Silverton Sweepstake</h1>
        <p className="mt-2 max-w-[58ch] text-xs leading-5 text-ink-muted">
          Track the chaos, glory, and punishment shots. May the underdogs rise and the owners tremble.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/fixtures" className="inline-flex items-center rounded-xl bg-accent px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-ink">View scores</Link>
          <Link href="/leaderboards" className="inline-flex items-center rounded-xl border border-outline-variant px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink">Standings</Link>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="rounded-[14px] border border-outline-variant bg-surface-low px-3 py-3"><strong className="block font-display text-xl font-semibold tracking-tight text-white">{owners.length}</strong><span className="text-[0.72rem] text-ink-muted">friends in the draw</span></div>
        <div className="rounded-[14px] border border-outline-variant bg-surface-low px-3 py-3"><strong className="block font-display text-xl font-semibold tracking-tight text-white">{alive}/{totalTeams}</strong><span className="text-[0.72rem] text-ink-muted">teams still alive</span></div>
        <div className="rounded-[14px] border border-outline-variant bg-surface-low px-3 py-3"><strong className="block font-display text-xl font-semibold tracking-tight text-white">{today.length}</strong><span className="text-[0.72rem] text-ink-muted">matches today</span></div>
        <div className="rounded-[14px] border border-outline-variant bg-surface-low px-3 py-3"><strong className="block font-display text-xl font-semibold tracking-tight text-white">{live.length}</strong><span className="text-[0.72rem] text-ink-muted">live right now</span></div>
      </div>
    </section>
  );
}

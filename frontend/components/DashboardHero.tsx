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
    <section className="grid gap-6 overflow-hidden rounded-[28px] border border-outline-variant bg-[radial-gradient(circle_at_top_left,rgba(78,222,163,0.14),transparent_32%),linear-gradient(145deg,rgba(28,43,60,0.98),rgba(13,28,45,0.98))] px-6 py-6 shadow-[0_28px_70px_rgba(0,0,0,0.22)] lg:grid-cols-[minmax(0,1fr)_320px] md:px-8">
      <div>
        <span className="inline-flex rounded-full bg-accent px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent-ink">Live: Matchday</span>
        <h1 className="mt-5 font-display text-5xl font-bold tracking-tight text-white">Silverton Sweepstake</h1>
        <p className="mt-4 max-w-[58ch] text-sm leading-7 text-ink-muted">
          Track the chaos, glory, and punishment shots. May the underdogs rise and the owners tremble.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/fixtures" className="inline-flex items-center rounded-2xl bg-accent px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">View scores</Link>
          <Link href="/leaderboards" className="inline-flex items-center rounded-2xl border border-outline-variant px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink">Standings</Link>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-[20px] border border-outline-variant bg-surface-low px-4 py-4"><strong className="block font-display text-3xl font-semibold tracking-tight text-white">{owners.length}</strong><span className="text-sm text-ink-muted">friends in the draw</span></div>
        <div className="rounded-[20px] border border-outline-variant bg-surface-low px-4 py-4"><strong className="block font-display text-3xl font-semibold tracking-tight text-white">{alive}/{totalTeams}</strong><span className="text-sm text-ink-muted">teams still alive</span></div>
        <div className="rounded-[20px] border border-outline-variant bg-surface-low px-4 py-4"><strong className="block font-display text-3xl font-semibold tracking-tight text-white">{today.length}</strong><span className="text-sm text-ink-muted">matches today</span></div>
        <div className="rounded-[20px] border border-outline-variant bg-surface-low px-4 py-4"><strong className="block font-display text-3xl font-semibold tracking-tight text-white">{live.length}</strong><span className="text-sm text-ink-muted">live right now</span></div>
      </div>
    </section>
  );
}

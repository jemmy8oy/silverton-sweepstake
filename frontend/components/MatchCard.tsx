import { scoreLabel, statusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { EnrichedFixture } from "@/lib/types";
import TeamLogo from "./TeamLogo";

export default function MatchCard({ fixture }: { fixture: EnrichedFixture }) {
  const matchupLabel = fixture.isSelfMatch
    ? "Friendly Fire"
    : fixture.isOwnerVsOwner
      ? "Owner v owner"
      : "Shared stakes";

  return (
    <article
      className={cn(
        "rounded-[18px] border bg-surface-high px-3 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.16)]",
        fixture.status === "live" ? "border-accent/35" : "border-outline-variant"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-muted">{fixture.readableKickoff}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.56rem] font-bold uppercase tracking-[0.12em]",
            fixture.status === "live" ? "bg-accent-strong/15 text-accent" : "bg-surface-panel text-ink-muted"
          )}
        >
          {fixture.status === "live" ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
          {statusLabel(fixture)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} className="h-10 w-10 border border-outline-variant bg-surface-high p-1.5" />
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-sm text-white">{fixture.homeTeam}</strong>
            <span className="truncate text-[0.72rem] text-ink-muted">{fixture.homeOwner}{fixture.homePot ? ` · P${fixture.homePot}` : ""}</span>
          </div>
        </div>
        <div className="rounded-[14px] border border-outline-variant bg-surface-panel px-3 py-2 font-display text-xl font-bold tracking-tight text-white">
          {fixture.homeScore ?? "-"} <span>-</span> {fixture.awayScore ?? "-"}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-sm text-white">{fixture.awayTeam}</strong>
            <span className="truncate text-[0.72rem] text-ink-muted">{fixture.awayOwner}{fixture.awayPot ? ` · P${fixture.awayPot}` : ""}</span>
          </div>
          <TeamLogo team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} className="h-10 w-10 border border-outline-variant bg-surface-high p-1.5" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.72rem] text-ink-muted">
        <span>{fixture.stage}{fixture.group ? ` · Group ${fixture.group}` : ""}</span>
        <span>{scoreLabel(fixture) === "vs" ? matchupLabel : `${matchupLabel} · ${scoreLabel(fixture)}`}</span>
      </div>
    </article>
  );
}

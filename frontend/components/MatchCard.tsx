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
        "rounded-[24px] border bg-surface-high px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]",
        fixture.status === "live" ? "border-accent/35" : "border-outline-variant"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-ink-muted">{fixture.readableKickoff}</span>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em]",
            fixture.status === "live" ? "bg-accent-strong/15 text-accent" : "bg-surface-panel text-ink-muted"
          )}
        >
          {fixture.status === "live" ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
          {statusLabel(fixture)}
        </span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
        <div className="grid justify-items-start gap-2">
          <TeamLogo team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} className="h-14 w-14 border border-outline-variant bg-surface-high p-2" />
          <strong className="text-white">{fixture.homeTeam}</strong>
          <span className="text-sm text-ink-muted">{fixture.homeOwner}{fixture.homePot ? ` · Pot ${fixture.homePot}` : ""}</span>
        </div>
        <div className="rounded-[20px] border border-outline-variant bg-surface-panel px-5 py-4 font-display text-4xl font-bold tracking-tight text-white">
          {fixture.homeScore ?? "-"} <span>-</span> {fixture.awayScore ?? "-"}
        </div>
        <div className="grid justify-items-start gap-2 md:justify-items-end md:text-right">
          <TeamLogo team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} className="h-14 w-14 border border-outline-variant bg-surface-high p-2" />
          <strong className="text-white">{fixture.awayTeam}</strong>
          <span className="text-sm text-ink-muted">{fixture.awayOwner}{fixture.awayPot ? ` · Pot ${fixture.awayPot}` : ""}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
        <span>{fixture.stage}{fixture.group ? ` · Group ${fixture.group}` : ""}</span>
        <span>{scoreLabel(fixture) === "vs" ? matchupLabel : `${matchupLabel} · ${scoreLabel(fixture)}`}</span>
      </div>
    </article>
  );
}

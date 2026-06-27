import Link from "next/link";
import { scoreLabel, statusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { buildMatchSlug } from "@/lib/match-slug";
import type { EnrichedFixture } from "@/lib/types";
import TeamLogo from "./TeamLogo";

function TeamMark({ team, code, logo }: { team: string; code?: string; logo?: string | null }) {
  return <TeamLogo team={team} code={code} logo={logo} className="h-5 w-5 rounded-md bg-transparent" />;
}

export default function MatchCard({ fixture }: { fixture: EnrichedFixture }) {
  const timeLabel = fixture.status === "scheduled" ? fixture.readableKickoff.split(", ").at(-1) : statusLabel(fixture);

  return (
    <Link
      href={`/match/${buildMatchSlug(fixture)}`}
      className="grid min-h-14 grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] items-center gap-x-0.5 border-b border-neutral-100 px-3 py-1.5 text-neutral-800 last:border-b-0 hover:bg-neutral-50 md:min-h-16 md:gap-x-3 md:px-4"
    >
      <div className="flex min-w-0 flex-row-reverse items-center justify-between gap-2">
        <div className="flex min-w-0 flex-row-reverse items-center justify-end text-right">
          <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} />
          <div className="grid min-w-0 gap-1 px-1.5 md:px-2.5">
            <strong className="truncate text-xs font-medium leading-tight tracking-[0.24px] md:text-sm">{fixture.homeTeam}</strong>
            <span className="truncate text-[0.68rem] leading-none text-neutral-500">{fixture.homeOwner}</span>
          </div>
        </div>
        <span
          className={cn(
            "hidden h-5 min-w-6 items-center justify-center rounded-xl bg-neutral-100 px-1.5 text-xs font-medium text-neutral-400 sm:flex",
            fixture.status === "live" && "bg-emerald-50 text-emerald-700"
          )}
        >
          {timeLabel}
        </span>
      </div>

      <div className="grid auto-rows-max justify-items-center gap-y-1.5">
        <span className="whitespace-nowrap text-xs font-medium md:text-sm">{scoreLabel(fixture)}</span>
        <span className="text-xs text-neutral-500 sm:hidden">{timeLabel}</span>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2 pr-1 md:pr-2">
        <div className="flex min-w-0 flex-row-reverse items-center justify-end">
          <div className="grid min-w-0 gap-1 px-1.5 md:px-2.5">
            <strong className="truncate text-xs font-medium leading-tight tracking-[0.24px] md:text-sm">{fixture.awayTeam}</strong>
            <span className="truncate text-[0.68rem] leading-none text-neutral-500">{fixture.awayOwner}</span>
          </div>
          <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} />
        </div>
        <span className="hidden text-xs text-neutral-400 md:block">{fixture.stage}</span>
      </div>
    </Link>
  );
}

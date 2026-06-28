import Link from "next/link";
import { getFixtures, getOwners } from "@/lib/api";
import EmptyState from "@/components/common/empty-state";
import StatusBadge from "@/components/common/status-badge";
import FixtureDatePicker from "@/components/FixtureDatePicker";
import FixtureOwnerFilter from "@/components/FixtureOwnerFilter";
import FixturesSwipeShell from "@/components/FixturesSwipeShell";
import SectionShell from "@/components/layout/section-shell";
import { buildMatchSlug } from "@/lib/match-slug";
import TeamLogo from "@/components/TeamLogo";
import { cn } from "@/lib/utils";
import type { EnrichedFixture, OwnerSummary } from "@/lib/types";

type FixturesSearchParams = {
  date?: string | string[];
  owner?: string | string[];
  mode?: string | string[];
  view?: string | string[];
};

const FIXTURE_SPAN_MS = 3 * 60 * 60 * 1000;
const DISPLAY_TIME_ZONE = "Europe/London";
const KNOCKOUT_STAGES = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"] as const;

type FixturesView = "fixtures" | "knockouts";
type KnockoutMode = "stands" | "confirmed";
type KnockoutSlot = {
  team: string;
  code?: string;
  logo?: string | null;
  pending: boolean;
};

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01"
  };
}

function dateKey(date: Date) {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function addDays(key: string, days: number) {
  const next = parseDateKey(key);
  next.setUTCDate(next.getUTCDate() + days);
  return dateKey(next);
}

function isValidDateKey(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function fixtureDateKeys(fixture: EnrichedFixture) {
  const kickoff = new Date(fixture.kickoff);
  const start = dateKey(kickoff);
  const end = dateKey(new Date(kickoff.getTime() + FIXTURE_SPAN_MS));
  return start === end ? [start] : [start, end];
}

function buildDateRange(fixtures: EnrichedFixture[]) {
  if (!fixtures.length) {
    return [dateKey(new Date())];
  }

  const rangeKeys = fixtures.flatMap((fixture) => fixtureDateKeys(fixture));
  const start = rangeKeys.reduce((earliest, current) => (current < earliest ? current : earliest));
  const end = rangeKeys.reduce((latest, current) => (current > latest ? current : latest));
  const days: string[] = [];

  for (let current = start; current <= end; current = addDays(current, 1)) {
    days.push(current);
  }

  return days;
}

function dayChip(dateValue: string, todayValue: string) {
  if (dateValue === todayValue) {
    return { title: "Today", detail: formatShortDate(dateValue) };
  }
  if (dateValue === addDays(todayValue, -1)) {
    return { title: "Yesterday", detail: formatShortDate(dateValue) };
  }
  if (dateValue === addDays(todayValue, 1)) {
    return { title: "Tomorrow", detail: formatShortDate(dateValue) };
  }

  return {
    title: new Intl.DateTimeFormat("en-GB", {
      timeZone: DISPLAY_TIME_ZONE,
      weekday: "short"
    }).format(parseDateKey(dateValue)),
    detail: formatShortDate(dateValue)
  };
}

function formatShortDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "numeric",
    month: "short"
  }).format(parseDateKey(dateValue));
}

function formatLongDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(parseDateKey(dateValue));
}

function dateNavTitle(dateValue: string, todayValue: string) {
  return dayChip(dateValue, todayValue).title;
}

function ChevronCircle({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="25" viewBox="0 0 25 25" aria-hidden="true" className={cn("h-7 w-7", direction === "right" && "rotate-180")}>
      <g fill="none" fillRule="evenodd">
        <circle cx="12.5" cy="12.5" r="12.5" className="fill-gray-200" />
        <g transform="translate(5 5)">
          <path d="M0 0h15v15H0z" />
          <path
            fillRule="nonzero"
            transform="translate(6.7765 7.5235) rotate(180) translate(-6.7765 -7.5235)"
            d="M9.554 7.523 5.448 2.693 4.12 3.659l2.536 3.864-2.657 3.865 1.449.966 4.106-4.83"
            className="fill-neutral-800"
          />
        </g>
      </g>
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg viewBox="0 0 15 15" aria-hidden="true" className="h-4 w-4">
      <path
        d="M.3 2.883 2.886.293a1 1 0 0 1 1.41 0l2.59 2.59a1 1 0 0 1-.71 1.71H1a1 1 0 0 1-.7-1.71z"
        transform="rotate(180 5.54 5)"
        className="fill-neutral-800"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M0 0h24v24H0z" className="fill-none" />
      <path
        d="M11 18h2a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2zM3 7a1 1 0 0 0 1 1h16a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1zm4 6h10a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2z"
        className="fill-neutral-500"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none">
      <path
        d="M7.87027 17.2658L11.1156 13.8821C11.2317 13.761 11.3696 13.6649 11.5213 13.5993C11.6731 13.5337 11.8358 13.5 12.0001 13.5C12.1645 13.5 12.3272 13.5337 12.4789 13.5993C12.6307 13.6649 12.7686 13.761 12.8846 13.8821L16.1338 17.2658C16.309 17.4492 16.4282 17.6826 16.4763 17.9365C16.5243 18.1904 16.4991 18.4534 16.4038 18.6924C16.3085 18.9314 16.1473 19.1356 15.9407 19.2793C15.734 19.4231 15.4912 19.4998 15.2427 19.5L8.74442 19.5C8.49677 19.4978 8.25529 19.4193 8.05037 19.2745C7.84545 19.1297 7.68624 18.9249 7.59279 18.6861C7.49934 18.4472 7.47583 18.1849 7.5252 17.9322C7.57457 17.6795 7.69463 17.4476 7.87027 17.2658Z"
        className="fill-current"
      />
      <path
        d="M16.1297 6.73423L12.8844 10.1179C12.7683 10.239 12.6304 10.3351 12.4787 10.4007C12.3269 10.4663 12.1642 10.5 11.9999 10.5C11.8355 10.5 11.6728 10.4663 11.5211 10.4007C11.3693 10.3351 11.2314 10.239 11.1154 10.1179L7.86623 6.73423C7.69097 6.55078 7.5718 6.31739 7.52375 6.0635C7.4757 5.80961 7.50092 5.54659 7.59623 5.30761C7.69155 5.06863 7.85268 4.86439 8.05932 4.72067C8.26595 4.57694 8.50883 4.50015 8.75731 4.5L15.2556 4.5C15.5032 4.50222 15.7447 4.58069 15.9496 4.72552C16.1546 4.87035 16.3138 5.07507 16.4072 5.31391C16.5007 5.55276 16.5242 5.81505 16.4748 6.06778C16.4254 6.32052 16.3054 6.55239 16.1297 6.73423Z"
        className="fill-current"
      />
    </svg>
  );
}

function statusLabel(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return `Live${fixture.minute ? ` • ${fixture.minute}` : ""}`;
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return "Kickoff";
}

function scoreLabel(fixture: EnrichedFixture) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "VS";
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function normaliseView(value: string | undefined): FixturesView {
  return value === "knockouts" ? "knockouts" : "fixtures";
}

function normaliseKnockoutMode(value: string | undefined): KnockoutMode {
  return value === "confirmed" ? "confirmed" : "stands";
}

function stageIndex(stage: string) {
  const index = KNOCKOUT_STAGES.findIndex((knownStage) => knownStage === stage);
  return index === -1 ? KNOCKOUT_STAGES.length : index;
}

function isKnockoutFixture(fixture: EnrichedFixture) {
  return fixture.stage && fixture.stage !== "Group stage";
}

function sortFixturesByRound(fixtures: EnrichedFixture[]) {
  return [...fixtures].sort((a, b) => {
    const stageDelta = stageIndex(a.stage) - stageIndex(b.stage);
    if (stageDelta !== 0) {
      return stageDelta;
    }
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });
}

function isPlaceholderTeam(team: string) {
  return /winner|group|third place|runner-up|tbd|to be decided/i.test(team);
}

function compactPlaceholder(team: string) {
  return team
    .replace(/^Round of /i, "R")
    .replace(/ Winner$/i, "W")
    .replace(/^Group /i, "G")
    .replace(/ Winner$/i, "W")
    .replace(/ 2nd Place$/i, " 2nd")
    .replace(/^Third Place Group /i, "3rd ");
}

function fixtureTeamSlot(fixture: EnrichedFixture, side: "home" | "away"): KnockoutSlot {
  const team = side === "home" ? fixture.homeTeam : fixture.awayTeam;
  return {
    team,
    code: side === "home" ? fixture.homeTeamCode ?? fixture.homeCode : fixture.awayTeamCode ?? fixture.awayCode,
    logo: side === "home" ? fixture.homeTeamLogo ?? fixture.homeLogo : fixture.awayTeamLogo ?? fixture.awayLogo,
    pending: isPlaceholderTeam(team)
  };
}

function winnerSlot(fixture: EnrichedFixture, mode: KnockoutMode): KnockoutSlot | null {
  if (fixture.homeScore === null || fixture.awayScore === null || fixture.homeScore === fixture.awayScore) {
    return null;
  }

  if (fixture.status !== "finished" && mode === "confirmed") {
    return null;
  }

  return fixtureTeamSlot(fixture, fixture.homeScore > fixture.awayScore ? "home" : "away");
}

function resolveWinnerReference(
  team: string,
  mode: KnockoutMode,
  fixturesByStage: Map<string, EnrichedFixture[]>
): KnockoutSlot | null {
  const match = team.match(/^(.+?)\s+(\d+)\s+Winner$/i);
  if (!match) {
    return null;
  }

  const [, stage, ordinalValue] = match;
  const referencedFixture = fixturesByStage.get(stage)?.[Number(ordinalValue) - 1];
  if (!referencedFixture) {
    return null;
  }

  return winnerSlot(referencedFixture, mode);
}

function resolveSlot(
  fixture: EnrichedFixture,
  side: "home" | "away",
  mode: KnockoutMode,
  fixturesByStage: Map<string, EnrichedFixture[]>
): KnockoutSlot {
  const baseSlot = fixtureTeamSlot(fixture, side);
  if (!baseSlot.pending) {
    return baseSlot;
  }

  const resolvedWinner = resolveWinnerReference(baseSlot.team, mode, fixturesByStage);
  if (resolvedWinner) {
    return resolvedWinner;
  }

  if (mode === "confirmed") {
    return { team: "TBD", code: "TBD", pending: true };
  }

  return {
    team: compactPlaceholder(baseSlot.team),
    code: baseSlot.code,
    pending: true
  };
}

function dateHref(selectedDate: string, owner: string) {
  const params = new URLSearchParams();
  params.set("date", selectedDate);
  if (owner) {
    params.set("owner", owner);
  }
  const query = params.toString();
  return query ? `/fixtures?${query}` : "/fixtures";
}

function viewHref(view: FixturesView, selectedDate: string, owner: string, mode: KnockoutMode = "stands") {
  const params = new URLSearchParams();
  if (view === "knockouts") {
    params.set("view", "knockouts");
    params.set("mode", mode);
  } else {
    params.set("date", selectedDate);
    if (owner) {
      params.set("owner", owner);
    }
  }
  const query = params.toString();
  return query ? `/fixtures?${query}` : "/fixtures";
}

function TeamCrest({ team, code, logo }: { team: string; code?: string; logo?: string | null }) {
  return <TeamLogo team={team} code={code} logo={logo} className="h-5 w-5 rounded-md bg-transparent md:h-6 md:w-6" />;
}

function ownerMeta(fixture: EnrichedFixture, side: "home" | "away") {
  const owner = side === "home" ? fixture.homeOwner : fixture.awayOwner;
  const pot = side === "home" ? fixture.homePot : fixture.awayPot;
  if (fixture.isSelfMatch) {
    return `${owner || "Unassigned"} · Friendly`;
  }
  return `${owner || "Unassigned"} · ${pot ? `P${pot}` : "P-"}`;
}

function FixtureCard({ fixture }: { fixture: EnrichedFixture }) {
  return (
    <Link
      href={`/match/${buildMatchSlug(fixture)}`}
      className={cn(
        "grid min-h-14 grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] items-center gap-x-0.5 border-b border-neutral-100 px-3 py-1.5 text-neutral-800 last:border-b-0 hover:bg-neutral-50 md:min-h-16 md:gap-x-3 md:px-4",
        fixture.status === "live" && "bg-red-50/50",
        fixture.isOwnerVsOwner && "bg-emerald-50/60"
      )}
    >
      <div className="flex min-w-0 flex-row-reverse items-center justify-between gap-2">
        <div className="flex min-w-0 flex-row-reverse items-center justify-end text-right">
          <TeamCrest team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} />
          <div className="grid min-w-0 gap-1 px-1.5 md:px-2.5">
            <strong className="truncate text-xs font-medium leading-tight tracking-[0.24px] md:text-sm">{fixture.homeTeam}</strong>
            <span className="truncate text-[0.68rem] leading-none text-neutral-500">{ownerMeta(fixture, "home")}</span>
          </div>
        </div>
        <span className="hidden h-5 min-w-6 items-center justify-center rounded-xl bg-neutral-100 px-1.5 text-xs font-medium text-neutral-400 sm:flex">
          {fixture.status === "scheduled" ? fixture.readableKickoff.split(", ").at(-1) : statusLabel(fixture)}
        </span>
      </div>

      <div className="grid auto-rows-max justify-items-center gap-y-1.5">
        <span className="whitespace-nowrap text-xs font-medium md:text-sm">{scoreLabel(fixture)}</span>
        <span className="text-xs text-neutral-500 sm:hidden">
          {fixture.status === "scheduled" ? fixture.readableKickoff.split(", ").at(-1) : statusLabel(fixture)}
        </span>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2 pr-1 md:pr-2">
        <div className="flex min-w-0 flex-row-reverse items-center justify-end">
          <div className="grid min-w-0 gap-1 px-1.5 md:px-2.5">
            <strong className="truncate text-xs font-medium leading-tight tracking-[0.24px] md:text-sm">{fixture.awayTeam}</strong>
            <span className="truncate text-[0.68rem] leading-none text-neutral-500">{ownerMeta(fixture, "away")}</span>
          </div>
          <TeamCrest team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} />
        </div>
        <div className="hidden items-center gap-1 md:flex">
          {fixture.isOwnerVsOwner ? <StatusBadge tone="accent">Battle</StatusBadge> : null}
          <span className="text-xs text-neutral-400">{fixture.stage}</span>
        </div>
      </div>
    </Link>
  );
}

function KnockoutTeamMark({ slot, align }: { slot: KnockoutSlot; align: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-1", align === "right" && "text-right")}>
      {slot.logo && !slot.pending ? (
        <TeamLogo team={slot.team} code={slot.code} logo={slot.logo} className="h-5 w-5 rounded-md bg-transparent" />
      ) : (
        <span className="grid h-5 w-5 place-items-center rounded-md bg-neutral-100 text-[0.54rem] font-medium text-neutral-500">
          {(slot.code ?? slot.team).slice(0, 3).toUpperCase()}
        </span>
      )}
      <span
        className={cn(
          "max-w-full truncate text-[0.62rem] font-medium leading-none text-neutral-800",
          slot.pending && "text-neutral-400"
        )}
        title={slot.team}
      >
        {slot.pending ? slot.team : slot.code ?? slot.team}
      </span>
    </div>
  );
}

function formatKnockoutDate(fixture: EnrichedFixture) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(fixture.kickoff));
}

function KnockoutMatchCard({
  awaySlot,
  fixture,
  homeSlot
}: {
  awaySlot: KnockoutSlot;
  fixture: EnrichedFixture;
  homeSlot: KnockoutSlot;
}) {
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <Link
      href={`/match/${buildMatchSlug(fixture)}`}
      className="relative grid h-20 w-24 shrink-0 grid-rows-[1fr_auto] rounded-xl bg-white px-2 py-2 text-neutral-800 shadow-[0_1px_0_rgba(15,23,42,0.06)] outline-0 ring-1 ring-neutral-100 transition hover:bg-neutral-50"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
        <KnockoutTeamMark slot={homeSlot} align="left" />
        <span className="self-center whitespace-nowrap text-[0.66rem] font-medium text-neutral-500">
          {hasScore ? `${fixture.homeScore}-${fixture.awayScore}` : "v"}
        </span>
        <KnockoutTeamMark slot={awaySlot} align="right" />
      </div>
      <span className="truncate text-center text-[0.58rem] font-medium leading-none text-neutral-400">{formatKnockoutDate(fixture)}</span>
    </Link>
  );
}

function roundGap(index: number) {
  return ["0.5rem", "2.25rem", "5.5rem", "9rem", "12rem"][index] ?? "3rem";
}

function KnockoutBracket({
  fixtures,
  mode,
  activeDate,
  activeOwner
}: {
  activeDate: string;
  activeOwner: string;
  fixtures: EnrichedFixture[];
  mode: KnockoutMode;
}) {
  const knockoutFixtures = sortFixturesByRound(fixtures.filter(isKnockoutFixture));
  const fixturesByStage = new Map<string, EnrichedFixture[]>();
  for (const fixture of knockoutFixtures) {
    fixturesByStage.set(fixture.stage, [...(fixturesByStage.get(fixture.stage) ?? []), fixture]);
  }
  const stages = KNOCKOUT_STAGES.filter((stage) => fixturesByStage.has(stage));

  if (!knockoutFixtures.length) {
    return <EmptyState title="No knockout fixtures found" description="Knockout fixtures will appear here once they are available." />;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-100 bg-neutral-100 text-sm font-normal leading-none">
      <div className="flex h-11 items-center justify-between border-b border-b-neutral-200 bg-white px-3 md:h-12 md:px-4">
        <div className="flex items-center gap-1.5">
          {(["stands", "confirmed"] as const).map((modeOption) => (
            <Link
              key={modeOption}
              href={viewHref("knockouts", activeDate, activeOwner, modeOption)}
              className={cn(
                "flex h-7 items-center rounded-3xl px-3 text-[0.68rem] font-medium outline-0 md:text-xs",
                mode === modeOption ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              {modeOption === "stands" ? "As it stands" : "Confirmed"}
            </Link>
          ))}
        </div>
        <span className="text-[0.68rem] font-medium text-neutral-400 md:text-xs">{knockoutFixtures.length} ties</span>
      </div>

      <div className="max-h-[calc(100vh-13rem)] overflow-auto p-2 md:p-3">
        <div className="flex min-w-max items-start gap-5 md:gap-8">
          {stages.map((stage, index) => (
            <div key={stage} className="grid min-w-24 gap-2">
              <h2 className="sticky top-0 z-10 bg-neutral-100 py-1 text-center text-[0.64rem] font-medium uppercase tracking-[0.14em] text-neutral-500">
                {stage}
              </h2>
              <div className="relative flex flex-col items-center" style={{ gap: roundGap(index) }}>
                {fixturesByStage.get(stage)?.map((fixture) => (
                  <KnockoutMatchCard
                    key={fixture.id}
                    fixture={fixture}
                    homeSlot={resolveSlot(fixture, "home", mode, fixturesByStage)}
                    awaySlot={resolveSlot(fixture, "away", mode, fixturesByStage)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FixturesNav({
  activeDate,
  activeDateLabel,
  activeOwner,
  activeView,
  canGoNext,
  canGoPrevious,
  knockoutMatchCount,
  knockoutMode,
  nextDate,
  owners,
  previousDate,
  todayValue,
  visibleMatchCount
}: {
  activeDate: string;
  activeDateLabel: string;
  activeOwner: string;
  activeView: FixturesView;
  canGoNext: boolean;
  canGoPrevious: boolean;
  knockoutMatchCount: number;
  knockoutMode: KnockoutMode;
  nextDate: string;
  owners: OwnerSummary[];
  previousDate: string;
  todayValue: string;
  visibleMatchCount: number;
}) {
  const dateTitle = dateNavTitle(activeDate, todayValue);
  const isKnockoutsView = activeView === "knockouts";

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-100 bg-white text-sm font-normal leading-none">
      <nav className="flex h-11 w-full items-center border-b border-b-neutral-100 px-3 md:h-12 md:px-4">
        <div className="flex w-full items-center justify-between">
          <Link
            href={dateHref(previousDate, activeOwner)}
            aria-label={`Go to ${formatLongDate(previousDate)}`}
            className={cn("h-6 w-6 text-neutral-800 outline-0 md:h-7 md:w-7", (!canGoPrevious || isKnockoutsView) && "pointer-events-none opacity-40")}
          >
            <ChevronCircle direction="left" />
          </Link>

          <div className="relative flex items-center justify-center">
            {isKnockoutsView ? (
              <span className="text-sm font-medium text-neutral-800 md:text-base">Knockouts</span>
            ) : (
              <>
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex cursor-pointer items-center justify-center border-0 text-neutral-800 outline-0 focus-visible:opacity-60"
                >
                  <span className="flex items-center justify-center text-sm font-medium text-neutral-800 md:text-base">
                    {dateTitle}
                    <i className="ml-1.5 grid w-4 content-center justify-center">
                      <CaretIcon />
                    </i>
                  </span>
                </button>
                <FixtureDatePicker
                  activeDate={activeDate}
                  activeOwner={activeOwner}
                  className="absolute inset-0 h-full w-full cursor-pointer border-0 py-px opacity-0"
                />
              </>
            )}
          </div>

          <Link
            href={dateHref(nextDate, activeOwner)}
            aria-label={`Go to ${formatLongDate(nextDate)}`}
            className={cn("h-6 w-6 text-neutral-800 outline-0 md:h-7 md:w-7", (!canGoNext || isKnockoutsView) && "pointer-events-none opacity-40")}
          >
            <ChevronCircle direction="right" />
          </Link>
        </div>
      </nav>

      <div className="flex h-11 w-full items-center gap-1.5 px-3 md:h-12 md:gap-2 md:px-4">
        <Link
          href={viewHref("fixtures", activeDate, activeOwner)}
          className={cn(
            "flex h-6 min-w-min grow basis-0 items-center justify-center whitespace-nowrap rounded-3xl border border-gray-200 px-2 text-[0.68rem] font-medium outline-0 md:h-7 md:px-3 md:text-xs",
            activeView === "fixtures" ? "bg-neutral-100 text-neutral-800" : "bg-white text-neutral-500"
          )}
        >
          Fixtures
        </Link>
        <Link
          href={viewHref("knockouts", activeDate, activeOwner, knockoutMode)}
          className={cn(
            "flex h-6 min-w-min grow basis-0 items-center justify-center whitespace-nowrap rounded-3xl border border-gray-200 px-2 text-[0.68rem] font-medium outline-0 md:h-7 md:px-3 md:text-xs",
            activeView === "knockouts" ? "bg-neutral-100 text-neutral-800" : "bg-white text-neutral-500"
          )}
        >
          Knockouts
        </Link>

        {isKnockoutsView ? (
          <>
            {(["stands", "confirmed"] as const).map((modeOption) => (
              <Link
                key={modeOption}
                href={viewHref("knockouts", activeDate, activeOwner, modeOption)}
                className={cn(
                  "flex h-6 min-w-min grow basis-0 items-center justify-center whitespace-nowrap rounded-3xl border border-gray-200 px-2 text-[0.68rem] font-medium outline-0 md:h-7 md:px-3 md:text-xs",
                  knockoutMode === modeOption ? "bg-neutral-900 text-white" : "bg-white text-neutral-500"
                )}
              >
                {modeOption === "stands" ? "Stands" : "Confirmed"}
              </Link>
            ))}
            <div className="hidden h-7 grow items-center justify-center rounded-3xl border border-gray-200 bg-white px-3 text-xs leading-none tracking-[0.21px] text-neutral-500 md:flex">
              {knockoutMatchCount} ties
            </div>
          </>
        ) : (
          <>
        <Link
          href={dateHref(activeDate, "")}
          className={cn(
            "flex h-6 min-w-min grow basis-0 items-center justify-center whitespace-nowrap rounded-3xl border border-gray-200 bg-white px-2 text-[0.68rem] font-medium text-neutral-800 outline-0 md:h-7 md:w-auto md:px-3 md:text-xs",
            !activeOwner && "bg-neutral-100"
          )}
        >
          All
        </Link>

        <div className="relative flex h-6 min-w-0 grow basis-0 items-center rounded-3xl border border-gray-200 bg-white px-2.5 md:h-7 md:px-3">
          <FilterIcon />
          <FixtureOwnerFilter
            activeDate={activeDate}
            activeOwner={activeOwner}
            owners={owners}
            className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pl-1.5 text-[0.68rem] font-medium text-neutral-800 outline-0 md:pl-2 md:text-xs"
          />
        </div>

        <div className="hidden h-7 grow items-center rounded-3xl border border-gray-200 bg-white px-3 md:flex">
          <FilterIcon />
          <span className="pl-2 text-xs leading-none tracking-[0.21px] text-neutral-500">
            {visibleMatchCount} match{visibleMatchCount === 1 ? "" : "es"}
          </span>
        </div>

        <div className="hidden h-7 grow items-center rounded-3xl border border-gray-200 bg-white px-3 text-xs leading-none tracking-[0.21px] text-neutral-500 md:flex">
          {activeDateLabel}
        </div>

        <button
          type="button"
          aria-label="Sorted by time"
          className="flex h-6 min-w-6 flex-none items-center justify-center rounded-3xl border border-gray-200 bg-white px-0 text-xs font-medium text-neutral-800 outline-0 md:h-7 md:min-w-7"
        >
          <SortIcon />
        </button>
          </>
        )}
      </div>
    </section>
  );
}

export default async function FixturesPage({
  searchParams
}: {
  searchParams?: Promise<FixturesSearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeOwner = firstParam(params.owner) ?? "";
  const activeView = normaliseView(firstParam(params.view));
  const knockoutMode = normaliseKnockoutMode(firstParam(params.mode));

  const [fixtures, owners] = await Promise.all([
    safe(getFixtures(), [] as EnrichedFixture[]),
    safe(getOwners(), [] as OwnerSummary[])
  ]);

  const availableDates = buildDateRange(fixtures);
  const todayValue = dateKey(new Date());
  const requestedDate = firstParam(params.date);
  const fallbackDate = availableDates.includes(todayValue) ? todayValue : availableDates[0];
  const activeDate = isValidDateKey(requestedDate) && availableDates.includes(requestedDate ?? "") ? requestedDate ?? fallbackDate : fallbackDate;
  const activeIndex = Math.max(availableDates.indexOf(activeDate), 0);
  const previousDate = availableDates[Math.max(activeIndex - 1, 0)] ?? activeDate;
  const nextDate = availableDates[Math.min(activeIndex + 1, availableDates.length - 1)] ?? activeDate;
  const canGoPrevious = previousDate !== activeDate;
  const canGoNext = nextDate !== activeDate;
  const selectedFixtures = fixtures.filter((fixture) => fixtureDateKeys(fixture).includes(activeDate));
  const visibleFixtures = selectedFixtures.filter((fixture) => {
    if (!activeOwner) {
      return true;
    }
    return fixture.homeOwner === activeOwner || fixture.awayOwner === activeOwner;
  });
  const visibleMatchCount = visibleFixtures.length;
  const knockoutMatchCount = fixtures.filter(isKnockoutFixture).length;
  const activeDateLabel = formatLongDate(activeDate);

  return (
    <FixturesSwipeShell
      previousHref={dateHref(previousDate, activeOwner)}
      nextHref={dateHref(nextDate, activeOwner)}
      canGoPrevious={activeView === "fixtures" && canGoPrevious}
      canGoNext={activeView === "fixtures" && canGoNext}
    >
      <FixturesNav
        activeDate={activeDate}
        activeDateLabel={activeDateLabel}
        activeOwner={activeOwner}
        activeView={activeView}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        knockoutMatchCount={knockoutMatchCount}
        knockoutMode={knockoutMode}
        nextDate={nextDate}
        owners={owners}
        previousDate={previousDate}
        todayValue={todayValue}
        visibleMatchCount={visibleMatchCount}
      />

      {activeView === "knockouts" ? (
        <KnockoutBracket activeDate={activeDate} activeOwner={activeOwner} fixtures={fixtures} mode={knockoutMode} />
      ) : (
        <SectionShell marker={activeDateLabel} title="Matches" contentClassName="p-0">
          {visibleFixtures.length ? (
            <div className="grid">
              {visibleFixtures.map((fixture) => <FixtureCard key={`${fixture.id}-${activeDate}`} fixture={fixture} />)}
            </div>
          ) : (
            <EmptyState title="No fixtures found" description="Try another day or owner filter." />
          )}
        </SectionShell>
      )}
    </FixturesSwipeShell>
  );
}

import Link from "next/link";
import { getFixtures, getOwners } from "@/lib/api";
import EmptyState from "@/components/common/empty-state";
import StatusBadge from "@/components/common/status-badge";
import FixturesSwipeShell from "@/components/FixturesSwipeShell";
import PageHeader from "@/components/layout/page-header";
import SectionShell from "@/components/layout/section-shell";
import OwnerAvatar from "@/components/OwnerAvatar";
import { teamCode } from "@/lib/format";
import TeamLogo from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EnrichedFixture, OwnerSummary } from "@/lib/types";

type FixturesSearchParams = {
  date?: string | string[];
  owner?: string | string[];
};

const FIXTURE_SPAN_MS = 3 * 60 * 60 * 1000;
const DISPLAY_TIME_ZONE = "Europe/London";

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

function dateHref(selectedDate: string, owner: string) {
  const params = new URLSearchParams();
  params.set("date", selectedDate);
  if (owner) {
    params.set("owner", owner);
  }
  const query = params.toString();
  return query ? `/fixtures?${query}` : "/fixtures";
}

function ownerHref(owner: string, selectedDate: string) {
  const params = new URLSearchParams();
  params.set("date", selectedDate);
  if (owner) {
    params.set("owner", owner);
  }
  const query = params.toString();
  return query ? `/fixtures?${query}` : "/fixtures";
}

function TeamCrest({ team, code, logo }: { team: string; code?: string; logo?: string | null }) {
  return <TeamLogo team={team} code={code} logo={logo} className="h-14 w-14 border-2 border-foreground bg-background p-2 md:h-16 md:w-16" />;
}

function PotBadge({ pot }: { pot: number | null }) {
  return <StatusBadge tone="muted">{pot ? `Pot ${pot}` : "No pot"}</StatusBadge>;
}

function SmallOwnerAvatar({ owner }: { owner: string }) {
  return <OwnerAvatar owner={owner} className="h-9 w-9 border-2 border-foreground" />;
}

function OwnersBand({ fixture }: { fixture: EnrichedFixture }) {
  if (fixture.isSelfMatch) {
    return (
      <div className="mt-5 flex items-center gap-3 border-2 border-foreground bg-secondary px-4 py-3">
        <SmallOwnerAvatar owner={fixture.homeOwner} />
        <div className="grid gap-0.5">
          <strong>Friendly Fire</strong>
          <span className="text-sm text-muted-foreground">{fixture.homeOwner} owns both teams</span>
        </div>
      </div>
    );
  }

  if (fixture.isOwnerVsOwner) {
    return (
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-2 border-foreground bg-accent px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <SmallOwnerAvatar owner={fixture.homeOwner} />
          <span className="truncate text-sm">{fixture.homeOwner}</span>
        </div>
        <StatusBadge tone="default">Battle</StatusBadge>
        <div className="flex min-w-0 items-center justify-end gap-3">
          <span className="truncate text-right text-sm">{fixture.awayOwner}</span>
          <SmallOwnerAvatar owner={fixture.awayOwner} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-2 border-foreground bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <SmallOwnerAvatar owner={fixture.homeOwner} />
        <span className="truncate text-sm">{fixture.homeOwner || "Unassigned"}</span>
      </div>
      <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">v</span>
      <div className="flex min-w-0 items-center justify-end gap-3">
        <span className="truncate text-right text-sm">{fixture.awayOwner || "Unassigned"}</span>
        <SmallOwnerAvatar owner={fixture.awayOwner} />
      </div>
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: EnrichedFixture }) {
  return (
    <article className={cn("brutal-surface px-5 py-5 md:px-6", fixture.status === "live" && "bg-secondary", fixture.isOwnerVsOwner && "bg-accent/40")}>
      <div className="flex items-center justify-between gap-3">
        <StatusBadge tone={fixture.status === "live" ? "destructive" : fixture.status === "scheduled" ? "muted" : "default"}>
          {fixture.status === "scheduled" ? fixture.readableKickoff : statusLabel(fixture)}
        </StatusBadge>
        <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{fixture.stage}</span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
        <div className="flex items-center gap-4">
          <TeamCrest team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} />
          <div className="grid gap-2">
            <strong className="font-display text-3xl font-black">{teamCode(fixture.homeTeam, fixture.homeTeamCode ?? fixture.homeCode)}</strong>
            <PotBadge pot={fixture.homePot} />
          </div>
        </div>

        <div className="grid place-items-center gap-1 border-2 border-foreground bg-primary px-5 py-4 text-center text-primary-foreground">
          <strong className="font-display text-4xl font-black md:text-5xl">{scoreLabel(fixture)}</strong>
          <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-primary-foreground/80">{fixture.stage}</span>
        </div>

        <div className="flex items-center gap-4 md:flex-row-reverse md:text-right">
          <TeamCrest team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} />
          <div className="grid gap-2">
            <strong className="font-display text-3xl font-black">{teamCode(fixture.awayTeam, fixture.awayTeamCode ?? fixture.awayCode)}</strong>
            <PotBadge pot={fixture.awayPot} />
          </div>
        </div>
      </div>

      <OwnersBand fixture={fixture} />
    </article>
  );
}

export default async function FixturesPage({
  searchParams
}: {
  searchParams?: Promise<FixturesSearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeOwner = firstParam(params.owner) ?? "";

  const [fixtures, owners] = await Promise.all([
    safe(getFixtures(), [] as EnrichedFixture[]),
    safe(getOwners(), [] as OwnerSummary[])
  ]);

  const availableDates = buildDateRange(fixtures);
  const dateCounts = new Map<string, number>();
  for (const fixture of fixtures) {
    for (const day of fixtureDateKeys(fixture)) {
      dateCounts.set(day, (dateCounts.get(day) ?? 0) + 1);
    }
  }
  const todayValue = dateKey(new Date());
  const requestedDate = firstParam(params.date);
  const fallbackDate = availableDates.includes(todayValue) ? todayValue : availableDates[0];
  const todayTarget = availableDates.includes(todayValue) ? todayValue : fallbackDate;
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
  const activeDateLabel = formatLongDate(activeDate);

  return (
    <FixturesSwipeShell
      previousHref={dateHref(previousDate, activeOwner)}
      nextHref={dateHref(nextDate, activeOwner)}
      canGoPrevious={canGoPrevious}
      canGoNext={canGoNext}
    >
      <PageHeader
        eyebrow="Matchday"
        title="Fixtures"
        description={
          <>
            {activeDateLabel} • {visibleMatchCount} match{visibleMatchCount === 1 ? "" : "es"}
          </>
        }
      />

      <SectionShell marker="Filters" title="Browse Fixtures">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4">
            <div className="fixtures-date-scroll flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {availableDates.map((day) => {
                const chip = dayChip(day, todayValue);
                const dayCount = dateCounts.get(day) ?? 0;

                return (
                  <Button
                    key={day}
                    asChild
                    variant={day === activeDate ? "accent" : "outline"}
                    className="min-h-[88px] min-w-[144px] items-start justify-start px-4 py-3 text-left"
                  >
                    <Link href={dateHref(day, activeOwner)} aria-current={day === activeDate ? "date" : undefined}>
                      <span className="block font-display text-2xl font-black normal-case tracking-[-0.04em]">{chip.title}</span>
                      <span className="mt-1 block font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em]">{chip.detail}</span>
                      <span className="mt-2 block text-xs normal-case tracking-normal">
                        {dayCount} match{dayCount === 1 ? "" : "es"}
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm" className={!canGoPrevious ? "pointer-events-none opacity-40" : ""}>
                <Link href={dateHref(previousDate, activeOwner)} aria-label={`Go to ${formatLongDate(previousDate)}`}>
                  Previous
                </Link>
              </Button>
              <Button asChild variant={activeDate === todayTarget ? "accent" : "outline"} size="sm">
                <Link href={dateHref(todayTarget, activeOwner)}>Today</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className={!canGoNext ? "pointer-events-none opacity-40" : ""}>
                <Link href={dateHref(nextDate, activeOwner)} aria-label={`Go to ${formatLongDate(nextDate)}`}>
                  Next
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <form className="grid gap-2" action="/fixtures">
              <Label htmlFor="owner">Filter by owner</Label>
              <input type="hidden" name="date" value={activeDate} />
              <select
                id="owner"
                name="owner"
                defaultValue={activeOwner}
                aria-label="Filter fixtures by owner"
                className="h-11 border-0 border-b-2 border-foreground bg-transparent px-0 text-sm text-foreground outline-none"
              >
                <option value="">All owners</option>
                {owners.map((owner) => (
                  <option key={owner.owner} value={owner.owner}>
                    {owner.owner}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="accent" className="w-fit">
                Apply
              </Button>
            </form>

            <form className="grid gap-2" action="/fixtures">
              {activeOwner ? <input type="hidden" name="owner" value={activeOwner} /> : null}
              <Label htmlFor="fixture-date">Pick a date</Label>
              <Input id="fixture-date" name="date" type="date" defaultValue={activeDate} />
              <Button type="submit" variant="outline" className="w-fit">
                Go
              </Button>
            </form>
          </div>
        </div>
      </SectionShell>

      {activeOwner ? (
        <SectionShell marker="Active Filter" title={activeOwner} actions={<Button asChild variant="ghost" size="sm"><Link href={ownerHref("", activeDate)}>Clear</Link></Button>}>
          <p className="text-sm leading-7 text-muted-foreground">Showing fixtures involving this owner on the selected date.</p>
        </SectionShell>
      ) : null}

      <SectionShell marker="Fixtures" title="Match List">
        {visibleFixtures.length ? (
          <div className="grid gap-5">
            {visibleFixtures.map((fixture) => <FixtureCard key={`${fixture.id}-${activeDate}`} fixture={fixture} />)}
          </div>
        ) : (
          <EmptyState title="No fixtures found" description="Try another day or owner filter." />
        )}
      </SectionShell>
    </FixturesSwipeShell>
  );
}

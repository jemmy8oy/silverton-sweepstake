import Link from "next/link";
import { getFixtures, getLeaderboards, getLiveFixtures, getOwners, getTodayFixtures, getUnderdog } from "@/lib/api";
import EmptyState from "@/components/common/empty-state";
import StatusBadge from "@/components/common/status-badge";
import PageHeader from "@/components/layout/page-header";
import PageShell from "@/components/layout/page-shell";
import SectionShell from "@/components/layout/section-shell";
import OwnerAvatar from "@/components/OwnerAvatar";
import TeamLogo from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EnrichedFixture, Leaderboards, OwnerSummary, UnderdogTracker } from "@/lib/types";

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function statusLabel(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return `Live ${fixture.minute ? fixture.minute : ""}`.trim();
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return "Upcoming";
}

function scoreLabel(fixture: EnrichedFixture) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "VS";
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function TeamMark({ team, code, logo, size = "md" }: { team: string; code?: string; logo?: string | null; size?: "sm" | "md" | "lg" }) {
  return (
    <TeamLogo
      team={team}
      code={code}
      logo={logo}
      className={cn(
        "border-2 border-foreground bg-background p-2",
        size === "sm" && "h-11 w-11",
        size === "md" && "h-14 w-14",
        size === "lg" && "h-18 w-18 md:h-20 md:w-20"
      )}
    />
  );
}

function OwnerLine({ owner }: { owner: string }) {
  return <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{owner || "Unassigned"}</span>;
}

function FeaturedMatch({ fixture }: { fixture: EnrichedFixture | null }) {
  if (!fixture) {
    return (
      <EmptyState
        title="No featured match"
        description="Live and upcoming fixtures will appear here as soon as match data is available."
      />
    );
  }

  return (
    <SectionShell
      marker="Live Match"
      title="Featured Fixture"
      actions={<StatusBadge tone={fixture.status === "live" ? "destructive" : "accent"}>{statusLabel(fixture)}</StatusBadge>}
      contentClassName="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center"
    >
      <div className="flex items-center gap-4 border-2 border-foreground bg-secondary px-4 py-4">
        <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} size="lg" />
        <div className="grid gap-1">
          <h3 className="text-3xl font-black md:text-4xl">{fixture.homeTeam}</h3>
          <OwnerLine owner={fixture.homeOwner} />
        </div>
      </div>

      <div className="grid min-w-[164px] place-items-center gap-1 border-2 border-foreground bg-accent px-5 py-5 text-center">
        <strong className="font-display text-4xl font-black md:text-5xl">{scoreLabel(fixture)}</strong>
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-foreground/75">{fixture.stage}</span>
      </div>

      <div className="flex items-center gap-4 border-2 border-foreground bg-secondary px-4 py-4 lg:flex-row-reverse lg:text-right">
        <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} size="lg" />
        <div className="grid gap-1">
          <h3 className="text-3xl font-black md:text-4xl">{fixture.awayTeam}</h3>
          <OwnerLine owner={fixture.awayOwner} />
        </div>
      </div>
    </SectionShell>
  );
}

function MiniMatch({ fixture }: { fixture: EnrichedFixture }) {
  return (
    <article className="brutal-surface grid gap-3 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{fixture.readableKickoff}</span>
        <StatusBadge tone={fixture.status === "live" ? "destructive" : "muted"}>{statusLabel(fixture)}</StatusBadge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} size="sm" />
          <OwnerLine owner={fixture.homeOwner} />
        </div>
        <span className="font-display text-2xl font-black">{scoreLabel(fixture)}</span>
      </div>
      <div className="flex items-center gap-3">
        <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} size="sm" />
        <OwnerLine owner={fixture.awayOwner} />
      </div>
    </article>
  );
}

function LeaderboardPanel({ owners }: { owners: OwnerSummary[] }) {
  const rows = owners.slice(0, 7);

  return (
    <SectionShell
      marker="Standings"
      title="Quick Leaderboard"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/leaderboards">Full Table</Link>
        </Button>
      }
    >
      {rows.length ? (
        <div className="grid gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b-2 border-foreground pb-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span />
            <span>Played</span>
            <span>Points</span>
          </div>
          {rows.map((owner, index) => (
            <div
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-2 border-foreground px-3 py-3",
                index === 0 ? "bg-accent" : "bg-background"
              )}
              key={owner.owner}
            >
              <div className="flex min-w-0 items-center gap-3">
                <OwnerAvatar owner={owner.owner} className="h-11 w-11 border-2 border-foreground" />
                <strong className="truncate text-sm">{owner.owner}</strong>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <strong className="font-display text-2xl font-black">{owner.wins + owner.draws + owner.losses}</strong>
                <strong className="font-display text-2xl font-black">{owner.points}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No standings yet" description="Owner rankings will populate once leaderboard data is available." />
      )}
    </SectionShell>
  );
}

function UnderdogPanel({ tracker }: { tracker: UnderdogTracker }) {
  const leader = tracker.leader ?? tracker.standings[0];

  return (
    <SectionShell marker="Prize Watch" title="Underdog" actions={<StatusBadge tone="accent">Yellow Jersey</StatusBadge>}>
      {leader ? (
        <div className="flex items-center gap-4 border-2 border-foreground bg-background px-4 py-4">
          <TeamMark team={leader.team} code={leader.code} logo={leader.logo} size="sm" />
          <div className="grid min-w-0 gap-1">
            <strong className="truncate font-display text-2xl font-black">{leader.team}</strong>
            <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{leader.owner}</span>
          </div>
          <StatusBadge tone="muted" className="ml-auto">
            Pot {leader.pot}
          </StatusBadge>
        </div>
      ) : (
        <EmptyState title="No underdog leader" description="The lowest-pot breakout will appear here once the standings settle." />
      )}
    </SectionShell>
  );
}

function BattleCard({ fixture, tone }: { fixture: EnrichedFixture; tone: "accent" | "destructive" | "blue" }) {
  return (
    <article className="brutal-surface grid gap-4 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge tone={tone}>{fixture.isSelfMatch ? "Friendly Fire" : "Rivalry Match"}</StatusBadge>
        <strong className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{fixture.readableKickoff}</strong>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <div className="flex items-center gap-3">
          <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} />
          <div className="grid gap-1">
            <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{fixture.homeTeam}</span>
            <strong>{fixture.homeOwner}</strong>
          </div>
        </div>
        <span className="justify-self-center font-display text-2xl font-black">VS</span>
        <div className="flex items-center gap-3 sm:flex-row-reverse sm:text-right">
          <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} />
          <div className="grid gap-1">
            <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{fixture.awayTeam}</span>
            <strong>{fixture.awayOwner}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}

const emptyUnderdog: UnderdogTracker = {
  leader: null,
  isSplit: false,
  splitWith: [],
  standings: [],
  rules: []
};

const emptyLeaderboards: Leaderboards = {
  overall: [],
  underdog: emptyUnderdog,
  mostGoalsScored: [],
  mostGoalsConceded: [],
  mostRedCards: [],
  worstPerformingTeam: [],
  firstEliminatedTeam: null,
  wallOfShame: [],
  teamsStillAliveByOwner: []
};

export default async function HomePage() {
  const [today, live, owners, leaderboards, underdog, fixtures] = await Promise.all([
    safe(getTodayFixtures(), [] as EnrichedFixture[]),
    safe(getLiveFixtures(), [] as EnrichedFixture[]),
    safe(getOwners(), [] as OwnerSummary[]),
    safe(getLeaderboards(), emptyLeaderboards),
    safe(getUnderdog(), emptyUnderdog),
    safe(getFixtures(), [] as EnrichedFixture[])
  ]);

  const featured = live[0] ?? today.find((fixture) => fixture.status === "live") ?? null;
  const todayMatches = today.filter((fixture) => fixture.id !== featured?.id).slice(0, 2);
  const fallbackMatches = fixtures.filter((fixture) => fixture.status !== "finished").slice(0, 2);
  const visibleMatches = todayMatches.length ? todayMatches : fallbackMatches;
  const standings = leaderboards.overall.length ? leaderboards.overall : owners;
  const battles = fixtures
    .filter((fixture) => fixture.status === "scheduled" && fixture.isOwnerVsOwner)
    .slice(0, 3);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Silverton Sweepstake"
        title="Dashboard"
        description="Track the chaos, current fixtures, owner standings, and the looming punishment table without losing the live state of the draw."
        actions={
          <>
            <Button asChild variant="accent">
              <Link href="/fixtures">View Fixtures</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leaderboards">Open Leaderboard</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-5">
          <FeaturedMatch fixture={featured} />

          <div className="grid gap-4 md:grid-cols-2">
            {visibleMatches.length ? (
              visibleMatches.map((fixture) => <MiniMatch key={fixture.id} fixture={fixture} />)
            ) : (
              <EmptyState title="No fixtures available" description="Upcoming or live fixtures will show here when match data is available." />
            )}
          </div>
        </section>

        <aside className="grid gap-5">
          <LeaderboardPanel owners={standings} />
          <UnderdogPanel tracker={underdog} />
        </aside>
      </div>

      <SectionShell marker="Owner Battles" title="Next Up">
        {battles.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {battles.map((fixture, index) => (
              <BattleCard
                key={fixture.id}
                fixture={fixture}
                tone={index === 0 ? "accent" : index === 1 ? "blue" : "destructive"}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No owner battles scheduled" description="Head-to-head owner clashes will appear here when upcoming fixtures are available." />
        )}
      </SectionShell>
    </PageShell>
  );
}

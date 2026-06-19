import Link from "next/link";
import { CalendarDays, Trophy } from "lucide-react";
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
        "border-2 border-foreground bg-background p-1.5",
        size === "sm" && "h-9 w-9",
        size === "md" && "h-11 w-11",
        size === "lg" && "h-[3.25rem] w-[3.25rem] md:h-[3.75rem] md:w-[3.75rem]"
      )}
    />
  );
}

function OwnerLine({ owner }: { owner: string }) {
  return <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{owner || "Unassigned"}</span>;
}

type FixtureEvent = NonNullable<EnrichedFixture["events"]>[number] & {
  beneficiaryTeam?: string;
  beneficiaryTeamCode?: string;
};

type ScorerLine = {
  player: string;
  minutes: string[];
};

function formatEventMinute(minute: number) {
  return `${minute}'`;
}

function buildScorerLines(fixture: EnrichedFixture, side: "home" | "away"): ScorerLine[] {
  const teamName = side === "home" ? fixture.homeTeam : fixture.awayTeam;
  const scorerMap = new Map<string, ScorerLine>();

  for (const rawEvent of fixture.events ?? []) {
    const event = rawEvent as FixtureEvent;
    const isGoal = event.type === "goal";
    const isOwnGoal = event.type === "own_goal";
    if (!isGoal && !isOwnGoal) {
      continue;
    }

    const creditedTeam = isOwnGoal ? event.beneficiaryTeam : event.team;
    if (creditedTeam !== teamName) {
      continue;
    }

    const playerName = event.player?.trim() || (isOwnGoal ? "Own goal" : "Unknown scorer");
    const label = isOwnGoal ? `${playerName} (OG)` : playerName;
    const line = scorerMap.get(label) ?? { player: label, minutes: [] };
    line.minutes.push(formatEventMinute(event.minute));
    scorerMap.set(label, line);
  }

  return Array.from(scorerMap.values());
}

function MatchBallIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-current">
      <path d="M6.563 0h.875l.105.022a6.682 6.682 0 0 1 3.028.96 6.909 6.909 0 0 1 3.322 4.811c.048.254.072.512.107.769v.875l-.023.106a6.745 6.745 0 0 1-1.142 3.317 6.9 6.9 0 0 1-4.616 3.031c-.258.048-.521.073-.782.109h-.875l-.091-.022a6.747 6.747 0 0 1-3.319-1.135A6.9 6.9 0 0 1 .109 9.201L0 8.419v-.875c.02-.166.037-.333.061-.5A7.013 7.013 0 0 1 5.808 1.086c.25-.043.503-.07.755-.105Zm3.793 10.094v.024h.751a.237.237 0 0 0 .165-.081 5.19 5.19 0 0 0 .979-2.961.2.2 0 0 0-.1-.188c-.382-.264-.761-.533-1.141-.8a.5.5 0 0 1-.23-.7c.152-.443.307-.885.453-1.33a.229.229 0 0 0-.027-.181A5.227 5.227 0 0 0 8.691 2.03a.187.187 0 0 0-.2.031c-.376.287-.756.571-1.135.855a.5.5 0 0 1-.716 0c-.375-.281-.752-.561-1.124-.846a.2.2 0 0 0-.209-.038A5.222 5.222 0 0 0 2.792 3.88a.229.229 0 0 0-.027.181c.146.445.3.887.453 1.33a.506.506 0 0 1-.231.7c-.376.264-.751.531-1.13.792a.218.218 0 0 0-.111.21 5.262 5.262 0 0 0 .967 2.939.2.2 0 0 0 .192.093c.464-.011.929-.017 1.394-.025a.509.509 0 0 1 .589.429c.137.448.277.895.411 1.344a.185.185 0 0 0 .141.142 5.2 5.2 0 0 0 3.106.006.205.205 0 0 0 .156-.161c.133-.449.272-.9.411-1.344a.5.5 0 0 1 .572-.416c.225.001.448-.005.671-.005Z" />
      <path d="M8.005 8.178c-.269 0-.538-.006-.806 0a.493.493 0 0 1-.513-.347l-.6-1.481c-.079-.2-.161-.4-.231-.6a.454.454 0 0 1 .176-.589q.832-.633 1.671-1.254a.446.446 0 0 1 .592 0q.846.625 1.683 1.262a.443.443 0 0 1 .168.579c-.277.712-.562 1.421-.849 2.128a.46.46 0 0 1-.474.3c-.274-.002-.547.002-.817.002Z" />
    </svg>
  );
}

function FeaturedScorers({ fixture }: { fixture: EnrichedFixture }) {
  const homeScorers = buildScorerLines(fixture, "home");
  const awayScorers = buildScorerLines(fixture, "away");
  const hasScorers = homeScorers.length || awayScorers.length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 px-3 py-3 md:gap-3 md:px-4">
      <div className="grid gap-1.5">
        {homeScorers.length ? (
          homeScorers.map((scorer) => (
            <p key={`${fixture.id}-home-${scorer.player}`} className="text-xs font-bold text-foreground md:text-sm">
              <span>{scorer.player}</span>
              <span className="ml-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground md:text-[0.68rem]">
                {scorer.minutes.join(", ")}
              </span>
            </p>
          ))
        ) : (
          <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {hasScorers ? "No goals yet" : "Waiting for the first breakthrough"}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        <MatchBallIcon />
      </div>

      <div className="grid gap-1.5 text-right">
        {awayScorers.length ? (
          awayScorers.map((scorer) => (
            <p key={`${fixture.id}-away-${scorer.player}`} className="text-xs font-bold text-foreground md:text-sm">
              <span>{scorer.player}</span>
              <span className="ml-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground md:text-[0.68rem]">
                {scorer.minutes.join(", ")}
              </span>
            </p>
          ))
        ) : hasScorers ? (
          <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">No goals yet</p>
        ) : (
          <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Waiting for the first breakthrough</p>
        )}
      </div>
    </div>
  );
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
      contentClassName="p-0"
    >
      <div className="grid divide-y-2 divide-foreground">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-3 md:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} size="lg" />
            <div className="grid min-w-0 gap-0.5">
              <h3 className="truncate text-sm font-black md:text-lg">{fixture.homeTeam}</h3>
              <OwnerLine owner={fixture.homeOwner} />
            </div>
          </div>

          <div className="grid min-w-[92px] place-items-center gap-0.5 bg-accent px-2 py-2 text-center">
            <strong className="font-display text-xl font-black md:text-3xl">{scoreLabel(fixture)}</strong>
            <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-foreground/75">{fixture.stage}</span>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
            <div className="grid min-w-0 gap-0.5">
              <h3 className="truncate text-sm font-black md:text-lg">{fixture.awayTeam}</h3>
              <OwnerLine owner={fixture.awayOwner} />
            </div>
            <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} size="lg" />
          </div>
        </div>
        <FeaturedScorers fixture={fixture} />
      </div>
    </SectionShell>
  );
}

function MiniMatch({ fixture }: { fixture: EnrichedFixture }) {
  return (
    <article className="brutal-surface grid gap-2 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{fixture.readableKickoff}</span>
        <StatusBadge tone={fixture.status === "live" ? "destructive" : "muted"}>{statusLabel(fixture)}</StatusBadge>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} size="sm" />
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-xs">{fixture.homeTeam}</strong>
            <OwnerLine owner={fixture.homeOwner} />
          </div>
        </div>
        <span className="font-display text-lg font-black">{scoreLabel(fixture)}</span>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-xs">{fixture.awayTeam}</strong>
            <OwnerLine owner={fixture.awayOwner} />
          </div>
          <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} size="sm" />
        </div>
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
          <Link href="/leaderboards">
            <Trophy />
            Full Table
          </Link>
        </Button>
      }
    >
      {rows.length ? (
        <div className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-b-2 border-foreground bg-secondary px-3 py-2 font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span>Owner</span>
            <span>PL</span>
            <span>PTS</span>
          </div>
          {rows.map((owner, index) => (
            <div
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-foreground/20 px-3 py-2.5 text-xs",
                index === 0 ? "bg-accent/55" : "bg-background"
              )}
              key={owner.owner}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{index + 1}</span>
                <OwnerAvatar owner={owner.owner} className="h-8 w-8 border-2 border-foreground" />
                <strong className="truncate">{owner.owner}</strong>
              </div>
              <strong className="text-right font-display text-base font-black">{owner.wins + owner.draws + owner.losses}</strong>
              <strong className="text-right font-display text-base font-black">{owner.points}</strong>
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
        <div className="flex items-center gap-2.5 px-3 py-3">
          <TeamMark team={leader.team} code={leader.code} logo={leader.logo} size="sm" />
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate font-display text-lg font-black">{leader.team}</strong>
            <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{leader.owner}</span>
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
    <article className="brutal-surface grid gap-2 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge tone={tone}>{fixture.isSelfMatch ? "Friendly Fire" : "Rivalry Match"}</StatusBadge>
        <strong className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{fixture.readableKickoff}</strong>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMark team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} />
          <div className="grid min-w-0 gap-0.5">
            <span className="truncate font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{fixture.homeTeam}</span>
            <strong className="truncate text-xs">{fixture.homeOwner}</strong>
          </div>
        </div>
        <span className="justify-self-center font-display text-base font-black">VS</span>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <div className="grid min-w-0 gap-0.5">
            <span className="truncate font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{fixture.awayTeam}</span>
            <strong className="truncate text-xs">{fixture.awayOwner}</strong>
          </div>
          <TeamMark team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} />
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid gap-4">
          <FeaturedMatch fixture={featured} />

          <div className="grid gap-3">
            {visibleMatches.length ? (
              visibleMatches.map((fixture) => <MiniMatch key={fixture.id} fixture={fixture} />)
            ) : (
              <EmptyState title="No fixtures available" description="Upcoming or live fixtures will show here when match data is available." />
            )}
          </div>
        </section>

        <aside className="grid gap-4">
          <LeaderboardPanel owners={standings} />
          <UnderdogPanel tracker={underdog} />
        </aside>
      </div>

        {battles.length ? (
          <div className="grid gap-3">
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
    </PageShell>
  );
}

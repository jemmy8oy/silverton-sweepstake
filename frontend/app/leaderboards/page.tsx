import PageHeader from "@/components/layout/page-header";
import PageShell from "@/components/layout/page-shell";
import SectionShell from "@/components/layout/section-shell";
import EmptyState from "@/components/common/empty-state";
import StatusBadge from "@/components/common/status-badge";
import OwnerAvatar from "@/components/OwnerAvatar";
import TeamLogo from "@/components/TeamLogo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getLeaderboards, getUnderdog } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Leaderboards, OwnerSummary, TeamStats, UnderdogTracker } from "@/lib/types";

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function ratio(part: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function emptyUnderdog(): UnderdogTracker {
  return {
    leader: null,
    isSplit: false,
    splitWith: [],
    standings: [],
    rules: []
  };
}

const emptyLeaderboards: Leaderboards = {
  overall: [],
  underdog: emptyUnderdog(),
  mostGoalsScored: [],
  mostGoalsConceded: [],
  mostRedCards: [],
  worstPerformingTeam: [],
  firstEliminatedTeam: null,
  wallOfShame: [],
  teamsStillAliveByOwner: []
};

function TeamBubble({ team, code, logo }: { team: string; code?: string; logo?: string | null }) {
  return <TeamLogo team={team} code={code} logo={logo} className="h-7 w-7 border-2 border-foreground bg-background p-1 md:h-8 md:w-8" />;
}

function nextTeam(owner: OwnerSummary) {
  const fixture = owner.upcomingMatches[0];
  if (!fixture) {
    return null;
  }

  const ownsHome = fixture.homeOwner === owner.owner && fixture.awayOwner !== owner.owner;
  if (ownsHome) {
    return {
      team: fixture.homeTeam,
      code: fixture.homeTeamCode ?? fixture.homeCode,
      logo: fixture.homeTeamLogo ?? fixture.homeLogo
    };
  }

  if (fixture.awayOwner === owner.owner) {
    return {
      team: fixture.awayTeam,
      code: fixture.awayTeamCode ?? fixture.awayCode,
      logo: fixture.awayTeamLogo ?? fixture.awayLogo
    };
  }

  return {
    team: fixture.homeTeam,
    code: fixture.homeTeamCode ?? fixture.homeCode,
    logo: fixture.homeTeamLogo ?? fixture.homeLogo
  };
}

function OverallRow({ owner, rank }: { owner: OwnerSummary; rank: number }) {
  const next = nextTeam(owner);
  const played = owner.wins + owner.draws + owner.losses;
  const goalDifference = owner.goalsFor - owner.goalsAgainst;

  return (
    <TableRow className={rank === 1 ? "bg-accent/50" : ""}>
      <TableCell className="min-w-[100px] px-1 py-2 md:min-w-[180px] md:px-3 md:py-3">
        <div className="flex items-center gap-1.5 md:gap-3">
          <OwnerAvatar owner={owner.owner} className="h-7 w-7 border-2 border-foreground md:h-11 md:w-11" />
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-[0.7rem] md:text-sm">{owner.owner}</strong>
            <span className="font-mono text-[0.54rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">#{rank}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-1 py-2 text-center text-[0.66rem] md:px-3 md:py-3 md:text-sm">{played}</TableCell>
      <TableCell className="px-1 py-2 text-center text-[0.66rem] md:px-3 md:py-3 md:text-sm">{owner.wins}</TableCell>
      <TableCell className="px-1 py-2 text-center text-[0.66rem] md:px-3 md:py-3 md:text-sm">{owner.draws}</TableCell>
      <TableCell className="px-1 py-2 text-center text-[0.66rem] md:px-3 md:py-3 md:text-sm">{owner.losses}</TableCell>
      <TableCell className="hidden px-1.5 py-2 text-center text-[0.68rem] md:table-cell md:px-3 md:py-3 md:text-sm">{owner.goalsFor}/{owner.goalsAgainst}</TableCell>
      <TableCell className="px-1 py-2 text-center text-[0.66rem] md:px-3 md:py-3 md:text-sm">{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</TableCell>
      <TableCell className="px-1 py-2 text-center text-[0.66rem] md:px-3 md:py-3 md:text-sm">{owner.yellowCards}/{owner.redCards}</TableCell>
      <TableCell className="px-1 py-2 text-center font-display text-[0.95rem] font-black md:px-3 md:py-3 md:text-2xl">{owner.points}</TableCell>
      <TableCell className="px-1 py-2 md:px-3 md:py-3">{next ? <TeamBubble team={next.team} code={next.code} logo={next.logo} /> : <span className="text-[0.66rem] text-muted-foreground">-</span>}</TableCell>
    </TableRow>
  );
}

function UnderdogRow({ team }: { team: TeamStats }) {
  return (
    <div className="flex items-center gap-2 border-b border-foreground/20 px-3 py-2.5 text-xs last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <TeamBubble team={team.team} code={team.code} logo={team.logo} />
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate">{team.team}</strong>
          <span className="truncate text-[0.72rem] text-muted-foreground">{team.owner}</span>
        </div>
      </div>
      <span className="ml-auto text-[0.72rem] text-muted-foreground">{team.furthestStage}</span>
      <StatusBadge tone="muted">P{team.pot}</StatusBadge>
    </div>
  );
}

function WallOfShame({ rows = [] }: { rows?: Leaderboards["wallOfShame"] }) {
  return (
    <SectionShell marker="Punishment" title="Wall of Shame">
      {rows.length ? (
        <div className="overflow-hidden bg-red-100/70">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 border-b-2 border-foreground px-3 py-2 font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span>#</span>
            <span>Owner</span>
            <span>RC/OG</span>
            <span>Shots</span>
          </div>
          {rows.map((row, index) => (
            <article key={row.owner} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-foreground/20 px-3 py-2.5 text-xs last:border-b-0">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-2">
                <OwnerAvatar owner={row.owner} className="h-8 w-8 border-2 border-foreground" />
                <strong className="truncate">{row.owner}</strong>
              </div>
              <span className="text-right text-[0.72rem] text-muted-foreground">{row.redCards}/{row.ownGoals}</span>
              <StatusBadge tone="destructive">{row.totalShots}</StatusBadge>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No shot debt yet" description="Red cards and own goals will populate this table when they occur." />
      )}
    </SectionShell>
  );
}

function SquadStrength({ rows }: { rows: Leaderboards["teamsStillAliveByOwner"] }) {
  return (
    <SectionShell marker="Survival" title="Squad Strength">
      {rows.length ? (
        <div className="grid gap-2">
          {rows.map((row) => {
            const width = ratio(row.teamsStillAlive, row.teamCount);
            return (
              <div key={row.owner} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate">{row.owner}</span>
                  <span className="text-muted-foreground">{row.teamsStillAlive}/{row.teamCount}</span>
                </div>
                <div className="h-2.5 border-2 border-foreground bg-background">
                  <span className={cn("block h-full bg-accent", width < 25 && "bg-destructive")} style={{ width: `${Math.max(width, row.teamsStillAlive ? 8 : 4)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No squad data yet" description="Survival totals by owner will appear here once the draw data is available." />
      )}
    </SectionShell>
  );
}

function PunishmentCard({
  label,
  team,
  detail,
  tone
}: {
  label: string;
  team: TeamStats | null;
  detail: string;
  tone: "accent" | "destructive" | "blue" | "muted";
}) {
  return (
    <article className="grid gap-2 px-3 py-3 text-xs">
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <strong className="truncate font-display text-lg font-black">{team?.team ?? "No data"}</strong>
      <span className="truncate text-[0.72rem] text-muted-foreground">{team?.owner ?? "Pending"}</span>
      <em className="text-[0.72rem] not-italic">{team ? detail : "Pending"}</em>
    </article>
  );
}

export default async function LeaderboardsPage() {
  const [leaderboards, underdog] = await Promise.all([
    safe(getLeaderboards(), emptyLeaderboards),
    safe(getUnderdog(), emptyUnderdog())
  ]);

  const overall = leaderboards.overall;
  const underdogs = underdog.standings.length ? underdog.standings.slice(0, 4) : leaderboards.underdog.standings.slice(0, 4);
  const mostCards = leaderboards.mostRedCards[0] ?? null;
  const mostConceded = leaderboards.mostGoalsConceded[0] ?? null;
  const worstTeam = leaderboards.worstPerformingTeam[0] ?? null;
  const firstEliminatedTeam = leaderboards.firstEliminatedTeam ?? null;

  return (
    <PageShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
            {overall.length ? (
              <Table className="text-xs md:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-10 px-1 text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">Owner</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">PL</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">W</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">D</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">L</TableHead>
                    <TableHead className="hidden h-10 px-1.5 text-center text-[0.56rem] md:table-cell md:h-12 md:px-3 md:text-[0.68rem]">+/-</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">GD</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">Y/R</TableHead>
                    <TableHead className="h-10 px-1 text-center text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">PTS</TableHead>
                    <TableHead className="h-10 px-1 text-[0.54rem] md:h-12 md:px-3 md:text-[0.68rem]">Next</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overall.map((owner, index) => <OverallRow key={owner.owner} owner={owner} rank={index + 1} />)}
                </TableBody>
              </Table>
            ) : (
              <div className="px-5 py-5">
                <EmptyState title="No leaderboard data yet" description="Owner rankings will appear once the API returns standings." />
              </div>
            )}

          <SectionShell marker="Punishments" title="Tracker">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <PunishmentCard
                label="Most Goals Conceded"
                team={mostConceded}
                detail={`${mostConceded?.goalsAgainst ?? 0} conceded`}
                tone="accent"
              />
              <PunishmentCard
                label="Most Red Cards"
                team={mostCards}
                detail={`${mostCards?.redCards ?? 0} red cards`}
                tone="destructive"
              />
              <PunishmentCard
                label="Worst Team Overall"
                team={worstTeam}
                detail={`${worstTeam?.points ?? 0} pts, ${worstTeam?.goalDifference ?? 0} GD`}
                tone="muted"
              />
              <PunishmentCard
                label="First Team Eliminated"
                team={firstEliminatedTeam}
                detail={firstEliminatedTeam ? firstEliminatedTeam.furthestStage : "Pending"}
                tone="blue"
              />
            </div>
          </SectionShell>
        </div>

        <aside className="grid gap-4">
          <WallOfShame rows={leaderboards.wallOfShame ?? []} />
          <SectionShell marker="Watchlist" title="Underdogs">
            {underdogs.length ? (
              <div className="overflow-hidden">
                {underdogs.map((team) => <UnderdogRow key={`${team.owner}-${team.team}`} team={team} />)}
              </div>
            ) : (
              <EmptyState title="No underdog data yet" description="The underdog race will appear here once the API returns standings." />
            )}
          </SectionShell>
          <SquadStrength rows={leaderboards.teamsStillAliveByOwner} />
        </aside>
      </div>
    </PageShell>
  );
}

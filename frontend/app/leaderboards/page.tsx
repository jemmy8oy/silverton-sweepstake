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
  return <TeamLogo team={team} code={code} logo={logo} className="h-10 w-10 border-2 border-foreground bg-background p-2" />;
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
      <TableCell className="min-w-[180px]">
        <div className="flex items-center gap-3">
          <OwnerAvatar owner={owner.owner} className="h-11 w-11 border-2 border-foreground" />
          <div className="grid gap-0.5">
            <strong>{owner.owner}</strong>
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">#{rank}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">{played}</TableCell>
      <TableCell className="text-center">{owner.wins}</TableCell>
      <TableCell className="text-center">{owner.draws}</TableCell>
      <TableCell className="text-center">{owner.losses}</TableCell>
      <TableCell className="text-center">{owner.goalsFor}/{owner.goalsAgainst}</TableCell>
      <TableCell className="text-center">{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</TableCell>
      <TableCell className="text-center">{owner.yellowCards}</TableCell>
      <TableCell className="text-center">{owner.redCards}</TableCell>
      <TableCell className="text-center font-display text-2xl font-black">{owner.points}</TableCell>
      <TableCell>{next ? <TeamBubble team={next.team} code={next.code} logo={next.logo} /> : <span className="text-sm text-muted-foreground">-</span>}</TableCell>
    </TableRow>
  );
}

function MobileOverallRow({ owner, rank }: { owner: OwnerSummary; rank: number }) {
  const next = nextTeam(owner);
  const played = owner.wins + owner.draws + owner.losses;
  const goalDifference = owner.goalsFor - owner.goalsAgainst;

  return (
    <article className={cn("grid gap-3 border-2 border-foreground px-4 py-4", rank === 1 ? "bg-accent/50" : "bg-background")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <OwnerAvatar owner={owner.owner} className="h-10 w-10 border-2 border-foreground" />
          <div className="grid gap-0.5">
            <strong>{owner.owner}</strong>
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">#{rank}</span>
          </div>
        </div>
        <span className="font-display text-3xl font-black">{owner.points}</span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div><span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">PL</span><div>{played}</div></div>
        <div><span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">WDL</span><div>{owner.wins}-{owner.draws}-{owner.losses}</div></div>
        <div><span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Goals</span><div>{owner.goalsFor}/{owner.goalsAgainst}</div></div>
        <div><span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">GD</span><div>{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</div></div>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge tone="muted">Y/R {owner.yellowCards}/{owner.redCards}</StatusBadge>
        {next ? <TeamBubble team={next.team} code={next.code} logo={next.logo} /> : <span className="text-xs text-muted-foreground">No next team</span>}
      </div>
    </article>
  );
}

function UnderdogRow({ team }: { team: TeamStats }) {
  return (
    <div className="grid gap-3 border-2 border-foreground bg-background px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TeamBubble team={team.team} code={team.code} logo={team.logo} />
          <div className="grid gap-0.5">
            <strong>{team.team}</strong>
            <span className="text-sm text-muted-foreground">{team.owner}</span>
          </div>
        </div>
        <StatusBadge tone="muted">Pot {team.pot}</StatusBadge>
      </div>
      <div className="text-sm text-muted-foreground">{team.furthestStage}</div>
    </div>
  );
}

function WallOfShame({ rows = [] }: { rows?: Leaderboards["wallOfShame"] }) {
  return (
    <SectionShell marker="Punishment" title="Wall of Shame">
      {rows.length ? (
        <div className="grid gap-3">
          {rows.map((row, index) => (
            <article key={row.owner} className="flex items-center justify-between gap-4 border-2 border-foreground bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{index + 1}.</span>
                <OwnerAvatar owner={row.owner} className="h-10 w-10 border-2 border-foreground" />
                <div className="grid gap-0.5">
                  <strong>{row.owner}</strong>
                  <span className="text-sm text-muted-foreground">{row.redCards} red, {row.ownGoals} own goals</span>
                </div>
              </div>
              <StatusBadge tone="destructive">{row.totalShots} shots</StatusBadge>
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
        <div className="grid gap-4">
          {rows.map((row) => {
            const width = ratio(row.teamsStillAlive, row.teamCount);
            return (
              <div key={row.owner} className="grid gap-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span>{row.owner}</span>
                  <span className="text-muted-foreground">{row.teamsStillAlive}/{row.teamCount} alive</span>
                </div>
                <div className="h-4 border-2 border-foreground bg-background">
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
    <article className="grid gap-3 border-2 border-foreground bg-background px-4 py-4">
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <strong className="font-display text-3xl font-black">{team?.team ?? "No data"}</strong>
      <span className="text-sm text-muted-foreground">{team?.owner ?? "Pending"}</span>
      <em className="text-sm not-italic">{team ? detail : "Pending"}</em>
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
      <PageHeader
        eyebrow="Standings"
        title="Leaderboard"
        description="Scan the overall table, watch the underdogs, and keep track of who is drifting toward the punishment end of the sweepstake."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <SectionShell marker="Overall" title="Owner Table" contentClassName="p-0">
            {overall.length ? (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-center">PL</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">+/-</TableHead>
                        <TableHead className="text-center">GD</TableHead>
                        <TableHead className="text-center">YC</TableHead>
                        <TableHead className="text-center">RC</TableHead>
                        <TableHead className="text-center">PTS</TableHead>
                        <TableHead>Next</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overall.map((owner, index) => <OverallRow key={owner.owner} owner={owner} rank={index + 1} />)}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-3 px-5 py-5 md:hidden">
                  {overall.map((owner, index) => <MobileOverallRow key={owner.owner} owner={owner} rank={index + 1} />)}
                </div>
              </>
            ) : (
              <div className="px-5 py-5">
                <EmptyState title="No leaderboard data yet" description="Owner rankings will appear once the API returns standings." />
              </div>
            )}
          </SectionShell>

          <SectionShell marker="Punishments" title="Tracker">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <aside className="grid gap-6">
          <WallOfShame rows={leaderboards.wallOfShame ?? []} />
          <SectionShell marker="Watchlist" title="Underdogs">
            {underdogs.length ? (
              <div className="grid gap-3">
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

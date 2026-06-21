import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import EmptyState from "@/components/common/empty-state";
import StatusBadge from "@/components/common/status-badge";
import PageShell from "@/components/layout/page-shell";
import TeamLogo from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { getFixtureDetail, getFixtures } from "@/lib/api";
import { buildMatchSlug, extractMatchId } from "@/lib/match-slug";
import { cn } from "@/lib/utils";
import type { EnrichedFixture, FixtureDetail, MatchEvent, MatchLineupPlayer, TeamLineup } from "@/lib/types";

type MatchPageProps = {
  params: Promise<{ slug: string }>;
};

type ScorerLine = {
  player: string;
  minutes: string[];
};

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function scoreLabel(fixture: FixtureDetail["fixture"]) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "VS";
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function formatEventMinute(minute: number) {
  return `${minute}'`;
}

function buildScorerLines(fixture: FixtureDetail["fixture"], side: "home" | "away"): ScorerLine[] {
  const teamName = side === "home" ? fixture.homeTeam : fixture.awayTeam;
  const scorerMap = new Map<string, ScorerLine>();

  for (const event of fixture.events ?? []) {
    const isGoal = event.type === "goal";
    const isOwnGoal = event.type === "own_goal";
    if (!isGoal && !isOwnGoal) {
      continue;
    }

    const creditedTeam = isOwnGoal ? ("beneficiaryTeam" in event ? event.beneficiaryTeam : undefined) : event.team;
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

function statusLabel(status: FixtureDetail["fixture"]["status"], minute?: string | number) {
  if (status === "live") {
    return `Live${minute ? ` • ${minute}` : ""}`;
  }
  if (status === "finished") {
    return "Finished";
  }
  return "Upcoming";
}

function toneForStatus(status: FixtureDetail["fixture"]["status"]) {
  if (status === "live") {
    return "destructive" as const;
  }
  if (status === "finished") {
    return "accent" as const;
  }
  return "muted" as const;
}

function numericFormationPlace(player: MatchLineupPlayer) {
  const value = Number(player.formationPlace ?? 999);
  return Number.isFinite(value) ? value : 999;
}

function formationRows(lineup?: TeamLineup) {
  if (!lineup?.starters.length) {
    return [];
  }

  const starters = [...lineup.starters].sort((a, b) => numericFormationPlace(a) - numericFormationPlace(b));
  const keeper = starters.slice(0, 1);
  const outfield = starters.slice(1);
  const shape = (lineup.formation ?? "")
    .split("-")
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part) && part > 0);

  if (!shape.length) {
    return [keeper, outfield].filter((row) => row.length);
  }

  const rows: MatchLineupPlayer[][] = [keeper];
  let cursor = 0;

  for (const count of shape) {
    const slice = outfield.slice(cursor, cursor + count);
    if (slice.length) {
      rows.push(slice);
    }
    cursor += count;
  }

  if (cursor < outfield.length) {
    rows.push(outfield.slice(cursor));
  }

  return rows.filter((row) => row.length);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function playerAccent(player: MatchLineupPlayer) {
  if (player.subbedIn && !player.starter) {
    return "bg-accent text-black";
  }
  if (player.subbedOut) {
    return "bg-destructive text-white";
  }
  return "bg-secondary text-black";
}

function normaliseName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNameTokens(value: string) {
  return normaliseName(value).split(" ").filter(Boolean);
}

function eventBelongsToPlayer(player: MatchLineupPlayer, event: MatchEvent) {
  if (!event.player) {
    return false;
  }

  const eventName = normaliseName(event.player);
  const fullName = normaliseName(player.name);
  const shortName = normaliseName(player.shortName ?? "");
  if (eventName === fullName || (shortName && eventName === shortName)) {
    return true;
  }

  const playerTokens = [...buildNameTokens(player.name), ...buildNameTokens(player.shortName ?? "")];
  const eventTokens = buildNameTokens(event.player);
  if (!playerTokens.length || !eventTokens.length) {
    return false;
  }

  const playerLast = playerTokens[playerTokens.length - 1];
  const eventLast = eventTokens[eventTokens.length - 1];
  return Boolean(playerLast && eventLast && playerLast === eventLast);
}

function playerEvents(player: MatchLineupPlayer, lineup: TeamLineup | undefined, events: MatchEvent[] | undefined) {
  if (!lineup || !events?.length) {
    return [];
  }

  return events
    .filter((event) => event.team === lineup.team && eventBelongsToPlayer(player, event))
    .sort((a, b) => a.minute - b.minute);
}

function substitutionMinute(
  player: MatchLineupPlayer,
  lineup: TeamLineup | undefined,
  events: MatchEvent[] | undefined,
  type: "sub_on" | "sub_off"
) {
  return playerEvents(player, lineup, events).find((event) => event.type === type)?.minute ?? null;
}

function benchPositionLabel(player: MatchLineupPlayer) {
  const code = player.positionCode?.trim().toUpperCase();
  const label = player.position?.trim();

  if (!code || code === "SUB") {
    return null;
  }

  if (code === "G") {
    return "Keeper";
  }

  if (code === "RB" || code === "LB" || code.startsWith("CD") || code === "SW") {
    return "Defender";
  }
  if (code === "DM" || code === "CM" || code.startsWith("CM-") || code === "LM" || code === "RM" || code === "AM" || code.startsWith("AM-")) {
    return "Midfielder";
  }
  if (code === "F" || code === "LF" || code === "RF" || code.startsWith("CF") || code === "W" || code.endsWith("W")) {
    return "Attacker";
  }

  if (!label) {
    return null;
  }

  const normalised = label.trim().toLowerCase();
  if (normalised === "substitute" || normalised === "bench" || normalised === "squad role") {
    return null;
  }

  return label;
}

function eventTone(event: MatchEvent) {
    if (event.type === "red_card") {
    return "bg-destructive text-white";
  }
  if (event.type === "yellow_card") {
    return "bg-accent text-black";
  }
  if (event.type === "goal" || event.type === "own_goal") {
    return "bg-[color:#2f9e44] text-white";
  }
  if (event.type === "sub_on") {
    return "bg-accent text-black";
  }
  if (event.type === "sub_off") {
    return "bg-destructive text-white";
  }
  return "bg-primary text-primary-foreground";
}

function MatchBallGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-current">
      <path d="M6.563 0h.875l.105.022a6.682 6.682 0 0 1 3.028.96 6.909 6.909 0 0 1 3.322 4.811c.048.254.072.512.107.769v.875l-.023.106a6.745 6.745 0 0 1-1.142 3.317 6.9 6.9 0 0 1-4.616 3.031c-.258.048-.521.073-.782.109h-.875l-.091-.022a6.747 6.747 0 0 1-3.319-1.135A6.9 6.9 0 0 1 .109 9.201L0 8.419v-.875c.02-.166.037-.333.061-.5A7.013 7.013 0 0 1 5.808 1.086c.25-.043.503-.07.755-.105Zm3.793 10.094v.024h.751a.237.237 0 0 0 .165-.081 5.19 5.19 0 0 0 .979-2.961.2.2 0 0 0-.1-.188c-.382-.264-.761-.533-1.141-.8a.5.5 0 0 1-.23-.7c.152-.443.307-.885.453-1.33a.229.229 0 0 0-.027-.181A5.227 5.227 0 0 0 8.691 2.03a.187.187 0 0 0-.2.031c-.376.287-.756.571-1.135.855a.5.5 0 0 1-.716 0c-.375-.281-.752-.561-1.124-.846a.2.2 0 0 0-.209-.038A5.222 5.222 0 0 0 2.792 3.88a.229.229 0 0 0-.027.181c.146.445.3.887.453 1.33a.506.506 0 0 1-.231.7c-.376.264-.751.531-1.13.792a.218.218 0 0 0-.111.21 5.262 5.262 0 0 0 .967 2.939.2.2 0 0 0 .192.093c.464-.011.929-.017 1.394-.025a.509.509 0 0 1 .589.429c.137.448.277.895.411 1.344a.185.185 0 0 0 .141.142 5.2 5.2 0 0 0 3.106.006.205.205 0 0 0 .156-.161c.133-.449.272-.9.411-1.344a.5.5 0 0 1 .572-.416c.225.001.448-.005.671-.005Z" />
      <path d="M8.005 8.178c-.269 0-.538-.006-.806 0a.493.493 0 0 1-.513-.347l-.6-1.481c-.079-.2-.161-.4-.231-.6a.454.454 0 0 1 .176-.589q.832-.633 1.671-1.254a.446.446 0 0 1 .592 0q.846.625 1.683 1.262a.443.443 0 0 1 .168.579c-.277.712-.562 1.421-.849 2.128a.46.46 0 0 1-.474.3c-.274-.002-.547.002-.817.002Z" />
    </svg>
  );
}

function EventGlyph({ event }: { event: MatchEvent }) {
  if (event.type === "goal" || event.type === "own_goal") {
    return <MatchBallGlyph />;
  }
  if (event.type === "sub_on") {
    return <span aria-hidden="true">&rarr;</span>;
  }
  if (event.type === "sub_off") {
    return <span aria-hidden="true">&larr;</span>;
  }
  return <span className="block h-3.5 w-3.5" aria-hidden="true" />;
}

function PlayerEventOverlay({ event }: { event: MatchEvent }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[0.68rem] font-medium leading-4 text-foreground">{event.minute}&rsquo;</span>
      <div className={cn("flex min-h-5 min-w-7 items-center justify-center border border-foreground px-1.5 py-0.5 text-center text-[0.62rem] font-bold", eventTone(event))}>
        <EventGlyph event={event} />
      </div>
    </div>
  );
}

function PlayerMarker({
  player,
  lineup,
  events
}: {
  player: MatchLineupPlayer;
  lineup?: TeamLineup;
  events?: MatchEvent[];
}) {
  const highlights = playerEvents(player, lineup, events);

  return (
    <div className="pointer-events-auto grid justify-items-center gap-2 pt-6 text-center">
      <div className="relative">
        <div className="flex h-12 w-12 items-end justify-center overflow-hidden border-2 border-foreground bg-secondary">
          <div className="grid h-10 w-10 place-items-center bg-background text-[0.72rem] font-bold text-foreground">
            {initials(player.shortName ?? player.name)}
          </div>
        </div>
        {highlights.length ? (
          <div className="absolute bottom-8 right-7 flex flex-col items-center gap-1">
            {highlights.slice(0, 2).map((event, index) => (
              <PlayerEventOverlay key={`${player.id ?? player.name}-${event.type}-${event.minute}-${index}`} event={event} />
            ))}
          </div>
        ) : player.subbedIn || player.subbedOut ? (
          <div className={cn("absolute bottom-8 right-7 border border-foreground px-1.5 py-0.5 text-[0.62rem] font-bold", playerAccent(player))}>
            {player.subbedIn && !player.starter ? "ON" : player.subbedOut ? "OFF" : ""}
          </div>
        ) : null}
      </div>
      <span className="max-w-[7.5rem] break-words px-0.5 text-sm leading-4 text-foreground">
        <span className="mr-1 inline-block font-medium text-muted-foreground">{player.jersey ?? "--"}</span>
        {player.shortName ?? player.name}
      </span>
    </div>
  );
}

function TeamHeader({ lineup, reverse = false }: { lineup?: TeamLineup; reverse?: boolean }) {
  return (
    <div className={cn("flex items-center gap-6", reverse && "flex-row-reverse")}>
      <div className={cn("flex items-center gap-2.5", reverse && "flex-row-reverse")}>
        <TeamLogo
          team={lineup?.team ?? "Pending"}
          code={lineup?.teamCode}
          logo={lineup?.teamLogo}
          className="h-7 w-7 border border-foreground bg-background p-1"
        />
        <h2 className={cn("text-sm text-foreground", reverse && "text-right")}>{lineup?.team ?? "Lineup pending"}</h2>
      </div>
      <span className="text-sm font-medium leading-5 text-foreground">{lineup?.formation ?? "TBD"}</span>
    </div>
  );
}

function TopBand({ detail, homeLineup, awayLineup }: { detail: FixtureDetail; homeLineup?: TeamLineup; awayLineup?: TeamLineup }) {
  const homeScorers = buildScorerLines(detail.fixture, "home");
  const awayScorers = buildScorerLines(detail.fixture, "away");
  const hasScorers = homeScorers.length || awayScorers.length;

  return (
    <section className="brutal-surface overflow-hidden">
      <header className="grid h-auto gap-4 border-b-2 border-foreground px-4 py-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <TeamHeader lineup={homeLineup} />
        <div className="flex items-center justify-center gap-3 text-center">
          <StatusBadge tone={toneForStatus(detail.fixture.status)}>
            {statusLabel(detail.fixture.status, detail.fixture.minute)}
          </StatusBadge>
          <div className="grid gap-1">
            <strong className="font-display text-xl font-black text-foreground lg:text-2xl">{scoreLabel(detail.fixture)}</strong>
            <span className="text-xs text-muted-foreground">{detail.fixture.readableKickoff}</span>
          </div>
        </div>
        <TeamHeader lineup={awayLineup} reverse />
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 px-3 py-3 md:gap-3 md:px-4">
        <div className="grid gap-1.5">
          {homeScorers.length ? (
            homeScorers.map((scorer) => (
              <p key={`home-${scorer.player}`} className="text-xs font-bold text-foreground md:text-sm">
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
          <MatchBallGlyph />
        </div>

        <div className="grid gap-1.5 text-right">
          {awayScorers.length ? (
            awayScorers.map((scorer) => (
              <p key={`away-${scorer.player}`} className="text-xs font-bold text-foreground md:text-sm">
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
    </section>
  );
}

function PitchView({
  home,
  away,
  events
}: {
  home?: TeamLineup;
  away?: TeamLineup;
  events?: MatchEvent[];
}) {
  const homeRows = formationRows(home);
  const awayRows = formationRows(away);

  return (
    <section className="relative h-[550px] w-full overflow-hidden border-2 border-foreground bg-[linear-gradient(rgba(26,26,26,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,26,0.08)_1px,transparent_1px),linear-gradient(180deg,#ebe3d6_0%,#f5f0e8_100%)] bg-[length:24px_24px,24px_24px,100%_100%]">
      <div className="absolute -left-0.5 top-[36%] -translate-x-[22%] -rotate-90 text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="276" viewBox="0 0 316 174" className="h-40 fill-current">
          <g transform="translate(84.168)">
            <path d="M57 0h5.907v50.136a5.92 5.92 0 0 0 5.907 5.9H192.85a5.92 5.92 0 0 0 5.907-5.9V0h5.907v50.136a11.84 11.84 0 0 1-11.813 11.8H68.813A11.84 11.84 0 0 1 57 50.136z" transform="translate(-57)" />
          </g>
          <path d="M11.813 150.407h90.813a76.778 76.778 0 0 0 110.748 0h90.813A11.839 11.839 0 0 0 316 138.61V0h-5.906v138.61a5.92 5.92 0 0 1-5.907 5.9H11.813a5.92 5.92 0 0 1-5.907-5.9V0H0v138.61a11.84 11.84 0 0 0 11.813 11.797zm193 0a70.761 70.761 0 0 1-93.619 0z" />
        </svg>
      </div>

      <div className="absolute -right-0.5 top-[36%] translate-y-[-39%] rotate-90 text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="276" viewBox="0 0 316 174" className="h-40 fill-current">
          <g transform="translate(84.168)">
            <path d="M57 0h5.907v50.136a5.92 5.92 0 0 0 5.907 5.9H192.85a5.92 5.92 0 0 0 5.907-5.9V0h5.907v50.136a11.84 11.84 0 0 1-11.813 11.8H68.813A11.84 11.84 0 0 1 57 50.136z" transform="translate(-57)" />
          </g>
          <path d="M11.813 150.407h90.813a76.778 76.778 0 0 0 110.748 0h90.813A11.839 11.839 0 0 0 316 138.61V0h-5.906v138.61a5.92 5.92 0 0 1-5.907 5.9H11.813a5.92 5.92 0 0 1-5.907-5.9V0H0v138.61a11.84 11.84 0 0 0 11.813 11.797zm193 0a70.761 70.761 0 0 1-93.619 0z" />
        </svg>
      </div>

      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-foreground after:absolute after:left-1/2 after:top-1/2 after:h-36 after:w-36 after:-translate-x-1/2 after:-translate-y-1/2 after:border-2 after:border-foreground after:content-['']" />

      <div className="relative grid h-full grid-cols-2">
        <div className="relative h-full">
          {homeRows.length ? (
            homeRows.map((row, index) => {
              const total = homeRows.length;
              const top = total === 1 ? 50 : (index / (total - 1)) * 75;
              return (
                <div
                  key={`home-row-${index}`}
                  className="absolute left-0 flex h-1/4 w-full items-center justify-center"
                  style={{ top: `${top}%`, transform: "translateY(-50%)" }}
                >
                  <div className="grid w-full grid-flow-col auto-cols-fr gap-2 px-3">
                    {row.map((player) => (
                      <PlayerMarker key={`home-${player.id ?? player.name}-${index}`} player={player} lineup={home} events={events} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-muted-foreground">
              Home lineup has not been published yet.
            </div>
          )}
        </div>

        <div className="relative h-full">
          {awayRows.length ? (
            awayRows.map((row, index) => {
              const total = awayRows.length;
              const top = total === 1 ? 50 : 75 - (index / (total - 1)) * 75;
              return (
                <div
                  key={`away-row-${index}`}
                  className="absolute left-0 flex h-1/4 w-full items-center justify-center"
                  style={{ top: `${top}%`, transform: "translateY(-50%)" }}
                >
                  <div className="grid w-full grid-flow-col auto-cols-fr gap-2 px-3">
                    {row.map((player) => (
                      <PlayerMarker key={`away-${player.id ?? player.name}-${index}`} player={player} lineup={away} events={events} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-muted-foreground">
              Away lineup has not been published yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BenchList({
  lineup,
  side,
  events
}: {
  lineup?: TeamLineup;
  side: "home" | "away";
  events?: MatchEvent[];
}) {
  const title = lineup ? `${lineup.team} Bench` : `${side} bench`;
  const orderedBench = [...(lineup?.bench ?? [])].sort((left, right) => {
    const leftMinute = substitutionMinute(left, lineup, events, "sub_on");
    const rightMinute = substitutionMinute(right, lineup, events, "sub_on");

    if (leftMinute !== null && rightMinute !== null) {
      return leftMinute - rightMinute;
    }
    if (leftMinute !== null) {
      return -1;
    }
    if (rightMinute !== null) {
      return 1;
    }
    return left.name.localeCompare(right.name);
  });

  return (
    <section className="brutal-surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b-2 border-foreground px-4 py-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
        </div>
        <span className="border-2 border-foreground bg-secondary px-3 py-1 text-xs font-medium text-foreground">
          {lineup?.bench.length ?? 0} players
        </span>
      </header>

      {orderedBench.length ? (
        <div className="grid">
          {orderedBench.map((player) => {
            const onMinute = substitutionMinute(player, lineup, events, "sub_on");
            const positionLabel = benchPositionLabel(player);

            return (
              <div
                key={`${side}-${player.id ?? player.name}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b-2 border-foreground bg-background px-4 py-3 last:border-b-0"
              >
                <div className="grid h-10 w-10 place-items-center border-2 border-foreground bg-secondary text-xs font-bold text-black">
                  {initials(player.shortName ?? player.name)}
                </div>
                <div className="grid gap-1">
                  <strong className="truncate text-sm font-medium text-foreground">
                    <span className="mr-1 text-muted-foreground">{player.jersey ?? "--"}</span>
                    {player.name}
                  </strong>
                  {positionLabel ? <span className="text-xs text-muted-foreground">{positionLabel}</span> : null}
                </div>
                {onMinute !== null ? (
                  <div className="grid justify-items-end gap-1">
                    <span className="text-[0.68rem] font-medium leading-4 text-foreground">{onMinute}&rsquo;</span>
                    <span className={cn("flex min-h-5 min-w-7 items-center justify-center border border-foreground px-1.5 py-0.5 text-[0.68rem] font-medium", playerAccent(player))}>
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-6">
          <EmptyState
            title="Bench unavailable"
            description="ESPN has not published the substitutes list for this side yet."
          />
        </div>
      )}
    </section>
  );
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { slug } = await params;
  const fixtureId = extractMatchId(slug);
  if (!fixtureId) {
    notFound();
  }

  const detail = await safe<FixtureDetail | null>(getFixtureDetail(fixtureId), null);
  const fixtures = detail ? null : await safe<EnrichedFixture[]>(getFixtures(), []);
  const fallbackFixture = detail ? null : fixtures?.find((fixture) => String(fixture.id) === fixtureId) ?? null;
  const resolvedDetail: FixtureDetail | null = detail
    ? detail
    : fallbackFixture
      ? {
          fixture: fallbackFixture,
          lineups: {}
        }
      : null;

  if (!resolvedDetail) {
    notFound();
  }

  const canonicalSlug = buildMatchSlug(resolvedDetail.fixture);
  const homeLineup = resolvedDetail.lineups.home;
  const awayLineup = resolvedDetail.lineups.away;

  return (
    <PageShell className="max-w-[1440px] gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/match">
            <ArrowLeft className="h-4 w-4" />
            Back To Match Index
          </Link>
        </Button>
        {canonicalSlug !== slug ? (
          <Button asChild size="sm">
            <Link href={`/match/${canonicalSlug}`}>Open Canonical URL</Link>
          </Button>
        ) : null}
        <StatusBadge tone="blue">{resolvedDetail.fixture.stage}</StatusBadge>
      </div>

      <TopBand detail={resolvedDetail} homeLineup={homeLineup} awayLineup={awayLineup} />
      <PitchView home={homeLineup} away={awayLineup} events={resolvedDetail.fixture.events} />

      <div className="grid gap-4 xl:grid-cols-2">
        <BenchList lineup={homeLineup} side="home" events={resolvedDetail.fixture.events} />
        <BenchList lineup={awayLineup} side="away" events={resolvedDetail.fixture.events} />
      </div>
    </PageShell>
  );
}

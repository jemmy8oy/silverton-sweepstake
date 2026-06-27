import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
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

function MatchBallGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-current">
      <path d="M6.563 0h.875l.105.022a6.682 6.682 0 0 1 3.028.96 6.909 6.909 0 0 1 3.322 4.811c.048.254.072.512.107.769v.875l-.023.106a6.745 6.745 0 0 1-1.142 3.317 6.9 6.9 0 0 1-4.616 3.031c-.258.048-.521.073-.782.109h-.875l-.091-.022a6.747 6.747 0 0 1-3.319-1.135A6.9 6.9 0 0 1 .109 9.201L0 8.419v-.875c.02-.166.037-.333.061-.5A7.013 7.013 0 0 1 5.808 1.086c.25-.043.503-.07.755-.105Zm3.793 10.094v.024h.751a.237.237 0 0 0 .165-.081 5.19 5.19 0 0 0 .979-2.961.2.2 0 0 0-.1-.188c-.382-.264-.761-.533-1.141-.8a.5.5 0 0 1-.23-.7c.152-.443.307-.885.453-1.33a.229.229 0 0 0-.027-.181A5.227 5.227 0 0 0 8.691 2.03a.187.187 0 0 0-.2.031c-.376.287-.756.571-1.135.855a.5.5 0 0 1-.716 0c-.375-.281-.752-.561-1.124-.846a.2.2 0 0 0-.209-.038A5.222 5.222 0 0 0 2.792 3.88a.229.229 0 0 0-.027.181c.146.445.3.887.453 1.33a.506.506 0 0 1-.231.7c-.376.264-.751.531-1.13.792a.218.218 0 0 0-.111.21 5.262 5.262 0 0 0 .967 2.939.2.2 0 0 0 .192.093c.464-.011.929-.017 1.394-.025a.509.509 0 0 1 .589.429c.137.448.277.895.411 1.344a.185.185 0 0 0 .141.142 5.2 5.2 0 0 0 3.106.006.205.205 0 0 0 .156-.161c.133-.449.272-.9.411-1.344a.5.5 0 0 1 .572-.416c.225.001.448-.005.671-.005Z" />
      <path d="M8.005 8.178c-.269 0-.538-.006-.806 0a.493.493 0 0 1-.513-.347l-.6-1.481c-.079-.2-.161-.4-.231-.6a.454.454 0 0 1 .176-.589q.832-.633 1.671-1.254a.446.446 0 0 1 .592 0q.846.625 1.683 1.262a.443.443 0 0 1 .168.579c-.277.712-.562 1.421-.849 2.128a.46.46 0 0 1-.474.3c-.274-.002-.547.002-.817.002Z" />
    </svg>
  );
}

type PitchOrientation = "horizontal" | "vertical";
type LineupSide = "home" | "away";

type PlayerEventSummary = {
  subOn?: MatchEvent;
  subOff?: MatchEvent;
  goals: MatchEvent[];
  ownGoals: MatchEvent[];
  yellowCards: MatchEvent[];
  redCards: MatchEvent[];
  assists: MatchEvent[];
};

function playerEventSummary(player: MatchLineupPlayer, lineup: TeamLineup | undefined, events: MatchEvent[] | undefined): PlayerEventSummary {
  const matchedEvents = playerEvents(player, lineup, events);

  return {
    subOn: matchedEvents.find((event) => event.type === "sub_on"),
    subOff: matchedEvents.find((event) => event.type === "sub_off"),
    goals: matchedEvents.filter((event) => event.type === "goal"),
    ownGoals: matchedEvents.filter((event) => event.type === "own_goal"),
    yellowCards: matchedEvents.filter((event) => event.type === "yellow_card"),
    redCards: matchedEvents.filter((event) => event.type === "red_card"),
    assists: matchedEvents.filter((event) => event.type === "assist" || event.type === "goal_assist")
  };
}

function formatMinute(minute?: number | null) {
  return typeof minute === "number" ? `${minute}\u2019` : null;
}

function compactCount(count: number) {
  return count > 1 ? `x${count}` : null;
}

function formationLane(rowLength: number, playerIndex: number) {
  if (rowLength <= 1) {
    return 50;
  }
  if (rowLength === 2) {
    return playerIndex === 0 ? 25 : 75;
  }

  return 13 + (playerIndex / (rowLength - 1)) * 74;
}

function lineupPosition({
  rowIndex,
  rowLength,
  playerIndex,
  totalRows,
  side,
  orientation
}: {
  rowIndex: number;
  rowLength: number;
  playerIndex: number;
  totalRows: number;
  side: LineupSide;
  orientation: PitchOrientation;
}) {
  const rowProgress = totalRows <= 1 ? 0.5 : rowIndex / (totalRows - 1);
  const lane = formationLane(rowLength, playerIndex);

  if (orientation === "vertical") {
    return {
      left: lane,
      top: side === "home" ? 8 + rowProgress * 38 : 92 - rowProgress * 38
    };
  }

  return {
    left: side === "home" ? 5 + rowProgress * 40 : 95 - rowProgress * 40,
    top: lane
  };
}

function CardGlyph({ tone }: { tone: "yellow" | "red" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-3.5 w-2.5 rounded-[2px]",
        tone === "yellow" ? "bg-amber-400" : "bg-rose-600"
      )}
    />
  );
}

function SubstitutionGlyph({ direction }: { direction: "on" | "off" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3">
      <path
        className={cn(direction === "on" ? "fill-emerald-600" : "fill-rose-500")}
        d="M7 .33A6.67 6.67 0 1 1 7 13.67 6.67 6.67 0 0 1 7 .33Zm2.92 6.22L7.72 4.35a.6.6 0 0 0-.85.85l1.17 1.17H3.8a.63.63 0 0 0 0 1.26h4.24L6.87 8.8a.6.6 0 0 0 .85.85l2.2-2.2a.64.64 0 0 0 0-.9Z"
      />
    </svg>
  );
}

function AssistGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-zinc-800">
      <path d="M12.6 5.7c-.18.1-.38.21-.6.34-.16.09-.32.19-.49.3-.81.52-6.65 4.11-7.84 4.79s-3.04.93-3.56.02 1.03-1.95 1.95-3.06C3.11 6.83 4.48 5.46 4.48 5.46c-.09-.43.33-.71.49-.81.02-.01.04-.02.06-.03-.12-.5.63-.93.63-.93l1.15-2.51a.23.23 0 0 1 .3-.12l1.03.43c.67.28-.77 1.89-.47 1.96a1.67 1.67 0 0 0 1.04-.27c.28-.17.53-.38.74-.62.48-.56-.03-1.38.25-1.54.1-.05.29-.03.64.1 1.4.53 2.2 2.21 2.78 3.25.4.71.12.97-.51 1.33ZM4.59 6.39a.08.08 0 0 0-.08.02l-.63.62a.08.08 0 0 0 .04.14l3.23.67a.09.09 0 0 0 .06-.01l.98-.56a.08.08 0 0 0-.02-.15l-3.58-.73Zm5.56-.42-4.41-.84a.09.09 0 0 0-.07.02l-.63.62a.08.08 0 0 0 .04.14l3.99.81a.09.09 0 0 0 .06-.01l1.04-.58a.08.08 0 0 0-.02-.16Z" />
    </svg>
  );
}

function EventCircle({
  children,
  label,
  className
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full border border-gray-200 bg-white px-1 text-[0.6rem] font-bold leading-none text-zinc-800 shadow-sm",
        className
      )}
    >
      {children}
    </span>
  );
}

function PlayerEventBadges({ summary }: { summary: PlayerEventSummary }) {
  const substitution = summary.subOff ?? summary.subOn;
  const substitutionType = summary.subOff ? "off" : summary.subOn ? "on" : null;
  const cardEvents = [...summary.yellowCards.map(() => "yellow" as const), ...summary.redCards.map(() => "red" as const)];
  const goalCount = summary.goals.length;
  const ownGoalCount = summary.ownGoals.length;
  const assistCount = summary.assists.length;

  return (
    <>
      {substitution && substitutionType ? (
        <span className="absolute -right-5 -top-3 flex flex-col items-center gap-0.5">
          <span className="text-[0.62rem] font-semibold leading-none text-white drop-shadow">{formatMinute(substitution.minute)}</span>
          <EventCircle label={`Substituted ${substitutionType} at ${formatMinute(substitution.minute)}`}>
            <SubstitutionGlyph direction={substitutionType} />
          </EventCircle>
        </span>
      ) : null}

      {cardEvents.length ? (
        <span className="absolute -right-4 bottom-1 flex">
          {cardEvents.slice(0, 3).map((tone, index) => (
            <EventCircle key={`${tone}-${index}`} label={`${tone} card`} className={cn(index > 0 && "-ml-2.5")}>
              <CardGlyph tone={tone} />
            </EventCircle>
          ))}
          {cardEvents.length > 3 ? (
            <EventCircle label={`${cardEvents.length} cards`} className="-ml-2.5">
              +{cardEvents.length - 3}
            </EventCircle>
          ) : null}
        </span>
      ) : null}

      {goalCount || ownGoalCount || assistCount ? (
        <span className="absolute -bottom-2 -left-4 flex">
          {goalCount ? (
            <EventCircle label={`${goalCount} goal${goalCount === 1 ? "" : "s"}`}>
              <span className="flex items-center gap-0.5">
                <MatchBallGlyph />
                {compactCount(goalCount)}
              </span>
            </EventCircle>
          ) : null}
          {ownGoalCount ? (
            <EventCircle label={`${ownGoalCount} own goal${ownGoalCount === 1 ? "" : "s"}`} className={goalCount ? "-ml-2.5" : undefined}>
              <span className="text-[0.55rem] text-rose-600">OG{ownGoalCount > 1 ? ownGoalCount : ""}</span>
            </EventCircle>
          ) : null}
          {assistCount ? (
            <EventCircle
              label={`${assistCount} assist${assistCount === 1 ? "" : "s"}`}
              className={goalCount || ownGoalCount ? "-ml-2.5" : undefined}
            >
              <span className="flex items-center gap-0.5">
                <AssistGlyph />
                {compactCount(assistCount)}
              </span>
            </EventCircle>
          ) : null}
        </span>
      ) : null}
    </>
  );
}

function FotmobPlayerMarker({
  player,
  lineup,
  events
}: {
  player: MatchLineupPlayer;
  lineup?: TeamLineup;
  events?: MatchEvent[];
}) {
  const summary = playerEventSummary(player, lineup, events);
  const displayName = player.shortName ?? player.name;

  return (
    <div className="pointer-events-auto flex max-w-[5.8rem] flex-col items-center pt-5 text-center">
      <div className="relative">
        <div className="box-content flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-[0.68rem] font-bold text-emerald-800">
            {player.jersey ?? initials(displayName)}
          </span>
        </div>
        <PlayerEventBadges summary={summary} />
      </div>
      <span
        title={player.name}
        className="mt-3 line-clamp-2 max-w-full break-words px-0.5 text-center text-[0.72rem] font-medium leading-4 text-white drop-shadow"
      >
        <span className="mr-1 inline-block text-white/75">{player.jersey ?? "--"}</span>
        {displayName}
      </span>
    </div>
  );
}

function TeamPitchMarkers({
  lineup,
  side,
  events,
  orientation
}: {
  lineup?: TeamLineup;
  side: LineupSide;
  events?: MatchEvent[];
  orientation: PitchOrientation;
}) {
  const rows = formationRows(lineup);

  if (!rows.length) {
    return (
      <div
        className={cn(
          "absolute grid place-items-center px-6 text-center text-xs font-medium text-white/75",
          orientation === "horizontal" ? (side === "home" ? "inset-y-0 left-0 w-1/2" : "inset-y-0 right-0 w-1/2") : side === "home" ? "inset-x-0 top-0 h-1/2" : "inset-x-0 bottom-0 h-1/2"
        )}
      >
        {side === "home" ? "Home lineup has not been published yet." : "Away lineup has not been published yet."}
      </div>
    );
  }

  return (
    <>
      {rows.flatMap((row, rowIndex) =>
        row.map((player, playerIndex) => {
          const position = lineupPosition({
            rowIndex,
            rowLength: row.length,
            playerIndex,
            totalRows: rows.length,
            side,
            orientation
          });

          return (
            <div
              key={`${orientation}-${side}-${player.id ?? player.name}-${rowIndex}-${playerIndex}`}
              className="absolute z-10"
              style={{
                left: `${position.left}%`,
                top: `${position.top}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              <FotmobPlayerMarker player={player} lineup={lineup} events={events} />
            </div>
          );
        })
      )}
    </>
  );
}

function PitchMarkings({ orientation }: { orientation: PitchOrientation }) {
  if (orientation === "vertical") {
    return (
      <>
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-emerald-500/80 after:absolute after:left-1/2 after:top-1/2 after:h-28 after:w-28 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-[5px] after:border-emerald-500/80 after:content-['']" />
        <div className="absolute left-1/2 top-0 h-24 w-36 -translate-x-1/2 rounded-b-full border-x-[5px] border-b-[5px] border-emerald-500/80" />
        <div className="absolute bottom-0 left-1/2 h-24 w-36 -translate-x-1/2 rounded-t-full border-x-[5px] border-t-[5px] border-emerald-500/80" />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-emerald-500/80 after:absolute after:left-1/2 after:top-1/2 after:h-36 after:w-36 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-[6px] after:border-emerald-500/80 after:content-['']" />
      <div className="absolute left-0 top-1/2 h-48 w-24 -translate-y-1/2 rounded-r-full border-y-[6px] border-r-[6px] border-emerald-500/80" />
      <div className="absolute right-0 top-1/2 h-48 w-24 -translate-y-1/2 rounded-l-full border-y-[6px] border-l-[6px] border-emerald-500/80" />
    </>
  );
}

function FotmobTeamHeader({ lineup, reverse = false }: { lineup?: TeamLineup; reverse?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3 md:gap-6", reverse && "flex-row-reverse")}>
      <div className={cn("flex min-w-0 items-center gap-2.5", reverse && "flex-row-reverse")}>
        <TeamLogo
          team={lineup?.team ?? "Pending"}
          code={lineup?.teamCode}
          logo={lineup?.teamLogo}
          className="h-7 w-7 rounded-none border-0 bg-transparent p-0"
        />
        <h2 className={cn("truncate text-sm font-medium text-white", reverse && "text-right")}>{lineup?.team ?? "Lineup pending"}</h2>
      </div>
      <span className="whitespace-nowrap text-sm font-medium leading-5 text-white">{lineup?.formation ?? "TBD"}</span>
    </div>
  );
}

function ScorerStrip({ detail }: { detail: FixtureDetail }) {
  const homeScorers = buildScorerLines(detail.fixture, "home");
  const awayScorers = buildScorerLines(detail.fixture, "away");
  const hasScorers = homeScorers.length || awayScorers.length;

  if (!hasScorers) {
    return null;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 border-b border-emerald-500/80 px-3 py-2 text-xs text-white/90 md:px-4">
      <div className="grid gap-1">
        {homeScorers.map((scorer) => (
          <p key={`home-${scorer.player}`} className="truncate font-medium">
            {scorer.player}
            <span className="ml-1 text-white/60">{scorer.minutes.join(", ")}</span>
          </p>
        ))}
      </div>
      <MatchBallGlyph />
      <div className="grid gap-1 text-right">
        {awayScorers.map((scorer) => (
          <p key={`away-${scorer.player}`} className="truncate font-medium">
            {scorer.player}
            <span className="ml-1 text-white/60">{scorer.minutes.join(", ")}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function FotmobLineupBoard({
  detail,
  homeLineup,
  awayLineup
}: {
  detail: FixtureDetail;
  homeLineup?: TeamLineup;
  awayLineup?: TeamLineup;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-sm">
      <header className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-emerald-500/80 px-3 py-3 md:px-4">
        <FotmobTeamHeader lineup={homeLineup} />
        <div className="grid justify-items-center gap-1 text-center">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.65rem] font-medium text-white/90">
            {statusLabel(detail.fixture.status, detail.fixture.minute)}
          </span>
          <strong className="text-lg font-bold leading-none text-white md:text-xl">{scoreLabel(detail.fixture)}</strong>
          <span className="hidden text-[0.68rem] text-white/70 sm:block">{detail.fixture.readableKickoff}</span>
        </div>
        <FotmobTeamHeader lineup={awayLineup} reverse />
      </header>

      <ScorerStrip detail={detail} />

      <div className="relative hidden h-[550px] overflow-hidden bg-emerald-600 md:block">
        <PitchMarkings orientation="horizontal" />
        <TeamPitchMarkers lineup={homeLineup} side="home" events={detail.fixture.events} orientation="horizontal" />
        <TeamPitchMarkers lineup={awayLineup} side="away" events={detail.fixture.events} orientation="horizontal" />
      </div>

      <div className="relative h-[760px] overflow-hidden bg-emerald-600 md:hidden">
        <PitchMarkings orientation="vertical" />
        <TeamPitchMarkers lineup={homeLineup} side="home" events={detail.fixture.events} orientation="vertical" />
        <TeamPitchMarkers lineup={awayLineup} side="away" events={detail.fixture.events} orientation="vertical" />
      </div>
    </section>
  );
}

function BenchEventCluster({
  player,
  lineup,
  events
}: {
  player: MatchLineupPlayer;
  lineup?: TeamLineup;
  events?: MatchEvent[];
}) {
  const summary = playerEventSummary(player, lineup, events);
  const subMinute = summary.subOn?.minute ?? summary.subOff?.minute ?? null;

  return (
    <div className="flex items-center justify-end gap-1">
      {summary.yellowCards.map((event, index) => (
        <EventCircle key={`yellow-${event.minute}-${index}`} label={`Yellow card ${formatMinute(event.minute)}`}>
          <CardGlyph tone="yellow" />
        </EventCircle>
      ))}
      {summary.redCards.map((event, index) => (
        <EventCircle key={`red-${event.minute}-${index}`} label={`Red card ${formatMinute(event.minute)}`}>
          <CardGlyph tone="red" />
        </EventCircle>
      ))}
      {summary.goals.length ? (
        <EventCircle label={`${summary.goals.length} goal${summary.goals.length === 1 ? "" : "s"}`}>
          <span className="flex items-center gap-0.5">
            <MatchBallGlyph />
            {compactCount(summary.goals.length)}
          </span>
        </EventCircle>
      ) : null}
      {subMinute !== null ? (
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="text-xs font-medium">{formatMinute(subMinute)}</span>
          <EventCircle label={`Substitution ${formatMinute(subMinute)}`}>
            <SubstitutionGlyph direction={summary.subOn ? "on" : "off"} />
          </EventCircle>
        </span>
      ) : null}
    </div>
  );
}

function FotmobBenchList({
  lineup,
  side,
  events
}: {
  lineup?: TeamLineup;
  side: LineupSide;
  events?: MatchEvent[];
}) {
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
  const reverse = side === "away";

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <header className="flex h-12 items-center justify-center border-b border-neutral-100 px-4">
        <h2 className="text-sm font-medium text-neutral-800">{lineup ? `${lineup.team} Substitutes` : `${side} substitutes`}</h2>
      </header>

      {orderedBench.length ? (
        <ul className="grid">
          {orderedBench.map((player) => {
            const positionLabel = benchPositionLabel(player);

            return (
              <li
                key={`${side}-${player.id ?? player.name}`}
                className={cn(
                  "flex min-h-16 items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2 last:border-b-0",
                  reverse && "flex-row-reverse"
                )}
              >
                <div className={cn("flex min-w-0 items-center gap-3", reverse && "flex-row-reverse")}>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-[0.62rem] font-bold text-neutral-700">
                    {player.jersey ?? initials(player.shortName ?? player.name)}
                  </div>
                  <div className={cn("min-w-0", reverse && "text-right")}>
                    <p className="truncate text-sm font-medium text-neutral-800">
                      <span className="mr-1 text-neutral-400">{player.jersey ?? "--"}</span>
                      {player.name}
                    </p>
                    {positionLabel ? <p className="truncate text-xs text-neutral-400">{positionLabel}</p> : null}
                  </div>
                </div>
                <BenchEventCluster player={player} lineup={lineup} events={events} />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-4 py-6">
          <EmptyState title="Bench unavailable" description="ESPN has not published the substitutes list for this side yet." />
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

      <FotmobLineupBoard detail={resolvedDetail} homeLineup={homeLineup} awayLineup={awayLineup} />

      <div className="grid gap-4 xl:grid-cols-2">
        <FotmobBenchList lineup={homeLineup} side="home" events={resolvedDetail.fixture.events} />
        <FotmobBenchList lineup={awayLineup} side="away" events={resolvedDetail.fixture.events} />
      </div>
    </PageShell>
  );
}

import { scoreLabel, statusLabel } from "@/lib/format";
import type { EnrichedFixture } from "@/lib/types";
import TeamLogo from "./TeamLogo";

export default function MatchCard({ fixture }: { fixture: EnrichedFixture }) {
  const matchupLabel = fixture.isSelfMatch
    ? "Friendly Fire"
    : fixture.isOwnerVsOwner
      ? "Owner v owner"
      : "Shared stakes";

  return (
    <article className={`fixture-card fixture-card-${fixture.status}`}>
      <div className="fixture-kicker">
        <span>{fixture.readableKickoff}</span>
        <span className={`status-text status-${fixture.status}`}>
          {fixture.status === "live" ? <span className="live-dot" /> : null}
          {statusLabel(fixture)}
        </span>
      </div>

      <div className="fixture-scoreboard">
        <div className="team-station">
          <TeamLogo team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} className="team-mark md" />
          <strong>{fixture.homeTeam}</strong>
          <span>{fixture.homeOwner}{fixture.homePot ? ` · Pot ${fixture.homePot}` : ""}</span>
        </div>
        <div className="fixture-score">
          {fixture.homeScore ?? "-"} <span>-</span> {fixture.awayScore ?? "-"}
        </div>
        <div className="team-station">
          <TeamLogo team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} className="team-mark md" />
          <strong>{fixture.awayTeam}</strong>
          <span>{fixture.awayOwner}{fixture.awayPot ? ` · Pot ${fixture.awayPot}` : ""}</span>
        </div>
      </div>

      <div className="fixture-footer">
        <span>{fixture.stage}{fixture.group ? ` · Group ${fixture.group}` : ""}</span>
        <span>{scoreLabel(fixture) === "vs" ? matchupLabel : `${matchupLabel} · ${scoreLabel(fixture)}`}</span>
      </div>
    </article>
  );
}

import Link from "next/link";
import { aliveRatio, initials, recordLabel } from "@/lib/format";
import type { OwnerSummary } from "@/lib/types";
import TeamBadge from "./TeamBadge";

export default function OwnerCard({ owner }: { owner: OwnerSummary }) {
  const ratio = aliveRatio(owner.teamsStillAlive, owner.teamCount);

  return (
    <article className="owner-card">
      <div className="owner-card-head">
        <div className="owner-avatar" aria-hidden="true">{initials(owner.owner)}</div>
        <div>
          <h3>{owner.owner}</h3>
          <div className="owner-meta">
            <span>{owner.teamCount} teams</span>
            <span>{owner.teamsStillAlive} alive</span>
            <span>{recordLabel(owner)}</span>
          </div>
        </div>
      </div>

      <div className="owner-card-stats">
        <div>
          <span>Points</span>
          <strong>{owner.points}</strong>
        </div>
        <div>
          <span>Goals</span>
          <strong>{owner.goalsFor}/{owner.goalsAgainst}</strong>
        </div>
      </div>

      <div className="progress-line">
        <span style={{ width: `${ratio}%` }} />
      </div>

      <div className="team-list compact">
        {owner.teams.slice(0, 8).map((team) => (
          <TeamBadge key={team.team} team={team.team} pot={team.pot} alive={team.alive} />
        ))}
      </div>

      <Link className="button-link" href={`/owners/${encodeURIComponent(owner.owner)}`}>
        Open dashboard
      </Link>
    </article>
  );
}

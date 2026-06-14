import type { OwnerSummary, TeamStats } from "@/lib/types";

type OwnerTableProps = {
  title: string;
  rows: OwnerSummary[];
};

type TeamTableProps = {
  title: string;
  rows: TeamStats[];
  metric: "goalsFor" | "goalsAgainst" | "redCards" | "points";
};

export function OwnerLeaderboardTable({ title, rows }: OwnerTableProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="table">
        <div className="table-row table-head">
          <span>#</span><span>Owner</span><span>Pts</span><span>Alive</span><span>GF</span><span>GA</span>
        </div>
        {rows.map((row, index) => (
          <div className="table-row" key={row.owner}>
            <span>{index + 1}</span>
            <strong>{row.owner}</strong>
            <span>{row.points}</span>
            <span>{row.teamsStillAlive}/{row.teamCount}</span>
            <span>{row.goalsFor}</span>
            <span>{row.goalsAgainst}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamLeaderboardTable({ title, rows, metric }: TeamTableProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="table">
        <div className="table-row table-head">
          <span>#</span><span>Team</span><span>Owner</span><span>Pot</span><span>{metric}</span><span>GD</span>
        </div>
        {rows.map((row, index) => (
          <div className="table-row" key={`${title}-${row.team}`}>
            <span>{index + 1}</span>
            <strong>{row.team}</strong>
            <span>{row.owner}</span>
            <span>{row.pot}</span>
            <span>{row[metric]}</span>
            <span>{row.goalDifference}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

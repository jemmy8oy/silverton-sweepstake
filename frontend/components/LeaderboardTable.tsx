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
    <section className="rounded-[24px] border border-outline-variant bg-surface-high px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="mb-4">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white">{title}</h2>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-6 gap-3 rounded-[18px] bg-surface-panel px-4 py-3 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
          <span>#</span><span>Owner</span><span>Pts</span><span>Alive</span><span>GF</span><span>GA</span>
        </div>
        {rows.map((row, index) => (
          <div className="grid grid-cols-6 gap-3 rounded-[18px] border border-outline-variant bg-surface-low px-4 py-3 text-sm text-ink" key={row.owner}>
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
    <section className="rounded-[24px] border border-outline-variant bg-surface-high px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="mb-4">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white">{title}</h2>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-6 gap-3 rounded-[18px] bg-surface-panel px-4 py-3 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
          <span>#</span><span>Team</span><span>Owner</span><span>Pot</span><span>{metric}</span><span>GD</span>
        </div>
        {rows.map((row, index) => (
          <div className="grid grid-cols-6 gap-3 rounded-[18px] border border-outline-variant bg-surface-low px-4 py-3 text-sm text-ink" key={`${title}-${row.team}`}>
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

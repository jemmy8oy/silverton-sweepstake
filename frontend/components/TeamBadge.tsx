export default function TeamBadge({ team, pot, alive }: { team: string; pot?: number; alive?: boolean }) {
  return (
    <span className={`team-badge ${alive === false ? "is-out" : ""}`} title={alive === false ? "At risk or eliminated in mock data" : "Still alive in mock data"}>
      {team}
      {typeof pot === "number" ? <span>Pot {pot}</span> : null}
    </span>
  );
}

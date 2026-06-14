import TeamLogo from "./TeamLogo";

export default function TeamBadge({ team, code, logo, pot, alive }: { team: string; code?: string; logo?: string | null; pot?: number; alive?: boolean }) {
  return (
    <span className={`team-badge ${alive === false ? "is-out" : ""}`} title={alive === false ? "At risk or eliminated in mock data" : "Still alive in mock data"}>
      <TeamLogo team={team} code={code} logo={logo} className="team-badge-logo" />
      {team}
      {typeof pot === "number" ? <span>Pot {pot}</span> : null}
    </span>
  );
}

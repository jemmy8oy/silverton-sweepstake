import TeamLogo from "./TeamLogo";
import { cn } from "@/lib/cn";

export default function TeamBadge({ team, code, logo, pot, alive }: { team: string; code?: string; logo?: string | null; pot?: number; alive?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm",
        alive === false ? "border-danger/30 bg-danger-strong/10 text-danger" : "border-outline-variant bg-surface-low text-ink"
      )}
      title={alive === false ? "At risk or eliminated in mock data" : "Still alive in mock data"}
    >
      <TeamLogo team={team} code={code} logo={logo} className="h-7 w-7 border border-outline-variant bg-surface-high p-1.5" />
      <span>{team}</span>
      {typeof pot === "number" ? <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] opacity-80">Pot {pot}</span> : null}
    </span>
  );
}

import Image from "next/image";
import { teamCode } from "@/lib/format";
import { cn } from "@/lib/cn";

type TeamLogoProps = {
  team: string;
  code?: string;
  logo?: string | null;
  className: string;
};

export default function TeamLogo({ team, code, logo, className }: TeamLogoProps) {
  if (logo) {
    return (
      <div className={cn("relative overflow-hidden", className)} aria-label={team}>
        <Image src={logo} alt={`${team} logo`} fill sizes="88px" className="object-contain" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden border-2 border-foreground bg-background font-mono text-xs font-extrabold uppercase tracking-[0.16em] text-foreground",
        className
      )}
      aria-label={team}
    >
      <span>{teamCode(team, code)}</span>
    </div>
  );
}

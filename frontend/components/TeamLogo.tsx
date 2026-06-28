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
      <div className={cn("relative shrink-0 overflow-hidden", className)} aria-label={team}>
        <Image src={logo} alt={`${team} logo`} fill sizes="88px" className="object-contain" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-neutral-100 text-[0.62rem] font-semibold uppercase text-neutral-500",
        className
      )}
      aria-label={team}
    >
      <span>{teamCode(team, code)}</span>
    </div>
  );
}

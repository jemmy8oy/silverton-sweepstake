import Image from "next/image";
import { teamCode } from "@/lib/format";

type TeamLogoProps = {
  team: string;
  code?: string;
  logo?: string | null;
  className: string;
};

export default function TeamLogo({ team, code, logo, className }: TeamLogoProps) {
  if (logo) {
    return (
      <div className={className} aria-label={team}>
        <Image src={logo} alt={`${team} logo`} fill sizes="88px" />
      </div>
    );
  }

  return (
    <div className={className} aria-label={team}>
      <span>{teamCode(team, code)}</span>
    </div>
  );
}

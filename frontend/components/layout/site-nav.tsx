import Link from "next/link";
import { SideNavLinks } from "@/components/SiteNav";

export default function SiteNav() {
  return (
    <aside className="sticky top-0 hidden h-screen border-r-2 border-foreground bg-background py-8 md:flex md:flex-col" aria-label="Primary navigation">
      <div className="mb-10 px-6">
        <Link href="/" className="block font-display text-[2.35rem] font-black leading-none text-foreground" aria-label="Silverton Sweepstake home">
          Silverton Sweepstake
        </Link>
        <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">partyboys_tm</p>
      </div>
      <SideNavLinks />
    </aside>
  );
}

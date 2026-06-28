import Link from "next/link";
import { SideNavLinks } from "@/components/SiteNav";

export default function SiteNav() {
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-neutral-100 bg-white py-6 md:flex md:flex-col" aria-label="Primary navigation">
      <div className="mb-8 px-5">
        <Link href="/" className="block text-2xl font-bold leading-tight text-neutral-800" aria-label="Silverton Sweepstake home">
          Silverton Sweepstake
        </Link>
        <p className="mt-1 text-xs font-medium text-muted-foreground">partyboys_tm</p>
      </div>
      <SideNavLinks />
    </aside>
  );
}

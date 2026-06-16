import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-foreground bg-background px-4 md:hidden">
      <Link href="/" className="font-display text-[1.75rem] font-black leading-none text-foreground" aria-label="Silverton Sweepstake home">
        Silverton Sweepstake
      </Link>
    </header>
  );
}

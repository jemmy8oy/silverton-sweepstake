import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-[3.25rem] items-center justify-between border-b-2 border-foreground bg-background px-3 md:hidden">
      <Link href="/" className="font-display text-[1.35rem] font-black leading-none text-foreground" aria-label="Silverton Sweepstake home">
        Silverton Sweepstake
      </Link>
    </header>
  );
}

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-100 bg-white px-4 md:hidden">
      <Link href="/" className="text-base font-bold leading-none text-neutral-800" aria-label="Silverton Sweepstake home">
        Silverton Sweepstake
      </Link>
    </header>
  );
}

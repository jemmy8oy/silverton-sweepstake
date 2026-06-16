"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/owners", label: "Owners", icon: "◉" },
  { href: "/fixtures", label: "Fixtures", icon: "◷" },
  { href: "/leaderboards", label: "Leaderboard", icon: "≋" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-muted transition hover:bg-surface-high hover:text-ink",
            isActive(pathname, item.href) && "bg-accent-strong text-accent-soft-ink"
          )}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-2xl px-3 py-2 font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-ink-muted transition hover:bg-surface-high hover:text-ink",
            isActive(pathname, item.href) && "bg-accent-strong text-accent-soft-ink"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

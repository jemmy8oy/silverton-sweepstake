"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/owners", icon: "groups", label: "Owners" },
  { href: "/fixtures", icon: "calendar_today", label: "Fixtures" },
  { href: "/leaderboards", icon: "leaderboard", label: "Leaderboard" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export function SideNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="grid flex-1 gap-1.5 px-3">
      {navItems.map((item) => (
        <Link
          key={item.href}
          className={cn(
            "flex items-center gap-2 border-2 border-transparent px-3 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-foreground transition duration-150 ease-out hover:border-foreground hover:bg-secondary hover:text-foreground",
            isActive(pathname, item.href) && "border-foreground bg-accent text-accent-foreground"
          )}
          href={item.href}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function BottomNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          className={cn(
            "flex min-w-[60px] flex-col items-center justify-center gap-0.5 border-2 border-transparent px-2 py-1 font-mono text-[0.54rem] font-bold uppercase tracking-[0.12em] text-muted-foreground transition duration-150 ease-out",
            isActive(pathname, item.href) && "border-foreground bg-accent text-accent-foreground"
          )}
          href={item.href}
        >
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );
}

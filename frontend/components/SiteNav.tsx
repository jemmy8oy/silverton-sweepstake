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
    <nav className="grid flex-1 gap-1 px-3">
      {navItems.map((item) => (
        <Link
          key={item.href}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-800",
            isActive(pathname, item.href) && "bg-neutral-100 text-neutral-800"
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
            "flex min-w-[60px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[0.62rem] font-medium text-muted-foreground transition duration-150 ease-out",
            isActive(pathname, item.href) && "bg-neutral-100 text-neutral-800"
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

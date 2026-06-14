"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <nav className="side-links">
      {navItems.map((item) => (
        <Link key={item.href} className={isActive(pathname, item.href) ? "nav-link active" : "nav-link"} href={item.href}>
          <span className="material-symbols-outlined" aria-hidden="true">
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
        <Link key={item.href} className={isActive(pathname, item.href) ? "bottom-link active" : "bottom-link"} href={item.href}>
          <span className="material-symbols-outlined" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );
}

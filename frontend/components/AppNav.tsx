"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <nav className="side-links" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} data-active={isActive(pathname, item.href)}>
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
    <nav className="mobile-nav" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} data-active={isActive(pathname, item.href)}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

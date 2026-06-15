import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNavLinks, SideNavLinks } from "@/components/SiteNav";
import LiveRefresher from "@/components/LiveRefresher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silverton Sweepstake",
  description: "Track the chaos, scores, sweepstake owners, and World Cup bragging rights."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className="dark" lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LiveRefresher />
        <aside className="side-nav" aria-label="Primary navigation">
          <div className="side-brand">
            <Link href="/" className="brand-mark" aria-label="Silverton Sweepstake home">
              Silverton Sweepstake
            </Link>
            <p>partyboys_tm</p>
          </div>

          <SideNavLinks />
        </aside>

        <header className="mobile-header">
          <Link href="/" className="brand-mark" aria-label="Silverton Sweepstake home">
            Silverton Sweepstake
          </Link>
        </header>

        {children}

        <nav className="bottom-nav" aria-label="Mobile navigation">
          <BottomNavLinks />
        </nav>
      </body>
    </html>
  );
}

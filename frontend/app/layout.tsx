import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import AppShell from "@/components/layout/app-shell";
import LiveRefresher from "@/components/LiveRefresher";
import PwaRegistration from "@/components/PwaRegistration";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Silverton Sweepstake",
  description: "Track the chaos, scores, sweepstake owners, and World Cup bragging rights.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sweepstake"
  }
};

export const viewport: Viewport = {
  themeColor: "#f5f0e8"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={cn("font-sans", inter.variable, spaceGrotesk.variable)} lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/*
          Material Symbols is subset to only the icons the app renders via the
          &icon_names= parameter, instead of shipping the entire ~thousands-glyph
          variable icon font. Axes are pinned (opsz/wght/GRAD fixed, FILL kept for
          the filled star). Keep this list in sync with the icons used in JSX.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=calendar_today,chevron_left,chevron_right,dashboard,emoji_events,expand_more,flight_takeoff,groups,leaderboard,liquor,local_bar,search,sentiment_very_dissatisfied,shield,sports_soccer,stadium,star,style,swords,trending_down,trending_up,verified,videocam&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen pb-24 md:pb-0">
        <PwaRegistration />
        <LiveRefresher />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

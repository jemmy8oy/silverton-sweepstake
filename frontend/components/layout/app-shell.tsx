import type { ReactNode } from "react";
import MobileNav from "@/components/layout/mobile-nav";
import SiteHeader from "@/components/layout/site-header";
import SiteNav from "@/components/layout/site-nav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="md:grid md:min-h-screen md:grid-cols-[280px_minmax(0,1fr)]">
        <SiteNav />
        <div className="min-w-0">
          <SiteHeader />
          {children}
        </div>
      </div>
      <MobileNav />
    </>
  );
}

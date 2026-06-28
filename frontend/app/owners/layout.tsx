import OwnersClientShell from "@/components/OwnersClientShell";
import EmptyState from "@/components/common/empty-state";
import PageShell from "@/components/layout/page-shell";
import { getOwners } from "@/lib/api";
import type { ReactNode } from "react";
import type { OwnerSummary } from "@/lib/types";

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

export default async function OwnersLayout({ children: _children }: { children: ReactNode }) {
  const owners = await safe(getOwners(), [] as OwnerSummary[]);
  const sortedOwners = [...owners].sort((a, b) => b.points - a.points || b.teamsStillAlive - a.teamsStillAlive);

  return (
    <PageShell>
      <section aria-label="Sweepstake owners">
        {sortedOwners.length ? (
          <OwnersClientShell owners={sortedOwners} />
        ) : (
          <EmptyState title="No owners found" description="The draw data has not loaded yet." />
        )}
      </section>
    </PageShell>
  );
}

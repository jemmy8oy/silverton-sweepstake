import OwnersClientShell from "@/components/OwnersClientShell";
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
    <main className="owners-shell">
      <section className="owners-page-header">
        <div>
          <h1>Owners</h1>
          <p>Every friend, every team, and every tournament swing in one place.</p>
        </div>
        <div className="owners-summary-card">
          <span>Active Owners</span>
          <strong>{owners.length}</strong>
        </div>
      </section>

      <section className="owners-list" aria-label="Sweepstake owners">
        {sortedOwners.length ? (
          <OwnersClientShell owners={sortedOwners} />
        ) : (
          <div className="owners-empty">
            <span className="material-symbols-outlined" aria-hidden="true">
              groups
            </span>
            <strong>No owners found</strong>
            <p>The draw data has not loaded yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}

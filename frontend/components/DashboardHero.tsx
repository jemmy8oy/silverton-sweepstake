import type { EnrichedFixture, OwnerSummary } from "@/lib/types";

export default function DashboardHero({
  owners,
  today,
  live
}: {
  owners: OwnerSummary[];
  today: EnrichedFixture[];
  live: EnrichedFixture[];
}) {
  const totalTeams = owners.reduce((sum, owner) => sum + owner.teamCount, 0);
  const alive = owners.reduce((sum, owner) => sum + owner.teamsStillAlive, 0);

  return (
    <section className="hero">
      <div>
        <span className="eyebrow">Live: Matchday</span>
        <h1>Silverton Sweepstake</h1>
        <p>
          Track the chaos, glory, and punishment shots. May the underdogs rise and the owners tremble.
        </p>
        <div className="hero-actions">
          <a href="/fixtures" className="button-link">View scores</a>
          <a href="/leaderboards" className="secondary-link">Standings</a>
        </div>
      </div>
      <div className="hero-stats">
        <div className="stat-tile"><strong>{owners.length}</strong> friends in the draw</div>
        <div className="stat-tile"><strong>{alive}/{totalTeams}</strong> teams still alive</div>
        <div className="stat-tile"><strong>{today.length}</strong> matches today</div>
        <div className="stat-tile"><strong>{live.length}</strong> live right now</div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, Crosshair, LayoutPanelTop } from "lucide-react";
import EmptyState from "@/components/common/empty-state";
import StatusBadge from "@/components/common/status-badge";
import PageHeader from "@/components/layout/page-header";
import PageShell from "@/components/layout/page-shell";
import SectionShell from "@/components/layout/section-shell";
import TeamLogo from "@/components/TeamLogo";
import { Button } from "@/components/ui/button";
import { getFixtures } from "@/lib/api";
import { buildMatchSlug } from "@/lib/match-slug";
import type { EnrichedFixture } from "@/lib/types";

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function scoreLabel(fixture: EnrichedFixture) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "VS";
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function statusLabel(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return `Live${fixture.minute ? ` • ${fixture.minute}` : ""}`;
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return "Upcoming";
}

function toneForStatus(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return "destructive" as const;
  }
  if (fixture.status === "finished") {
    return "default" as const;
  }
  return "muted" as const;
}

function MatchLaunchCard({ fixture }: { fixture: EnrichedFixture }) {
  const href = `/match/${buildMatchSlug(fixture)}`;

  return (
    <article className="brutal-surface grid gap-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge tone={toneForStatus(fixture)}>{statusLabel(fixture)}</StatusBadge>
        <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {fixture.stage}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TeamLogo
            team={fixture.homeTeam}
            code={fixture.homeTeamCode ?? fixture.homeCode}
            logo={fixture.homeTeamLogo ?? fixture.homeLogo}
            className="h-12 w-12 border-2 border-foreground bg-background p-1.5"
          />
          <div className="grid min-w-0 gap-1">
            <strong className="truncate text-base font-black">{fixture.homeTeam}</strong>
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {fixture.homeOwner}
            </span>
          </div>
        </div>

        <div className="grid min-w-[88px] place-items-center bg-accent px-3 py-2 text-center">
          <strong className="font-display text-xl font-black">{scoreLabel(fixture)}</strong>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="grid min-w-0 gap-1">
            <strong className="truncate text-base font-black">{fixture.awayTeam}</strong>
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {fixture.awayOwner}
            </span>
          </div>
          <TeamLogo
            team={fixture.awayTeam}
            code={fixture.awayTeamCode ?? fixture.awayCode}
            logo={fixture.awayTeamLogo ?? fixture.awayLogo}
            className="h-12 w-12 border-2 border-foreground bg-background p-1.5"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-foreground pt-3">
        <span className="text-sm text-muted-foreground">
          Open the formation board, starters, and bench for this fixture.
        </span>
        <Button asChild size="sm">
          <Link href={href}>
            View Match
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export default async function MatchIndexPage() {
  const fixtures = await safe(getFixtures(), []);
  const samples = fixtures.slice(0, 8);
  const featured = fixtures.find((fixture) => fixture.id === "760415") ?? samples[0] ?? null;
  const examplePath = featured ? `/silverton-sweepstake/match/${buildMatchSlug(featured)}` : "/silverton-sweepstake/match";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Match Centre"
        title="Lineup Pages"
      />

      <SectionShell
        marker="Examples"
        title="Pick A Fixture"
        actions={
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutPanelTop className="h-4 w-4" />
            <Crosshair className="h-4 w-4" />
          </div>
        }
      >
        {samples.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {samples.map((fixture) => (
              <MatchLaunchCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fixtures available"
            description="The match index will populate as soon as the backend serves fixtures."
          />
        )}
      </SectionShell>
    </PageShell>
  );
}

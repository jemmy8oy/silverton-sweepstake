import Link from "next/link";
import { getFixtures, getOwners } from "@/lib/api";
import OwnerAvatar from "@/components/OwnerAvatar";
import { teamCode } from "@/lib/format";
import TeamLogo from "@/components/TeamLogo";
import type { EnrichedFixture, OwnerSummary } from "@/lib/types";

type FixturesSearchParams = {
  tab?: string | string[];
  owner?: string | string[];
};

async function safe<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isToday(kickoff: string) {
  const matchDate = new Date(kickoff);
  const today = new Date();

  return (
    matchDate.getFullYear() === today.getFullYear() &&
    matchDate.getMonth() === today.getMonth() &&
    matchDate.getDate() === today.getDate()
  );
}

function statusLabel(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return `Live${fixture.minute ? ` • ${fixture.minute}` : ""}`;
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return "Kickoff";
}

function scoreLabel(fixture: EnrichedFixture) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "VS";
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`;
}

function tabHref(tab: string, owner: string) {
  const params = new URLSearchParams();
  if (tab !== "today") {
    params.set("tab", tab);
  }
  if (owner) {
    params.set("owner", owner);
  }
  const query = params.toString();
  return query ? `/fixtures?${query}` : "/fixtures";
}

function ownerHref(owner: string, tab: string) {
  const params = new URLSearchParams();
  if (tab !== "today") {
    params.set("tab", tab);
  }
  if (owner) {
    params.set("owner", owner);
  }
  const query = params.toString();
  return query ? `/fixtures?${query}` : "/fixtures";
}

function TeamCrest({ team, code, logo }: { team: string; code?: string; logo?: string | null }) {
  return <TeamLogo team={team} code={code} logo={logo} className="fixture-crest" />;
}

function PotBadge({ pot }: { pot: number | null }) {
  return <span className="fixture-pot">{pot ? `Pot ${pot}` : "No pot"}</span>;
}

function SmallOwnerAvatar({ owner }: { owner: string }) {
  return <OwnerAvatar owner={owner} className="owner-avatar-small" />;
}

function OwnersBand({ fixture }: { fixture: EnrichedFixture }) {
  if (fixture.isSelfMatch) {
    return (
        <div className="fixture-owner-band self">
        <SmallOwnerAvatar owner={fixture.homeOwner} />
        <div>
          <strong>Friendly Fire</strong>
          <span>{fixture.homeOwner} owns both</span>
        </div>
      </div>
    );
  }

  if (fixture.isOwnerVsOwner) {
    return (
      <div className="fixture-owner-band battle">
        <div>
          <SmallOwnerAvatar owner={fixture.homeOwner} />
          <span>{fixture.homeOwner}</span>
        </div>
        <div></div>
        <div>
          <span>{fixture.awayOwner}</span>
          <SmallOwnerAvatar owner={fixture.awayOwner} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixture-owner-row">
      <div>
        <SmallOwnerAvatar owner={fixture.homeOwner} />
        <span>{fixture.homeOwner || "Unassigned"}</span>
      </div>
      <span>v</span>
      <div>
        <span>{fixture.awayOwner || "Unassigned"}</span>
        <SmallOwnerAvatar owner={fixture.awayOwner} />
      </div>
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: EnrichedFixture }) {
  return (
    <article className={`fixture-card ${fixture.status} ${fixture.isOwnerVsOwner ? "owner-battle" : ""}`}>
      <div className={fixture.status === "live" ? "fixture-status live" : "fixture-status"}>
        {fixture.status === "live" ? <span className="live-pulse-dot" /> : null}
        <span>{fixture.status === "scheduled" ? fixture.readableKickoff : statusLabel(fixture)}</span>
      </div>

      <div className="fixture-teams">
        <div className="fixture-team">
          <TeamCrest team={fixture.homeTeam} code={fixture.homeTeamCode ?? fixture.homeCode} logo={fixture.homeTeamLogo ?? fixture.homeLogo} />
          <strong>{teamCode(fixture.homeTeam, fixture.homeTeamCode ?? fixture.homeCode)}</strong>
          <PotBadge pot={fixture.homePot} />
        </div>

        <div className="fixture-score">
          <strong>{scoreLabel(fixture)}</strong>
          <span>{fixture.stage}</span>
        </div>

        <div className="fixture-team">
          <TeamCrest team={fixture.awayTeam} code={fixture.awayTeamCode ?? fixture.awayCode} logo={fixture.awayTeamLogo ?? fixture.awayLogo} />
          <strong>{teamCode(fixture.awayTeam, fixture.awayTeamCode ?? fixture.awayCode)}</strong>
          <PotBadge pot={fixture.awayPot} />
        </div>
      </div>

      <OwnersBand fixture={fixture} />
    </article>
  );
}

export default async function FixturesPage({
  searchParams
}: {
  searchParams?: Promise<FixturesSearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeTab = firstParam(params.tab) ?? "today";
  const activeOwner = firstParam(params.owner) ?? "";

  const [fixtures, owners] = await Promise.all([
    safe(getFixtures(), [] as EnrichedFixture[]),
    safe(getOwners(), [] as OwnerSummary[])
  ]);

  const counts = {
    today: fixtures.filter((fixture) => isToday(fixture.kickoff)).length,
    live: fixtures.filter((fixture) => fixture.status === "live").length,
    upcoming: fixtures.filter((fixture) => fixture.status === "scheduled").length,
    finished: fixtures.filter((fixture) => fixture.status === "finished").length,
    all: fixtures.length
  };

  const tabbedFixtures = fixtures.filter((fixture) => {
    if (activeTab === "live") {
      return fixture.status === "live";
    }
    if (activeTab === "upcoming") {
      return fixture.status === "scheduled";
    }
    if (activeTab === "finished") {
      return fixture.status === "finished";
    }
    if (activeTab === "all") {
      return true;
    }
    return isToday(fixture.kickoff);
  });

  const visibleFixtures = tabbedFixtures.filter((fixture) => {
    if (!activeOwner) {
      return true;
    }
    return fixture.homeOwner === activeOwner || fixture.awayOwner === activeOwner;
  });

  const tabs = [
    { id: "today", label: "Today", count: counts.today },
    { id: "live", label: "Live", count: counts.live },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "finished", label: "Finished", count: counts.finished },
    { id: "all", label: "All", count: counts.all }
  ];

  return (
    <main className="fixtures-shell">
      <section className="fixtures-header">
        <div>
          <h1>Matchday Fixtures</h1>
          <p>Track your teams, owners, pots, scores, and sweepstake grudges.</p>
        </div>

        <form className="owner-filter" action="/fixtures">
          <label htmlFor="owner">Filter by Owner</label>
          {activeTab !== "today" ? <input type="hidden" name="tab" value={activeTab} /> : null}
          <div className="owner-select-wrap">
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
            <select id="owner" name="owner" defaultValue={activeOwner} aria-label="Filter fixtures by owner">
              <option value="">All owners</option>
              {owners.map((owner) => (
                <option key={owner.owner} value={owner.owner}>
                  {owner.owner}
                </option>
              ))}
            </select>
            <button type="submit">Apply</button>
          </div>
        </form>
      </section>

      <nav className="fixtures-tabs" aria-label="Fixture filters">
        {tabs.map((tab) => (
          <Link key={tab.id} className={activeTab === tab.id ? "fixtures-tab active" : "fixtures-tab"} href={tabHref(tab.id, activeOwner)}>
            {tab.label} <span>({tab.count})</span>
          </Link>
        ))}
      </nav>

      {activeOwner ? (
        <div className="active-filter">
          Showing fixtures for <strong>{activeOwner}</strong>
          <Link href={ownerHref("", activeTab)}>Clear</Link>
        </div>
      ) : null}

      <section className="fixtures-grid" aria-label="Fixtures">
        {visibleFixtures.length ? (
          visibleFixtures.map((fixture) => <FixtureCard key={fixture.id} fixture={fixture} />)
        ) : (
          <div className="fixtures-empty">
            <span className="material-symbols-outlined" aria-hidden="true">
              calendar_today
            </span>
            <strong>No fixtures found</strong>
            <p>Try another tab or owner filter.</p>
          </div>
        )}
      </section>
    </main>
  );
}

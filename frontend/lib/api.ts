import type {
  DrawTeam,
  FixtureDetail,
  EnrichedFixture,
  Leaderboards,
  OwnerSummary,
  UnderdogTracker
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5001";

async function fetchJson<T>(path: string): Promise<T> {
  const urls = [`${API_BASE_URL}${path}`];
  if (API_BASE_URL.includes("localhost")) {
    urls.push(`${API_BASE_URL.replace("localhost", "127.0.0.1")}${path}`);
  }

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return response.json() as Promise<T>;
      }
      lastError = new Error(`API request failed: ${path} (${response.status})`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`API request failed: ${path}`);
    }
  }

  throw lastError ?? new Error(`API request failed: ${path}`);
}

export function getDraw() {
  return fetchJson<Record<string, DrawTeam[]>>("/api/draw");
}

export function getOwners() {
  return fetchJson<OwnerSummary[]>("/api/owners");
}

export function getOwner(owner: string) {
  return fetchJson<OwnerSummary>(`/api/owners/${encodeURIComponent(owner)}`);
}

export function getFixtures() {
  return fetchJson<EnrichedFixture[]>("/api/fixtures");
}

export function getFixtureDetail(fixtureId: string) {
  return fetchJson<FixtureDetail>(`/api/fixtures/${encodeURIComponent(fixtureId)}`);
}

export function getTodayFixtures() {
  return fetchJson<EnrichedFixture[]>("/api/fixtures/today");
}

export function getLiveFixtures() {
  return fetchJson<EnrichedFixture[]>("/api/fixtures/live");
}

export function getLeaderboards() {
  return fetchJson<Leaderboards>("/api/leaderboards");
}

export function getUnderdog() {
  return fetchJson<UnderdogTracker>("/api/underdog");
}

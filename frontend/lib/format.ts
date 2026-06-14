import type { EnrichedFixture, TeamStats } from "./types";

export function scoreLabel(fixture: EnrichedFixture) {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return "vs";
  }
  return `${fixture.homeScore}-${fixture.awayScore}`;
}

export function statusLabel(fixture: EnrichedFixture) {
  if (fixture.status === "live") {
    return `Live ${fixture.minute ? `${fixture.minute}'` : ""}`.trim();
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return "Scheduled";
}

export function recordLabel(item: { wins: number; draws: number; losses: number }) {
  return `${item.wins}W ${item.draws}D ${item.losses}L`;
}

export function teamLine(team: TeamStats | null) {
  if (!team) {
    return "No data yet";
  }
  return `${team.team} (${team.owner})`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function teamCode(team: string) {
  const words = team.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
}

export function aliveRatio(alive: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((alive / total) * 100)));
}

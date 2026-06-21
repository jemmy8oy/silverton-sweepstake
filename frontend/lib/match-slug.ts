import type { EnrichedFixture } from "./types";

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildMatchSlug(fixture: Pick<EnrichedFixture, "id" | "homeTeam" | "awayTeam">) {
  return `${slugPart(fixture.homeTeam)}-vs-${slugPart(fixture.awayTeam)}-${fixture.id}`;
}

export function extractMatchId(slug: string) {
  const match = slug.match(/(\d+)$/);
  return match?.[1] ?? null;
}

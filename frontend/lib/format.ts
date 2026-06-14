import type { EnrichedFixture, TeamStats } from "./types";

const TEAM_CODE_BY_NAME: Record<string, string> = {
  Algeria: "ALG",
  Argentina: "ARG",
  Australia: "AUS",
  Austria: "AUT",
  Belgium: "BEL",
  "Bosnia and Herzegovina": "BIH",
  Brazil: "BRA",
  Canada: "CAN",
  "Cape Verde": "CPV",
  Colombia: "COL",
  Croatia: "CRO",
  Curacao: "CUW",
  "Czech Republic": "CZE",
  "DR Congo": "COD",
  Ecuador: "ECU",
  Egypt: "EGY",
  England: "ENG",
  France: "FRA",
  Germany: "GER",
  Ghana: "GHA",
  Haiti: "HAI",
  Iran: "IRN",
  Iraq: "IRQ",
  "Ivory Coast": "CIV",
  Japan: "JPN",
  Jordan: "JOR",
  Mexico: "MEX",
  Morocco: "MAR",
  Netherlands: "NED",
  "New Zealand": "NZL",
  Norway: "NOR",
  Panama: "PAN",
  Paraguay: "PAR",
  Portugal: "POR",
  Qatar: "QAT",
  "Saudi Arabia": "KSA",
  Scotland: "SCO",
  Senegal: "SEN",
  "South Africa": "RSA",
  "South Korea": "KOR",
  Spain: "ESP",
  Sweden: "SWE",
  Switzerland: "SUI",
  Tunisia: "TUN",
  Turkey: "TUR",
  "United States": "USA",
  Uruguay: "URU",
  Uzbekistan: "UZB"
};

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

export function teamCode(team: string, code?: string) {
  if (code) {
    return code.toUpperCase();
  }
  if (TEAM_CODE_BY_NAME[team]) {
    return TEAM_CODE_BY_NAME[team];
  }
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

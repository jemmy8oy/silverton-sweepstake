export type MatchEvent = {
  team: string;
  type: "goal" | "red_card" | string;
  minute: number;
  player?: string;
};

export type FixtureStatus = "scheduled" | "live" | "finished";

export type Fixture = {
  id: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
  minute?: number | string;
  stage: string;
  group?: string;
  events?: MatchEvent[];
};

export type EnrichedFixture = Fixture & {
  homeOwner: string;
  awayOwner: string;
  homePot: number | null;
  awayPot: number | null;
  isOwnerVsOwner: boolean;
  isSelfMatch: boolean;
  displayTitle: string;
  readableKickoff: string;
};

export type TeamStats = {
  team: string;
  owner: string;
  pot: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  redCards: number;
  furthestStage: string;
  furthestStageRank: number;
  alive: boolean;
};

export type DrawTeam = {
  team: string;
  pot: number;
};

export type OwnerTeam = DrawTeam & {
  stats: TeamStats;
  alive: boolean;
};

export type OwnerSummary = {
  owner: string;
  teamCount: number;
  teams: OwnerTeam[];
  teamsByPot: Record<string, string[]>;
  teamsStillAlive: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  upcomingMatches: EnrichedFixture[];
  liveMatches: EnrichedFixture[];
  completedResults: EnrichedFixture[];
  headToHeads: EnrichedFixture[];
  bestTeam: TeamStats | null;
  worstTeam: TeamStats | null;
};

export type UnderdogTracker = {
  leader: TeamStats | null;
  isSplit: boolean;
  splitWith: TeamStats[];
  standings: TeamStats[];
  rules: string[];
};

export type Leaderboards = {
  overall: OwnerSummary[];
  underdog: UnderdogTracker;
  mostGoalsScored: TeamStats[];
  mostGoalsConceded: TeamStats[];
  mostRedCards: TeamStats[];
  worstPerformingTeam: TeamStats[];
  teamsStillAliveByOwner: Array<{ owner: string; teamsStillAlive: number; teamCount: number }>;
};

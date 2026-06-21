export type MatchEvent = {
  team: string;
  teamCode?: string;
  teamLogo?: string | null;
  type: "goal" | "own_goal" | "red_card" | "yellow_card" | "sub_on" | "sub_off" | string;
  minute: number;
  player?: string;
};

export type FixtureStatus = "scheduled" | "live" | "finished";

export type Fixture = {
  id: string;
  kickoff: string;
  homeTeam: string;
  homeCode?: string;
  homeLogo?: string | null;
  awayTeam: string;
  awayCode?: string;
  awayLogo?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
  minute?: number | string;
  stage: string;
  group?: string;
  events?: MatchEvent[];
};

export type MatchLineupPlayer = {
  id?: string;
  name: string;
  shortName?: string;
  jersey?: string;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  formationPlace?: string | null;
  position?: string;
  positionCode?: string;
};

export type TeamLineup = {
  team: string;
  teamCode?: string;
  teamLogo?: string | null;
  formation?: string | null;
  winner?: boolean | null;
  starters: MatchLineupPlayer[];
  bench: MatchLineupPlayer[];
};

export type FixtureDetail = {
  fixture: EnrichedFixture;
  lineups: Partial<Record<"home" | "away", TeamLineup>>;
};

export type EnrichedFixture = Fixture & {
  homeTeamCode?: string;
  homeTeamLogo?: string | null;
  awayTeamCode?: string;
  awayTeamLogo?: string | null;
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
  code?: string;
  logo?: string | null;
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
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  furthestStage: string;
  furthestStageRank: number;
  alive: boolean;
};

export type DrawTeam = {
  team: string;
  code?: string;
  logo?: string | null;
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
  yellowCards: number;
  redCards: number;
  ownGoals: number;
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
  firstEliminatedTeam: TeamStats | null;
  wallOfShame: Array<{
    owner: string;
    exits: number;
    redCards: number;
    ownGoals: number;
    totalShots: number;
  }>;
  teamsStillAliveByOwner: Array<{ owner: string; teamsStillAlive: number; teamCount: number }>;
};

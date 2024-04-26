/**
 * Player list from keystone
 */
export interface Player {
  espn_id: number
  name: string
  team: string
  position: Position
  positionWeight: number
  isIrEligible: boolean
  injuryStatus: string
  positionRank: number
  overallRank: number
  seasonOutlook: string
  outlooksByWeek: JSON
  isRookie: boolean
  fullStats: JSON
  pointsLastYear: number
  pointsThisYear: number
  pointsThisYearProj: number
  pointsThisWeekProj: number
  contract: Contract
}

export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "LB" | "DE" | "DT" | "S" | "CB";

type ID = string | number;
/**
 * Contract list from keystone
 */
export interface Contract {
  id: ID
  node_id: number
  salary: number
  years: number
  status: string
  team: Team
  player: Player
  needsAttention: boolean
  isFranchiseTagged: boolean
}

/**
 * Team list from keystone
 */
export interface Team {
  id: ID
  espn_id:number
  name: string
  logo: string
  abbreviation: string
  projectedRank:number
  playoffSeed:number
  wins:number
  losses:number
  ties:number
  pointsFor:number
  pointsAgainst:number
  percentage:number
  gamesBack:number
  streakLength:number
  streakType: string
  contractTotals: {
    salary: number
    years: number
    active: number
    dts: number
    ir: number
    waived: number
  }
  owner: User
  contracts: Contract[]
  contractsCount:number
}

/**
 * User list from keystone
 */
export interface User {
  id: ID
  name: string
  email: string
  password: string
  team: Team
  roles: string
}

/**
 * Bid list from keystone
 */
export interface Bid {
  id: ID
  team: Team
  player: Player
  salary:number
  years:number
  is_dts: boolean
}

/**
 * AuthenticatedUser schema from keystone
 */
export type AuthenticatedUser = User

export interface RowAction {
  name: string;
  fn: () => void;
}

export interface RowData {
  cells: Array<string|number|boolean>;
  actions: RowAction[];
}

export interface TableData {
  headers: string[]
  content: RowData[];
  actions?: RowAction[];
}


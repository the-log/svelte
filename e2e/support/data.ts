// Fixture data for the e2e GraphQL mock. Everything is fictional; salaries are
// in cents (formatMoney divides by 100), matching the real API.

export interface MockTeam {
	id: string;
	espn_id: number;
	name: string;
	abbreviation: string;
}

export const teams = {
	scranton: { id: 'team-1', espn_id: 1, name: 'Scranton Stranglers', abbreviation: 'SCR' },
	nashville: { id: 'team-2', espn_id: 2, name: 'Nashville Hounds', abbreviation: 'NSH' },
	portland: { id: 'team-3', espn_id: 3, name: 'Portland Pines', abbreviation: 'PDX' }
} satisfies Record<string, MockTeam>;

export const users = {
	owner: { id: 'user-1', name: 'Sam Owner', isAdmin: false, team: teams.scranton },
	admin: { id: 'user-2', name: 'Alex Admin', isAdmin: true, team: teams.nashville }
};

export type MockUser = (typeof users)[keyof typeof users];

// The head of bid_deadlines drives the free-agency countdown; keep it in the
// future so the clock shows a real value.
export const nextBidDeadline = () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

export interface MockPlayer {
	espn_id: number;
	name: string;
	team: string;
	position: string;
	positionWeight: number;
	positionRank: number;
	overallRank: number;
	positionRankProj: number;
	overallRankProj: number;
	pointsThisYear: number;
	pointsLastYear: number;
	pointsThisYearProj: number;
	pointsThisWeekProj: number;
	injuryStatus: string;
	isRookie: boolean;
	contract: {
		id: string;
		team: { id: string; name: string; abbreviation: string };
		salary: number;
		years: number;
		status: string;
	} | null;
}

const positionWeights: Record<string, number> = {
	QB: 1,
	RB: 2,
	WR: 3,
	TE: 4,
	K: 5,
	LB: 6,
	DE: 7,
	DT: 7,
	CB: 8,
	S: 8
};

function player(overrides: Partial<MockPlayer> & { espn_id: number; name: string }): MockPlayer {
	const position = overrides.position ?? 'RB';
	return {
		team: 'PHI',
		position,
		positionWeight: positionWeights[position],
		positionRank: 10,
		overallRank: 50,
		positionRankProj: 10,
		overallRankProj: 50,
		pointsThisYear: 100,
		pointsLastYear: 90,
		pointsThisYearProj: 110,
		pointsThisWeekProj: 8,
		injuryStatus: 'ACTIVE',
		isRookie: false,
		contract: null,
		...overrides
	};
}

// 30 players → two pages at the UI's page size of 25. The named players carry
// the interesting traits; fillers exist to exercise pagination. Fillers never
// play QB/DE/DT so position-filter assertions stay exact.
export const players: MockPlayer[] = [
	player({
		espn_id: 101,
		name: 'Aaron Ashford',
		team: 'PHI',
		position: 'QB',
		positionRank: 2,
		overallRank: 4,
		positionRankProj: 1,
		overallRankProj: 2,
		pointsThisYearProj: 320,
		pointsThisWeekProj: 24,
		contract: { id: 'c-active-1', team: teams.scranton, salary: 15000, years: 3, status: 'active' }
	}),
	player({
		espn_id: 102,
		name: 'Blake Bradford',
		team: 'DAL',
		position: 'RB',
		positionRankProj: 3,
		overallRankProj: 7,
		pointsThisYearProj: 280,
		pointsThisWeekProj: 18,
		isRookie: true
	}),
	player({
		espn_id: 103,
		name: 'Carter Callahan',
		team: 'KC',
		position: 'WR',
		positionRankProj: 4,
		overallRankProj: 11,
		pointsThisYearProj: 260,
		pointsThisWeekProj: 16,
		injuryStatus: 'QUESTIONABLE',
		contract: { id: 'c-nsh-1', team: teams.nashville, salary: 11000, years: 2, status: 'active' }
	}),
	player({
		espn_id: 104,
		name: 'Dexter Dawson',
		team: 'SEA',
		position: 'TE',
		positionRankProj: 6,
		overallRankProj: 40,
		pointsThisYearProj: 190,
		pointsThisWeekProj: 11
	}),
	player({
		espn_id: 105,
		name: 'Elliot Eastwood',
		team: 'BUF',
		position: 'DE',
		positionRankProj: 2,
		overallRankProj: 30,
		pointsThisYearProj: 150,
		pointsThisWeekProj: 30
	}),
	player({
		espn_id: 106,
		name: 'Felix Fontaine',
		team: 'GB',
		position: 'DT',
		positionRankProj: 5,
		overallRankProj: 60,
		pointsThisYearProj: 140,
		pointsThisWeekProj: 9,
		contract: { id: 'c-pdx-1', team: teams.portland, salary: 4000, years: 1, status: 'dts' }
	}),
	...Array.from({ length: 24 }, (_, i) =>
		player({
			espn_id: 200 + i,
			name: `Filler Player ${String(i + 1).padStart(2, '0')}`,
			team: ['NYG', 'CHI', 'DEN', 'MIA'][i % 4],
			position: ['RB', 'WR', 'TE', 'K', 'LB', 'CB'][i % 6],
			positionRankProj: 20 + i,
			overallRankProj: 100 + i,
			pointsThisYearProj: 120 - i,
			pointsThisWeekProj: 6,
			isRookie: i === 3
		})
	)
];

export interface MockContract {
	id: string;
	status: string;
	salary: number;
	years: number;
	needsAttention: boolean;
	player: {
		espn_id: number;
		name: string;
		team: string;
		position: string;
		positionWeight: number;
		injuryStatus: string;
		positionRankProj: number;
		pointsThisYearProj: number;
	};
}

function rosterContract(
	id: string,
	status: string,
	salary: number,
	years: number,
	p: { espn_id: number; name: string; team: string; position: string },
	extra: Partial<MockContract> & { injuryStatus?: string } = {}
): MockContract {
	const { injuryStatus = 'ACTIVE', ...rest } = extra;
	return {
		id,
		status,
		salary,
		years,
		needsAttention: false,
		player: {
			...p,
			positionWeight: positionWeights[p.position],
			injuryStatus,
			positionRankProj: 5,
			pointsThisYearProj: 150
		},
		...rest
	};
}

// Roster for the logged-in owner's team (Scranton). Covers all four status
// buckets plus the traits the Actions menu keys off of (injury status,
// needsAttention, dts, waived).
export const scrantonRoster: MockContract[] = [
	rosterContract('c-active-1', 'active', 15000, 3, {
		espn_id: 101,
		name: 'Aaron Ashford',
		team: 'PHI',
		position: 'QB'
	}),
	rosterContract(
		'c-active-2',
		'active',
		9000,
		2,
		{ espn_id: 110, name: 'Grady Gibson', team: 'DET', position: 'RB' },
		{ injuryStatus: 'QUESTIONABLE', needsAttention: true }
	),
	rosterContract(
		'c-active-3',
		'active',
		7500,
		1,
		{ espn_id: 111, name: 'Hollis Hart', team: 'LAR', position: 'WR' },
		{ injuryStatus: 'OUT' }
	),
	rosterContract('c-dts-1', 'dts', 300, 1, {
		espn_id: 112,
		name: 'Ivan Ingram',
		team: 'TEN',
		position: 'TE'
	}),
	rosterContract(
		'c-ir-1',
		'ir',
		2000,
		2,
		{ espn_id: 113, name: 'Jonas Jett', team: 'CIN', position: 'LB' },
		{ injuryStatus: 'INJURY_RESERVE' }
	),
	rosterContract('c-waived-1', 'waived', 1200, 1, {
		espn_id: 114,
		name: 'Kellen Knox',
		team: 'ATL',
		position: 'CB'
	})
];

export const nashvilleRoster: MockContract[] = [
	rosterContract('c-nsh-1', 'active', 11000, 2, {
		espn_id: 103,
		name: 'Carter Callahan',
		team: 'KC',
		position: 'WR'
	}),
	rosterContract('c-nsh-2', 'active', 6400, 1, {
		espn_id: 120,
		name: 'Miles Marsh',
		team: 'MIN',
		position: 'QB'
	})
];

export const contractTotals = {
	scranton: { salary: 91000, years: 78, active: 38, dts: 10, ir: 1, waived: 2 },
	nashville: { salary: 105000, years: 105, active: 41, dts: 12, ir: 1, waived: 0 },
	portland: { salary: 65000, years: 60, active: 30, dts: 8, ir: 0, waived: 1 }
};

// Ordered by percentage desc, as the real query returns them.
export const leagueStandings = [
	{
		name: teams.nashville.name,
		abbreviation: teams.nashville.abbreviation,
		logo: '',
		wins: 10,
		losses: 3,
		ties: 0,
		percentage: 0.769,
		contractTotals: contractTotals.nashville,
		owner: { name: users.admin.name }
	},
	{
		name: teams.scranton.name,
		abbreviation: teams.scranton.abbreviation,
		logo: '',
		wins: 8,
		losses: 4,
		ties: 1,
		percentage: 0.654,
		contractTotals: contractTotals.scranton,
		owner: { name: users.owner.name }
	},
	{
		name: teams.portland.name,
		abbreviation: teams.portland.abbreviation,
		logo: '',
		wins: 4,
		losses: 9,
		ties: 0,
		percentage: 0.308,
		contractTotals: contractTotals.portland,
		owner: { name: 'Riley Reeves' }
	}
];

// Restricted free agents, one franchise-tagged. Ranks are distinct enough that
// each sort mode yields a different first row.
export const rfaContracts = [
	{
		id: 'rfa-1',
		status: 'rfa',
		salary: 12000,
		years: 0,
		isFranchiseTagged: true,
		team: { name: teams.nashville.name, abbreviation: 'NSH', espn_id: 2 },
		player: {
			espn_id: 301,
			name: 'Marcus Monroe',
			team: 'LAC',
			position: 'QB',
			positionWeight: 1,
			injuryStatus: 'ACTIVE',
			positionRankProj: 5,
			overallRankProj: 40
		}
	},
	{
		id: 'rfa-2',
		status: 'rfa',
		salary: 8000,
		years: 0,
		isFranchiseTagged: false,
		team: { name: teams.scranton.name, abbreviation: 'SCR', espn_id: 1 },
		player: {
			espn_id: 302,
			name: 'Nolan Nash',
			team: 'HOU',
			position: 'RB',
			positionWeight: 2,
			injuryStatus: 'ACTIVE',
			positionRankProj: 8,
			overallRankProj: 22
		}
	},
	{
		id: 'rfa-3',
		status: 'rfa',
		salary: 6000,
		years: 0,
		isFranchiseTagged: false,
		team: { name: teams.portland.name, abbreviation: 'PDX', espn_id: 3 },
		player: {
			espn_id: 303,
			name: 'Omar Otis',
			team: 'JAX',
			position: 'WR',
			positionWeight: 3,
			injuryStatus: 'QUESTIONABLE',
			positionRankProj: 12,
			overallRankProj: 55
		}
	},
	{
		id: 'rfa-4',
		status: 'rfa',
		salary: 4000,
		years: 0,
		isFranchiseTagged: false,
		team: { name: teams.portland.name, abbreviation: 'PDX', espn_id: 3 },
		player: {
			espn_id: 304,
			name: 'Pierce Palmer',
			team: 'NO',
			position: 'QB',
			positionWeight: 1,
			injuryStatus: 'ACTIVE',
			positionRankProj: 9,
			overallRankProj: 80
		}
	}
];

// Free-agency bids. Pending bids (locked: null) belong to the owner's team;
// published bids span two auction dates to exercise the date grouping.
export const pendingBids = [
	{
		id: 'bid-1',
		salary: 500,
		years: 2,
		team: { name: teams.scranton.name, id: teams.scranton.id },
		player: { name: 'Quincy Quill', position: 'WR', team: 'ARI', id: 'p-401' }
	},
	{
		id: 'bid-2',
		salary: 300,
		years: 1,
		team: { name: teams.scranton.name, id: teams.scranton.id },
		player: { name: 'Ruben Royce', position: 'RB', team: 'CLE', id: 'p-402' }
	}
];

export const publishedBids = [
	{
		locked: '2026-07-03T17:00:00.000Z',
		salary: 400,
		years: 1,
		bid_order: 1,
		eval_order: 1,
		team: { name: teams.portland.name },
		player: { espn_id: 313, name: 'Ulysses Underwood', position: 'LB', team: 'PIT' }
	},
	{
		locked: '2026-07-10T17:00:00.000Z',
		salary: 900,
		years: 3,
		bid_order: 1,
		eval_order: 1,
		team: { name: teams.nashville.name },
		player: { espn_id: 311, name: 'Silas Stone', position: 'TE', team: 'NYJ' }
	},
	{
		locked: '2026-07-10T17:00:00.000Z',
		salary: 700,
		years: 2,
		bid_order: 2,
		eval_order: 1,
		team: { name: teams.scranton.name },
		player: { espn_id: 311, name: 'Silas Stone', position: 'TE', team: 'NYJ' }
	},
	{
		locked: '2026-07-10T17:00:00.000Z',
		salary: 200,
		years: 1,
		bid_order: 1,
		eval_order: 2,
		team: { name: teams.portland.name },
		player: { espn_id: 312, name: 'Titus Turner', position: 'K', team: 'WAS' }
	}
];

// Rulebook chapters served from the mocked GitHub API.
export const rulebookToc = [
	{
		name: '01-scoring.md',
		download_url: 'https://raw.githubusercontent.com/the-log/rulebook/main/01-scoring.md'
	},
	{
		name: '02-contracts.md',
		download_url: 'https://raw.githubusercontent.com/the-log/rulebook/main/02-contracts.md'
	},
	{
		name: '03-trades.md',
		download_url: 'https://raw.githubusercontent.com/the-log/rulebook/main/03-trades.md'
	}
];

export const rulebookChapters: Record<string, string> = {
	'01-scoring.md':
		'## Scoring\n\nPoints are awarded weekly.\n\n- Passing touchdowns: 4 points\n- Rushing touchdowns: 6 points\n',
	'02-contracts.md': '## Contracts\n\nEvery roster spot is a contract with a salary and a term.\n',
	'03-trades.md': '## Trades\n\nTrades must be approved by the commissioner.\n'
};

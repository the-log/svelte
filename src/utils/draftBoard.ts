import type { Position } from '../types/defs';

/** NFL regular season length, used for the per-game dropoff figure. */
export const GAMES_PER_SEASON = 17;

/** Contract statuses that keep a player on a team's roster. */
const ROSTER_STATUSES = ['active', 'dts', 'ir'];

/**
 * Statuses that make a player unavailable for the draft. Waived contracts are
 * deliberately absent: a waived player is dead cap for the old team but a free
 * agent on the board (same semantics as the players page availability filter).
 */
const UNAVAILABLE_STATUSES = [...ROSTER_STATUSES, 'rfa'];

/** Player shape returned by the draft-board query. */
export interface DraftPlayer {
	espn_id: number;
	name: string;
	team: string;
	position: Position;
	positionWeight: number;
	injuryStatus: string;
	positionRankProj: number | null;
	overallRankProj: number | null;
	pointsLastYear: number | null;
	pointsThisYearProj: number | null;
	contract: {
		id: string | number;
		status: string;
		salary: number;
		years: number;
		isFranchiseTagged: boolean;
		team: { id: string | number; name: string; abbreviation: string };
	} | null;
}

export type DraftGroup = 'roster' | 'rfa' | 'fa';

export interface DraftBoardRow extends DraftPlayer {
	group: DraftGroup;
	/** Projected-points gap to the row above in the same position group; null for the group leader. */
	dropoffYear: number | null;
	dropoffPerGame: number | null;
	/** Cents per projected point; null without a live contract or projection. */
	centsPerPoint: number | null;
}

export interface DraftBoardGroup {
	weight: number;
	label: string;
	rows: DraftBoardRow[];
}

/**
 * Build the PlayerWhereInput for the draft board: RFA contracts, the owner's
 * roster, and available players (no contract, or only a waived one). Until the
 * projections toggle is flipped, available players with no projected points are
 * filtered out server-side — they're practice-squad noise on a big board.
 */
export function buildDraftBoardWhere(
	teamID: string | number | null | undefined,
	includeUnprojected: boolean
) {
	const available: Record<string, unknown> = {
		NOT: { contract: { status: { in: UNAVAILABLE_STATUSES } } }
	};
	if (!includeUnprojected) {
		available.pointsThisYearProj = { gt: 0 };
	}

	const OR: Record<string, unknown>[] = [{ contract: { status: { equals: 'rfa' } } }, available];

	if (teamID != null && teamID !== '') {
		OR.push({
			contract: {
				team: { id: { equals: teamID } },
				status: { in: ROSTER_STATUSES }
			}
		});
	}

	return { OR };
}

export function classifyPlayer(player: DraftPlayer): DraftGroup {
	const status = player.contract?.status;
	if (status === 'rfa') return 'rfa';
	if (status && ROSTER_STATUSES.includes(status)) return 'roster';
	return 'fa';
}

// Position groups share a weight when they compete for the same roster slot
// (DE/DT, S/CB), so labels are looked up by the set of positions present.
const GROUP_LABELS: Array<[string[], string]> = [
	[['QB'], 'Quarterbacks'],
	[['RB'], 'Running Backs'],
	[['WR'], 'Wide Receivers'],
	[['TE'], 'Tight Ends'],
	[['K'], 'Kickers'],
	[['LB'], 'Linebackers'],
	[['DE', 'DT'], 'Defensive Line'],
	[['CB', 'S'], 'Defensive Backs']
];

function groupLabel(positions: Set<string>): string {
	for (const [members, label] of GROUP_LABELS) {
		if ([...positions].every((p) => members.includes(p))) return label;
	}
	return [...positions].sort().join(' / ');
}

const rankOrLast = (rank: number | null | undefined) => (rank ? rank : Number.MAX_SAFE_INTEGER);

/**
 * Sort players by positionWeight then projected overall rank (unranked players
 * last), compute the per-row dropoff and $/pt values, and split the result
 * into position groups ready to render.
 */
export function buildDraftBoard(players: DraftPlayer[]): DraftBoardGroup[] {
	const sorted = [...players].sort(
		(a, b) =>
			a.positionWeight - b.positionWeight ||
			rankOrLast(a.overallRankProj) - rankOrLast(b.overallRankProj) ||
			(b.pointsThisYearProj ?? 0) - (a.pointsThisYearProj ?? 0) ||
			a.name.localeCompare(b.name)
	);

	const groups: DraftBoardGroup[] = [];

	for (const player of sorted) {
		let group = groups.at(-1);
		if (!group || group.weight !== player.positionWeight) {
			group = { weight: player.positionWeight, label: '', rows: [] };
			groups.push(group);
		}

		const prev = group.rows.at(-1);
		const dropoffYear = prev
			? (prev.pointsThisYearProj ?? 0) - (player.pointsThisYearProj ?? 0)
			: null;

		const { contract, pointsThisYearProj } = player;
		const countsAgainstCap = contract && UNAVAILABLE_STATUSES.includes(contract.status);
		const centsPerPoint =
			countsAgainstCap && pointsThisYearProj ? contract.salary / pointsThisYearProj : null;

		group.rows.push({
			...player,
			group: classifyPlayer(player),
			dropoffYear,
			dropoffPerGame: dropoffYear === null ? null : dropoffYear / GAMES_PER_SEASON,
			centsPerPoint
		});
	}

	for (const group of groups) {
		group.label = groupLabel(new Set(group.rows.map((row) => row.position)));
	}

	return groups;
}

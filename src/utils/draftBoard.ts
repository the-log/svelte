import type { Position } from '../types/defs';

/** NFL regular season length, used for the per-game dropoff figure. */
export const GAMES_PER_SEASON = 17;

/** Contract statuses that keep a player on a team's roster. */
const ROSTER_STATUSES = ['active', 'dts', 'ir'];

/** Contract statuses whose salary is a live commitment, worth a $/pt figure. */
const CAP_STATUSES = [...ROSTER_STATUSES, 'rfa'];

/** Free agents projected under this are deep-pool noise, hidden by default. */
export const PROJECTION_FLOOR = 50;

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

/** rfa-team: an RFA contract held by the owner's own team. */
export type DraftGroup = 'roster' | 'rfa-team' | 'rfa' | 'fa';

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
 * PlayerWhereInput for the board's static pool: strictly uncontracted players
 * (waived players carry a contract, so another team's waived dead cap stays
 * off the board). This pool doesn't move during the RFA auction — all the
 * action is rfa → active — so it's fetched once per visit. Until the deep-pool
 * toggle is flipped, free agents under PROJECTION_FLOOR are filtered out
 * server-side.
 */
export function buildAvailableWhere(includeDeepPool: boolean) {
	const available: Record<string, unknown> = { contract: null };
	if (!includeDeepPool) {
		available.pointsThisYearProj = { gt: PROJECTION_FLOOR };
	}

	return { OR: [available] };
}

/**
 * PlayerWhereInput for the board's live pool: RFA contracts plus everything on
 * the owner's team, waived dead cap included. This is the small, fast-moving
 * slice — auction bids convert these rows from rfa to active — so it's the
 * one worth polling frequently.
 */
export function buildLiveWhere(teamID: string | number | null | undefined) {
	const OR: Record<string, unknown>[] = [{ contract: { status: { equals: 'rfa' } } }];

	if (teamID != null && teamID !== '') {
		OR.push({ contract: { team: { id: { equals: teamID } } } });
	}

	return { OR };
}

export function classifyPlayer(player: DraftPlayer, teamID?: string | number | null): DraftGroup {
	const { contract } = player;
	if (contract?.status === 'rfa') {
		const isOwn = teamID != null && String(contract.team.id) === String(teamID);
		return isOwn ? 'rfa-team' : 'rfa';
	}
	if (contract && ROSTER_STATUSES.includes(contract.status)) return 'roster';
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
 * Sort players by positionWeight then projected position rank (unranked players
 * last), compute the per-row dropoff and $/pt values, and split the result
 * into position groups ready to render.
 */
export function buildDraftBoard(
	players: DraftPlayer[],
	teamID?: string | number | null
): DraftBoardGroup[] {
	const sorted = [...players].sort(
		(a, b) =>
			a.positionWeight - b.positionWeight ||
			rankOrLast(a.positionRankProj) - rankOrLast(b.positionRankProj) ||
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
		const countsAgainstCap = contract && CAP_STATUSES.includes(contract.status);
		const centsPerPoint =
			countsAgainstCap && pointsThisYearProj ? contract.salary / pointsThisYearProj : null;

		group.rows.push({
			...player,
			group: classifyPlayer(player, teamID),
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

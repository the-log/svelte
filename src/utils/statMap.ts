import type { Position } from '../types/defs';

/**
 * Player.fullStats holds ESPN fantasy stat sets whose `stats` objects are keyed
 * by ESPN's integer stat IDs. The IDs match ESPN's own scoring-format map
 * (mirrored in the espn-api project's SETTINGS_SCORING_FORMAT_MAP) and were
 * verified against ESPN's labeled site API for the 2025 season.
 *
 * IDs deliberately not displayed: 5-14, 27-34, 47-52, 54-55, 110-111, 217-234
 * (per-increment scoring counters), and 100 (sacks doubled for half-sack
 * scoring).
 */

export interface StatSet {
	id?: string;
	title?: string;
	seasonId?: number;
	appliedTotal?: number;
	appliedAverage?: number;
	stats?: Record<string, number>;
}

export interface FullStats {
	lastYearActual?: StatSet;
	thisYearActual?: StatSet;
	thisYearProjected?: StatSet;
	thisWeekProjected?: StatSet;
}

export type StatSetKey = keyof FullStats;

/** 'fraction' renders "a / b", 'record' renders "w-l" or "w-l-t". */
type StatFormat = 'int' | 'dec1' | 'pct' | 'fraction' | 'record';

export interface StatRow {
	label: string;
	ids: number[];
	format?: StatFormat;
}

export interface StatGroup {
	title: string;
	rows: StatRow[];
}

export interface DisplayRow {
	label: string;
	value: string;
}

export interface DisplayGroup {
	title: string;
	rows: DisplayRow[];
}

/** Display order of the stat sets scraped into Player.fullStats. */
export const statSetMeta: { key: StatSetKey; label: string }[] = [
	{ key: 'thisYearActual', label: 'This Year' },
	{ key: 'thisWeekProjected', label: 'This Week (Proj)' },
	{ key: 'thisYearProjected', label: 'This Year (Proj)' },
	{ key: 'lastYearActual', label: 'Last Year' }
];

const passing: StatGroup = {
	title: 'Passing',
	rows: [
		{ label: 'Comp / Att', ids: [1, 0], format: 'fraction' },
		{ label: 'Yards', ids: [3] },
		{ label: 'Touchdowns', ids: [4] },
		{ label: 'Interceptions', ids: [20] },
		{ label: 'Completion %', ids: [21], format: 'pct' },
		{ label: 'Yards / game', ids: [22], format: 'dec1' },
		{ label: 'First downs', ids: [211] },
		{ label: 'Times sacked', ids: [64] },
		{ label: '2-pt conversions', ids: [19] }
	]
};

const rushing: StatGroup = {
	title: 'Rushing',
	rows: [
		{ label: 'Attempts', ids: [23] },
		{ label: 'Yards', ids: [24] },
		{ label: 'Touchdowns', ids: [25] },
		{ label: 'Yards / attempt', ids: [39], format: 'dec1' },
		{ label: 'Yards / game', ids: [40], format: 'dec1' },
		{ label: 'First downs', ids: [212] },
		{ label: '2-pt conversions', ids: [26] }
	]
};

const receiving: StatGroup = {
	title: 'Receiving',
	rows: [
		// 41 (receptions) is absent from projected sets; 53 (ESPN's per-reception
		// scoring counter) duplicates it in actuals and is present everywhere.
		{ label: 'Rec / Targets', ids: [53, 58], format: 'fraction' },
		{ label: 'Yards', ids: [42] },
		{ label: 'Touchdowns', ids: [43] },
		{ label: 'Yards / reception', ids: [60], format: 'dec1' },
		{ label: 'Yards after catch', ids: [59] },
		{ label: 'Yards / game', ids: [61], format: 'dec1' },
		{ label: 'First downs', ids: [213] },
		{ label: '2-pt conversions', ids: [44] }
	]
};

const kicking: StatGroup = {
	title: 'Kicking',
	rows: [
		{ label: 'FG made / att', ids: [83, 84], format: 'fraction' },
		{ label: 'FG under 40', ids: [80, 81], format: 'fraction' },
		{ label: 'FG 40-49', ids: [77, 78], format: 'fraction' },
		{ label: 'FG 50-59', ids: [198, 199], format: 'fraction' },
		{ label: 'FG 60+', ids: [201, 202], format: 'fraction' },
		{ label: 'XP made / att', ids: [86, 87], format: 'fraction' },
		{ label: 'Kicking points', ids: [158] }
	]
};

const defense: StatGroup = {
	title: 'Defense',
	rows: [
		{ label: 'Tackles', ids: [109] },
		{ label: 'Solo', ids: [108] },
		{ label: 'Assisted', ids: [107] },
		{ label: 'Sacks', ids: [99], format: 'dec1' },
		{ label: 'Stuffs', ids: [112], format: 'dec1' },
		{ label: 'Passes defensed', ids: [113] },
		{ label: 'Interceptions', ids: [95] },
		{ label: 'Forced fumbles', ids: [106] },
		{ label: 'Fumble recoveries', ids: [96] },
		{ label: 'Safeties', ids: [98] },
		{ label: 'Blocked kicks', ids: [97] },
		{ label: 'Return TDs', ids: [105] }
	]
};

const general: StatGroup = {
	title: 'General',
	rows: [
		{ label: 'Games played', ids: [210] },
		{ label: 'Fumbles', ids: [68] },
		{ label: 'Fumbles lost', ids: [72] },
		{ label: 'Turnovers', ids: [73] },
		{ label: 'Team record', ids: [155, 156, 157], format: 'record' }
	]
};

export const positionLayouts: Record<Position, StatGroup[]> = {
	QB: [passing, rushing, general],
	RB: [rushing, receiving, general],
	WR: [receiving, rushing, general],
	TE: [receiving, rushing, general],
	K: [kicking, general],
	DT: [defense, general],
	DE: [defense, general],
	LB: [defense, general],
	CB: [defense, general],
	S: [defense, general]
};

/** Round to one decimal, dropping a trailing ".0" (23 → "23", 3.5 → "3.5"). */
export function dec1(value: number): string {
	return (Math.round(value * 10) / 10).toString();
}

export function hasStats(set: StatSet | undefined): boolean {
	return Boolean(set?.stats && Object.keys(set.stats).length);
}

/**
 * Format one row against a stat set's `stats` object. Returns null when none
 * of the row's IDs are present — ESPN omits zero-valued keys, so an all-absent
 * row carries no information.
 */
export function formatStatRow(row: StatRow, stats: Record<string, number>): string | null {
	const values = row.ids.map((id) => stats[id]);

	if (values.every((value) => value === undefined)) return null;

	const numbers = values.map((value) => value ?? 0);

	switch (row.format ?? 'int') {
		case 'int':
			return Math.round(numbers[0]).toString();

		case 'dec1':
			return dec1(numbers[0]);

		case 'pct':
			// Stored as a 0-1 fraction (e.g. completion percentage).
			return `${dec1(numbers[0] * 100)}%`;

		case 'fraction':
			return numbers.map((value) => Math.round(value)).join(' / ');

		case 'record': {
			const [wins, losses, ties] = numbers.map((value) => Math.round(value));
			return ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
		}
	}
}

/**
 * The renderable stat groups for a position, with rows resolved against one
 * stat set. Rows without data are dropped; groups without rows are dropped.
 * Unknown positions yield nothing rather than throwing — callers pass
 * loosely-typed row data.
 */
export function getStatGroups(position: string, set: StatSet | undefined): DisplayGroup[] {
	const layout = positionLayouts[position as Position];
	if (!layout || !hasStats(set)) return [];

	const stats = (set as StatSet).stats as Record<string, number>;

	return layout
		.map(({ title, rows }) => ({
			title,
			rows: rows.flatMap((row) => {
				const value = formatStatRow(row, stats);
				return value === null ? [] : [{ label: row.label, value }];
			})
		}))
		.filter((group) => group.rows.length);
}

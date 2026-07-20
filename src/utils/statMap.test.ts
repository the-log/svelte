import { describe, it, expect } from 'vitest';
import { dec1, formatStatRow, getStatGroups, hasStats, type StatSet } from './statMap';

// Trimmed from real scraped fullStats.thisYearActual data (2025 season),
// cross-checked against ESPN's labeled site API.
const allen: StatSet = {
	appliedTotal: 454.4,
	appliedAverage: 26.72941176470588,
	stats: {
		'0': 460,
		'1': 319,
		'2': 141,
		'3': 3668,
		'4': 25,
		'19': 1,
		'20': 10,
		'21': 0.69347826,
		'22': 215.76470588,
		'23': 112,
		'24': 579,
		'25': 14,
		'39': 5.16964286,
		'40': 34.05882353,
		'64': 40,
		'68': 7,
		'72': 3,
		'73': 13,
		'155': 12,
		'156': 5,
		'210': 17,
		'211': 177,
		'212': 46
	}
};

const aubrey: StatSet = {
	stats: {
		'74': 11,
		'75': 17,
		'77': 10,
		'78': 10,
		'80': 15,
		'81': 15,
		'83': 36,
		'84': 42,
		'86': 47,
		'87': 48,
		'155': 7,
		'156': 9,
		'158': 155,
		'198': 8,
		'199': 13,
		'201': 3,
		'202': 4,
		'210': 17
	}
};

const baun: StatSet = {
	stats: {
		'95': 2,
		'96': 1,
		'99': 3.5,
		'106': 1,
		'107': 59,
		'108': 64,
		'109': 123,
		'112': 7.5,
		'113': 7,
		'155': 11,
		'156': 5,
		'210': 16
	}
};

const findRow = (position: Parameters<typeof getStatGroups>[0], set: StatSet, label: string) =>
	getStatGroups(position, set)
		.flatMap((group) => group.rows)
		.find((row) => row.label === label)?.value;

describe('dec1', () => {
	it('rounds to one decimal', () => {
		expect(dec1(34.05882353)).toBe('34.1');
	});

	it('drops a trailing .0', () => {
		expect(dec1(23)).toBe('23');
	});

	it('keeps meaningful halves', () => {
		expect(dec1(3.5)).toBe('3.5');
	});
});

describe('hasStats', () => {
	it('is false for undefined and for the empty sets the scraper stores', () => {
		expect(hasStats(undefined)).toBe(false);
		expect(hasStats({} as StatSet)).toBe(false);
		expect(hasStats({ stats: {} })).toBe(false);
	});

	it('is true when any keyed stat exists', () => {
		expect(hasStats(baun)).toBe(true);
	});
});

describe('formatStatRow', () => {
	it('returns null when every id is absent', () => {
		expect(formatStatRow({ label: 'Interceptions', ids: [20] }, {})).toBeNull();
	});

	it('treats a missing id as zero when a sibling id is present', () => {
		// A kicker with 60+ attempts but no makes: 201 is omitted by ESPN.
		expect(
			formatStatRow({ label: 'FG 60+', ids: [201, 202], format: 'fraction' }, { '202': 2 })
		).toBe('0 / 2');
	});

	it('rounds fractional projection values', () => {
		expect(
			formatStatRow(
				{ label: 'FG made / att', ids: [83, 84], format: 'fraction' },
				{ '83': 30.4, '84': 35.6 }
			)
		).toBe('30 / 36');
	});

	it('renders percentages stored as 0-1 fractions', () => {
		expect(
			formatStatRow({ label: 'Completion %', ids: [21], format: 'pct' }, { '21': 0.69347826 })
		).toBe('69.3%');
	});

	it('renders a team record with and without ties', () => {
		const row = { label: 'Team record', ids: [155, 156, 157], format: 'record' as const };
		expect(formatStatRow(row, { '155': 7, '156': 9 })).toBe('7-9');
		expect(formatStatRow(row, { '155': 7, '156': 9, '157': 1 })).toBe('7-9-1');
	});
});

describe('getStatGroups', () => {
	it('returns nothing for an empty stat set', () => {
		expect(getStatGroups('QB', {} as StatSet)).toEqual([]);
	});

	it('returns nothing for an unknown position', () => {
		expect(getStatGroups('', allen)).toEqual([]);
		expect(getStatGroups('P', allen)).toEqual([]);
	});

	it('maps QB passing keys to their verified meanings', () => {
		expect(findRow('QB', allen, 'Comp / Att')).toBe('319 / 460');
		expect(findRow('QB', allen, 'Yards')).toBe('3668');
		expect(findRow('QB', allen, 'Touchdowns')).toBe('25');
		expect(findRow('QB', allen, 'Interceptions')).toBe('10');
		expect(findRow('QB', allen, 'Times sacked')).toBe('40');
		expect(findRow('QB', allen, 'Team record')).toBe('12-5');
	});

	it('maps kicking distance splits', () => {
		expect(findRow('K', aubrey, 'FG made / att')).toBe('36 / 42');
		expect(findRow('K', aubrey, 'FG under 40')).toBe('15 / 15');
		expect(findRow('K', aubrey, 'FG 50-59')).toBe('8 / 13');
		expect(findRow('K', aubrey, 'FG 60+')).toBe('3 / 4');
		expect(findRow('K', aubrey, 'XP made / att')).toBe('47 / 48');
		expect(findRow('K', aubrey, 'Kicking points')).toBe('155');
	});

	it('maps IDP keys, keeping half-sack precision', () => {
		expect(findRow('LB', baun, 'Tackles')).toBe('123');
		expect(findRow('LB', baun, 'Solo')).toBe('64');
		expect(findRow('LB', baun, 'Assisted')).toBe('59');
		expect(findRow('LB', baun, 'Sacks')).toBe('3.5');
		expect(findRow('LB', baun, 'Stuffs')).toBe('7.5');
		expect(findRow('LB', baun, 'Passes defensed')).toBe('7');
	});

	it('drops rows and whole groups with no data', () => {
		const groups = getStatGroups('LB', baun);
		expect(groups.map((group) => group.title)).toEqual(['Defense', 'General']);
		// Baun recorded no safeties; ESPN omits the key and the row disappears.
		expect(findRow('LB', baun, 'Safeties')).toBeUndefined();
	});
});

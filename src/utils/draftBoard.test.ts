import { describe, expect, it } from 'vitest';
import {
	buildAvailableWhere,
	buildDraftBoard,
	buildLiveWhere,
	classifyPlayer,
	GAMES_PER_SEASON,
	PROJECTION_FLOOR,
	type DraftPlayer
} from './draftBoard';
import type { Position } from '../types/defs';

let nextId = 1;

function player(overrides: Partial<DraftPlayer> & { name: string }): DraftPlayer {
	const position = overrides.position ?? 'QB';
	const weights: Record<string, number> = {
		QB: 0,
		RB: 1,
		WR: 2,
		TE: 3,
		K: 4,
		DT: 5,
		DE: 5,
		LB: 6,
		S: 7,
		CB: 7
	};

	return {
		espn_id: nextId++,
		team: 'PHI',
		position: position as Position,
		positionWeight: weights[position],
		injuryStatus: 'ACTIVE',
		positionRankProj: 5,
		overallRankProj: 50,
		pointsLastYear: 100,
		pointsThisYearProj: 150,
		contract: null,
		...overrides
	};
}

function contract(overrides: Partial<NonNullable<DraftPlayer['contract']>> = {}) {
	return {
		id: 'c-1',
		status: 'active',
		salary: 10000,
		years: 2,
		isFranchiseTagged: false,
		team: { id: 'team-1', name: 'Scranton Stranglers', abbreviation: 'SCR' },
		...overrides
	};
}

describe('buildAvailableWhere', () => {
	it('floors uncontracted players to meaningful projections by default', () => {
		expect(buildAvailableWhere(false).OR).toEqual([
			{ contract: null, pointsThisYearProj: { gt: PROJECTION_FLOOR } }
		]);
	});

	it('drops the floor when the deep pool is requested', () => {
		expect(buildAvailableWhere(true).OR).toEqual([{ contract: null }]);
	});
});

describe('buildLiveWhere', () => {
	it('always includes RFA contracts', () => {
		expect(buildLiveWhere(null).OR).toEqual([{ contract: { status: { equals: 'rfa' } } }]);
	});

	it('adds the whole owner team only when a team id is known', () => {
		const where = buildLiveWhere('team-1');

		expect(where.OR).toHaveLength(2);
		// No status filter: the owner's waived dead cap belongs on the board too.
		expect(where.OR[1]).toEqual({ contract: { team: { id: { equals: 'team-1' } } } });
		expect(buildLiveWhere(undefined).OR).toHaveLength(1);
		expect(buildLiveWhere('').OR).toHaveLength(1);
	});
});

describe('classifyPlayer', () => {
	it('splits players into rfa, roster, and free-agent groups', () => {
		expect(classifyPlayer(player({ name: 'A', contract: contract({ status: 'rfa' }) }))).toBe(
			'rfa'
		);
		expect(classifyPlayer(player({ name: 'B', contract: contract({ status: 'active' }) }))).toBe(
			'roster'
		);
		expect(classifyPlayer(player({ name: 'C', contract: contract({ status: 'dts' }) }))).toBe(
			'roster'
		);
		expect(classifyPlayer(player({ name: 'D', contract: contract({ status: 'ir' }) }))).toBe(
			'roster'
		);
		expect(classifyPlayer(player({ name: 'E', contract: null }))).toBe('fa');
	});

	it('treats a waived contract as free agency, not a roster spot', () => {
		expect(classifyPlayer(player({ name: 'F', contract: contract({ status: 'waived' }) }))).toBe(
			'fa'
		);
	});

	it("marks the owner's own RFA contracts when a team id is provided", () => {
		const rfa = player({ name: 'G', contract: contract({ status: 'rfa' }) });

		expect(classifyPlayer(rfa, 'team-1')).toBe('rfa-team');
		expect(classifyPlayer(rfa, 'team-2')).toBe('rfa');
		expect(classifyPlayer(rfa)).toBe('rfa');
	});
});

describe('buildDraftBoard', () => {
	it('orders groups by positionWeight and rows by projected position rank', () => {
		const groups = buildDraftBoard([
			player({ name: 'Late QB', position: 'QB', positionRankProj: 40 }),
			player({ name: 'Top RB', position: 'RB', positionRankProj: 3 }),
			player({ name: 'Top QB', position: 'QB', positionRankProj: 2 })
		]);

		expect(groups.map((g) => g.label)).toEqual(['Quarterbacks', 'Running Backs']);
		expect(groups[0].rows.map((r) => r.name)).toEqual(['Top QB', 'Late QB']);
	});

	it('sends unranked players to the bottom of their group', () => {
		const groups = buildDraftBoard([
			player({ name: 'Unranked', positionRankProj: null, pointsThisYearProj: 500 }),
			player({ name: 'Rank Zero', positionRankProj: 0, pointsThisYearProj: 400 }),
			player({ name: 'Ranked', positionRankProj: 90, pointsThisYearProj: 10 })
		]);

		expect(groups[0].rows.map((r) => r.name)).toEqual(['Ranked', 'Unranked', 'Rank Zero']);
	});

	it('merges shared-weight positions into one labeled group', () => {
		const groups = buildDraftBoard([
			player({ name: 'Edge', position: 'DE', positionRankProj: 10 }),
			player({ name: 'Nose', position: 'DT', positionRankProj: 20 }),
			player({ name: 'Corner', position: 'CB', positionRankProj: 5 }),
			player({ name: 'Safety', position: 'S', positionRankProj: 15 })
		]);

		expect(groups.map((g) => g.label)).toEqual(['Defensive Line', 'Defensive Backs']);
		expect(groups[0].rows.map((r) => r.name)).toEqual(['Edge', 'Nose']);
		expect(groups[1].rows.map((r) => r.name)).toEqual(['Corner', 'Safety']);
	});

	it('passes the team id through to row classification', () => {
		const groups = buildDraftBoard(
			[player({ name: 'Own RFA', contract: contract({ status: 'rfa' }) })],
			'team-1'
		);

		expect(groups[0].rows[0].group).toBe('rfa-team');
	});

	it('computes dropoff against the row above within the group only', () => {
		const groups = buildDraftBoard([
			player({ name: 'QB1', position: 'QB', positionRankProj: 1, pointsThisYearProj: 320 }),
			player({ name: 'QB2', position: 'QB', positionRankProj: 8, pointsThisYearProj: 286 }),
			player({ name: 'RB1', position: 'RB', positionRankProj: 2, pointsThisYearProj: 300 })
		]);

		const [qb1, qb2] = groups[0].rows;
		expect(qb1.dropoffYear).toBeNull();
		expect(qb1.dropoffPerGame).toBeNull();
		expect(qb2.dropoffYear).toBeCloseTo(34);
		expect(qb2.dropoffPerGame).toBeCloseTo(34 / GAMES_PER_SEASON);

		// A new group starts fresh: RB1 has no one above them.
		expect(groups[1].rows[0].dropoffYear).toBeNull();
	});

	it('can report a negative dropoff when rank order disagrees with projections', () => {
		const groups = buildDraftBoard([
			player({ name: 'QB1', positionRankProj: 1, pointsThisYearProj: 250 }),
			player({ name: 'QB2', positionRankProj: 2, pointsThisYearProj: 280 })
		]);

		expect(groups[0].rows[1].dropoffYear).toBeCloseTo(-30);
	});

	it('computes cents per projected point for players under contract', () => {
		const groups = buildDraftBoard([
			player({
				name: 'Signed',
				positionRankProj: 1,
				pointsThisYearProj: 320,
				contract: contract({ salary: 15000 })
			}),
			player({
				name: 'Tagged',
				positionRankProj: 2,
				pointsThisYearProj: 200,
				contract: contract({ status: 'rfa', salary: 12000 })
			}),
			player({ name: 'Unsigned', positionRankProj: 3, pointsThisYearProj: 100 })
		]);

		const [signed, tagged, unsigned] = groups[0].rows;
		expect(signed.centsPerPoint).toBeCloseTo(15000 / 320);
		expect(tagged.centsPerPoint).toBeCloseTo(60);
		expect(unsigned.centsPerPoint).toBeNull();
	});

	it('leaves cents per point empty for waived contracts and missing projections', () => {
		const groups = buildDraftBoard([
			player({
				name: 'Waived',
				positionRankProj: 1,
				contract: contract({ status: 'waived' })
			}),
			player({
				name: 'No Projection',
				positionRankProj: 2,
				pointsThisYearProj: 0,
				contract: contract()
			})
		]);

		expect(groups[0].rows.map((r) => r.centsPerPoint)).toEqual([null, null]);
	});
});

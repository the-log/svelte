import { describe, it, expect } from 'vitest';
import objByProperty from './objByProperty';

describe('objByProperty', () => {
	it('sorts ascending by a top-level property', () => {
		const data = [{ name: 'C' }, { name: 'A' }, { name: 'B' }];
		const sorted = [...data].sort(objByProperty.bind({ path: 'name', dir: 'asc' }));
		expect(sorted.map((d) => d.name)).toEqual(['A', 'B', 'C']);
	});

	it('sorts descending when dir is "desc"', () => {
		const data = [{ score: 1 }, { score: 3 }, { score: 2 }];
		const sorted = [...data].sort(objByProperty.bind({ path: 'score', dir: 'desc' }));
		expect(sorted.map((d) => d.score)).toEqual([3, 2, 1]);
	});

	it('handles dotted paths', () => {
		const data = [{ player: { rank: 2 } }, { player: { rank: 1 } }, { player: { rank: 3 } }];
		const sorted = [...data].sort(objByProperty.bind({ path: 'player.rank', dir: 'asc' }));
		expect(sorted.map((d) => d.player.rank)).toEqual([1, 2, 3]);
	});

	it('treats direction case-insensitively', () => {
		const data = [{ n: 2 }, { n: 1 }];
		const sorted = [...data].sort(objByProperty.bind({ path: 'n', dir: 'DESC' as 'desc' }));
		expect(sorted.map((d) => d.n)).toEqual([2, 1]);
	});

	it('falls back to ascending for unknown direction strings', () => {
		const data = [{ n: 2 }, { n: 1 }];
		const sorted = [...data].sort(objByProperty.bind({ path: 'n', dir: 'sideways' as 'asc' }));
		expect(sorted.map((d) => d.n)).toEqual([1, 2]);
	});

	it('returns 0 for equal values', () => {
		const a = { v: 5 };
		const b = { v: 5 };
		expect(objByProperty.call({ path: 'v', dir: 'asc' }, a, b)).toBe(0);
	});
});

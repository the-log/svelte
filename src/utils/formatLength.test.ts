import { describe, it, expect } from 'vitest';
import formatLength from './formatLength';

describe('formatLength', () => {
	it('formats exact feet with zero inches', () => {
		expect(formatLength(72)).toBe(`6' 0"`);
	});

	it('formats feet plus remaining inches', () => {
		expect(formatLength(73)).toBe(`6' 1"`);
		expect(formatLength(77)).toBe(`6' 5"`);
	});

	it('handles values under a foot', () => {
		expect(formatLength(11)).toBe(`0' 11"`);
	});

	it('returns undefined for falsy inputs', () => {
		expect(formatLength(0)).toBeUndefined();
		expect(formatLength(null)).toBeUndefined();
		expect(formatLength(undefined)).toBeUndefined();
	});
});

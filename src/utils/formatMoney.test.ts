import { describe, it, expect } from 'vitest';
import formatMoney from './formatMoney';

describe('formatMoney', () => {
	it('formats positive cents as US currency', () => {
		expect(formatMoney(12345)).toBe('$123.45');
	});

	it('rounds to two decimal places', () => {
		expect(formatMoney(100)).toBe('$1.00');
	});

	it('handles large values', () => {
		expect(formatMoney(123456789)).toBe('$1,234,567.89');
	});

	it('formats negative cents with a leading minus', () => {
		expect(formatMoney(-500)).toBe('-$5.00');
	});

	it('formats zero as $0.00', () => {
		expect(formatMoney(0)).toBe('$0.00');
	});

	it('returns undefined for null and undefined', () => {
		expect(formatMoney(null)).toBeUndefined();
		expect(formatMoney(undefined)).toBeUndefined();
	});
});

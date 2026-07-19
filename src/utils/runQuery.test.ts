import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import runQuery from './runQuery';
import { notify } from './notify';

vi.mock('./notify', () => ({
	notify: vi.fn()
}));

const mockNotify = vi.mocked(notify);

function stubFetchJson(json: unknown) {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(json) }));
}

beforeEach(() => {
	vi.stubGlobal('document', {
		documentElement: { dispatchEvent: vi.fn() }
	});
	vi.stubGlobal(
		'CustomEvent',
		class {
			constructor(
				public type: string,
				public init?: unknown
			) {}
		}
	);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	mockNotify.mockReset();
});

describe('runQuery', () => {
	it('resolves with the response and no notification on success', async () => {
		stubFetchJson({ data: { ok: true } });

		const result = await runQuery('query {}');

		expect(result).toEqual({ data: { ok: true } });
		expect(mockNotify).not.toHaveBeenCalled();
	});

	it('notifies with the first GraphQL error message, not the stringified array', async () => {
		stubFetchJson({ errors: [{ message: 'Missing credentials for "PLAIN"' }] });

		const result = await runQuery('mutation {}');

		expect(result.errors).toHaveLength(1);
		expect(mockNotify).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Missing credentials for "PLAIN"',
				variant: 'danger'
			})
		);
	});

	it('still resolves with the errors when notify throws', async () => {
		mockNotify.mockImplementation(() => {
			throw new Error('shoelace not hydrated');
		});
		stubFetchJson({ errors: [{ message: 'boom' }] });

		await expect(runQuery('mutation {}')).resolves.toMatchObject({
			errors: [{ message: 'boom' }]
		});
	});

	it('returns a failed result and notifies when the fetch rejects', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

		const result = await runQuery('query {}');

		expect(result.errors?.[0]?.message).toMatch(/could not be reached/);
		expect(mockNotify).toHaveBeenCalledWith(
			expect.objectContaining({ variant: 'danger', message: expect.stringMatching(/backend/) })
		);
	});

	it('returns a failed result when the response is not JSON', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.reject(new SyntaxError('Unexpected token <'))
			})
		);

		const result = await runQuery('query {}');

		expect(result.errors?.[0]?.message).toMatch(/could not be reached/);
	});

	it('never rejects, even when both the request and the toast fail', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		mockNotify.mockImplementation(() => {
			throw new Error('no DOM');
		});

		await expect(runQuery('query {}')).resolves.toMatchObject({
			errors: [{ message: expect.stringMatching(/could not be reached/) }]
		});
	});
});

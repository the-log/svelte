import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	resolve: {
		alias: {
			'$env/dynamic/public': fileURLToPath(
				new URL('./src/testing/env-dynamic-public.ts', import.meta.url)
			)
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});

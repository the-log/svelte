import { defineConfig, devices } from '@playwright/test';

// UI tests run against the production build (vite preview) with every request
// to the GraphQL API intercepted and answered from fixtures — no test ever
// reaches a real backend. See e2e/README.md for the architecture.
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		// Locked-bid dates render via toLocaleDateString(); pin locale and zone
		// so assertions are deterministic.
		locale: 'en-US',
		timezoneId: 'America/New_York'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'npm run build && npm run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});

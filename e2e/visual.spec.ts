import { expect, test } from './support/mockApi';

// Visual-regression coverage for the app's stable, data-driven pages. Every
// page here renders entirely from the mocked GraphQL fixtures, so the pixels
// only change when the UI changes. Dynamic chrome that would otherwise churn
// the baselines (the footer's current-year copyright, the free-agency
// countdown) is masked or avoided.
//
// Baselines are pixel-specific to the OS/font stack that renders them, so both
// local runs and CI go through one pinned Playwright Linux image. Never
// regenerate on the host — run `npm run test:e2e:docker -- --update-snapshots`
// (or `ddev playwright --update-snapshots`). See e2e/README.md.

// Wait for Shoelace custom elements to finish upgrading so the screenshot
// captures the styled component, not its unstyled pre-registration markup.
async function settle(page: import('@playwright/test').Page) {
	await page.waitForLoadState('networkidle');
	// sl-button lives in the header on every page and is registered by the same
	// bootstrap module as the rest, so once it upgrades the whole set has.
	await page.evaluate(() => customElements.whenDefined('sl-button'));
}

// The footer stamps the live year via new Date().getFullYear(); mask it so the
// baseline does not rot at each year boundary.
const footer = (page: import('@playwright/test').Page) => page.locator('footer');

test.describe('visual regression', () => {
	test('login page', async ({ page, api }) => {
		api.logInAs(null);
		await page.goto('/login');
		await page.getByRole('heading', { name: 'Login' }).waitFor();
		await settle(page);
		await expect(page).toHaveScreenshot('login.png', {
			fullPage: true,
			mask: [footer(page)]
		});
	});

	test('team standings', async ({ page }) => {
		await page.goto('/teams');
		await expect(page.locator('.tablegrid-row:not(.tablegrid-header)')).toHaveCount(3);
		await settle(page);
		await expect(page).toHaveScreenshot('teams.png', {
			fullPage: true,
			mask: [footer(page)]
		});
	});

	test('player list', async ({ page }) => {
		await page.goto('/players');
		await expect(page.locator('.tablegrid-row:not(.tablegrid-header)').first()).toBeVisible();
		await settle(page);
		await expect(page).toHaveScreenshot('players.png', {
			fullPage: true,
			mask: [footer(page)]
		});
	});

	test('rulebook', async ({ page }) => {
		await page.goto('/rulebook');
		await page.locator('sl-tab-group').waitFor();
		await settle(page);
		await expect(page).toHaveScreenshot('rulebook.png', {
			fullPage: true,
			mask: [footer(page)]
		});
	});
});

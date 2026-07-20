import { expect, test } from './support/mockApi';

// The stats drawer is mounted once in the layout (PlayerStatsDrawer) and
// opened from StatsTrigger name-buttons wherever players are listed. These
// tests cover the players table and the roster table; the trigger and drawer
// are the same components everywhere else (RFA, bids).
test.describe('player stats drawer', () => {
	const drawer = (page: import('@playwright/test').Page) => page.locator('sl-drawer[open]');

	// Scope to the active tab panel — the inactive stat-set panels stay in the
	// DOM (hidden), so an unscoped dt lookup can match the wrong set.
	const statValue = (page: import('@playwright/test').Page, label: string) =>
		drawer(page)
			.locator(`sl-tab-panel[active] dt:has-text("${label}") + dd`)
			.first();

	test('opens from the players table with mapped stats', async ({ page, api }) => {
		await page.goto('/players');

		await page.getByRole('button', { name: 'Aaron Ashford' }).click();

		const call = await api.waitForCall('stats-by-player');
		expect(call.variables).toMatchObject({ id: 101 });

		await expect(drawer(page)).toHaveAttribute('label', 'Aaron Ashford — PHI, QB');
		await expect(drawer(page)).toContainText('Drafted 2021, Rd 1 #5');
		await expect(drawer(page)).toContainText('254.3 pts');

		// QB layout, resolved through the ESPN stat-key map.
		await expect(statValue(page, 'Comp / Att')).toHaveText('210 / 300');
		await expect(statValue(page, 'Completion %')).toHaveText('70%');
		await expect(statValue(page, 'Interceptions')).toHaveText('7');
		await expect(statValue(page, 'Times sacked')).toHaveText('21');
		await expect(statValue(page, 'Team record')).toHaveText('7-3');

		await expect(drawer(page)).toContainText('unquestioned starter in Philadelphia');
	});

	test('switches to the projected stat set with rounded values', async ({ page }) => {
		await page.goto('/players');
		await page.getByRole('button', { name: 'Aaron Ashford' }).click();
		await expect(drawer(page)).toBeVisible();

		await drawer(page).getByRole('tab', { name: 'This Year (Proj)' }).click();

		await expect(drawer(page)).toContainText('320.4 pts');
		// Fractional projections render rounded (4012.4 → 4012, 348.2/512.6 → 348/513).
		await expect(statValue(page, 'Comp / Att')).toHaveText('348 / 513');
		await expect(statValue(page, 'Touchdowns').first()).toHaveText('30');
	});

	test('closes with Escape and reopens from a roster row', async ({ page, api }) => {
		await page.goto('/players');
		await page.getByRole('button', { name: 'Aaron Ashford' }).click();
		await expect(drawer(page)).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.locator('sl-drawer[open]')).toHaveCount(0);

		// Same player from the home roster (TeamTable) — one shared drawer.
		await page.goto('/');
		await page.getByRole('button', { name: 'Aaron Ashford' }).click();
		await api.waitForCall('stats-by-player', 2);
		await expect(drawer(page)).toHaveAttribute('label', 'Aaron Ashford — PHI, QB');
		await expect(statValue(page, 'Comp / Att')).toHaveText('210 / 300');
	});

	test('shows the error state for a player the API cannot resolve', async ({ page }) => {
		await page.goto('/players');

		// Blake Bradford has no playerStatsById fixture → mock answers player: null.
		await page.getByRole('button', { name: 'Blake Bradford' }).click();

		await expect(drawer(page)).toContainText('Stats for this player could not be loaded.');
	});
});

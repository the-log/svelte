import { expect, test } from './support/mockApi';

test.describe('teams', () => {
	const rows = (page: import('@playwright/test').Page) =>
		page.locator('.tablegrid-row:not(.tablegrid-header)');

	test('standings render in order with records and cap totals', async ({ page }) => {
		await page.goto('/teams');

		await expect(rows(page)).toHaveCount(3);
		await expect(rows(page).nth(0)).toContainText('Nashville Hounds');
		await expect(rows(page).nth(1)).toContainText('Scranton Stranglers');
		await expect(rows(page).nth(2)).toContainText('Portland Pines');

		const nashville = rows(page).first();
		await expect(nashville).toContainText('10-3-0');
		await expect(nashville).toContainText('$1,050.00');
		await expect(nashville).toContainText('105yrs');
	});

	test('cap and roster overages are highlighted', async ({ page }) => {
		await page.goto('/teams');

		const nashville = rows(page).first();
		await expect(nashville.locator('.over', { hasText: '$1,050.00' })).toBeVisible();
		await expect(nashville.locator('.over', { hasText: '41' })).toBeVisible();
		await expect(nashville.locator('.warn', { hasText: '12' })).toBeVisible();

		// Portland is comfortably under every limit.
		await expect(rows(page).nth(2).locator('.over, .warn')).toHaveCount(0);
	});

	test('team names link to their detail pages', async ({ page, api }) => {
		await page.goto('/teams');

		await page.getByRole('link', { name: 'Nashville Hounds' }).click();

		await expect(page).toHaveURL(/\/teams\/NSH$/);
		const call = await api.waitForCall('contracts-by-team-abbr');
		expect(call.variables).toEqual({ abbr: 'NSH' });
		await expect(page.getByRole('heading', { name: 'Nashville Hounds' })).toBeVisible();
	});
});

test.describe('team detail', () => {
	test('loads the roster from the URL abbreviation, case-insensitively', async ({ page, api }) => {
		await page.goto('/teams/nsh');

		const call = await api.waitForCall('contracts-by-team-abbr');
		expect(call.variables).toEqual({ abbr: 'NSH' });

		await expect(page.getByRole('heading', { name: 'Nashville Hounds' })).toBeVisible();
		await expect(page.locator('.tablegrid-row', { hasText: 'Miles Marsh' })).toBeVisible();
		await expect(page.locator('.tablegrid-row', { hasText: 'Carter Callahan' })).toBeVisible();
		// This roster has no practice squad, so the section stays hidden.
		await expect(page.getByRole('heading', { name: 'Practice Squad' })).toHaveCount(0);
	});

	test('an unknown team renders empty without crashing', async ({ page }) => {
		await page.goto('/teams/xyz');

		await expect(page.locator('main h1')).toHaveText('');
		await expect(page.locator('.tablegrid-row')).toHaveCount(0);
	});
});

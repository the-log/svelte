import { expect, test } from './support/mockApi';

test.describe('players', () => {
	const rows = (page: import('@playwright/test').Page) =>
		page.locator('.tablegrid-row:not(.tablegrid-header)');

	test('lists the first page ordered by projected points', async ({ page }) => {
		await page.goto('/players');

		await expect(page.locator('.pagination .results').first()).toHaveText('1 - 25 of 30');
		await expect(rows(page)).toHaveCount(25);
		await expect(rows(page).first()).toContainText('Aaron Ashford');

		// Contracted players show their owner; free agents show a placeholder.
		await expect(rows(page).first()).toContainText('Scranton Stranglers');
		await expect(page.locator('.tablegrid-row', { hasText: 'Blake Bradford' })).toContainText(
			'-----'
		);
	});

	test('pagination requests the next slice and disables at the end', async ({ page, api }) => {
		await page.goto('/players');
		await expect(rows(page)).toHaveCount(25);
		const callsBefore = api.callsTo('all-players').length;

		await page.getByLabel('Show next set').first().click();

		const call = await api.waitForCall('all-players', callsBefore + 1);
		// skip clamps to count - take (30 - 25).
		expect(call.variables).toMatchObject({ skip: 5, take: 25 });
		await expect(page.locator('.pagination .results').first()).toHaveText('6 - 30 of 30');

		const nextButton = page.getByLabel('Show next set').first();
		await expect
			.poll(() => nextButton.evaluate((el) => (el as HTMLButtonElement).disabled))
			.toBe(true);
	});

	test('name filtering narrows results case-insensitively', async ({ page, api }) => {
		await page.goto('/players');
		await expect(rows(page)).toHaveCount(25);
		const callsBefore = api.callsTo('all-players').length;

		await page.locator('input[placeholder="Player Name"]').fill('ashford');

		const call = await api.waitForCall('all-players', callsBefore + 1);
		expect(call.variables.filters).toMatchObject({
			name: { mode: 'insensitive', contains: 'ashford' }
		});
		await expect(rows(page)).toHaveCount(1);
		await expect(rows(page).first()).toContainText('Aaron Ashford');
		await expect(page.locator('.pagination .results').first()).toHaveText('1 - 1 of 1');
	});

	test('combined position options split into individual filters', async ({ page, api }) => {
		await page.goto('/players');
		await expect(rows(page)).toHaveCount(25);
		const callsBefore = api.callsTo('all-players').length;

		await page.locator('sl-select[placeholder="Position"]').click();
		await page.locator('sl-option', { hasText: 'Defensive Line' }).click();
		await page.keyboard.press('Escape');

		const call = await api.waitForCall('all-players', callsBefore + 1);
		expect(call.variables.filters).toMatchObject({ position: { in: ['DE', 'DT'] } });
		await expect(rows(page)).toHaveCount(2);
		await expect(rows(page).first()).toContainText('Elliot Eastwood');
		await expect(rows(page).last()).toContainText('Felix Fontaine');
	});

	test('availability filter excludes players under contract', async ({ page, api }) => {
		await page.goto('/players');
		await expect(rows(page)).toHaveCount(25);
		const callsBefore = api.callsTo('all-players').length;

		await page.locator('sl-radio-group[label="Available"] sl-radio[value="yes"]').click();

		const call = await api.waitForCall('all-players', callsBefore + 1);
		expect(call.variables.filters).toMatchObject({
			NOT: { contract: { status: { in: ['active', 'dts', 'ir', 'rfa'] } } }
		});
		await expect(page.locator('.tablegrid-row', { hasText: 'Blake Bradford' })).toBeVisible();
		await expect(page.locator('.tablegrid-row', { hasText: 'Aaron Ashford' })).toHaveCount(0);
	});

	test('the sort menu re-orders by the chosen projection', async ({ page, api }) => {
		await page.goto('/players');
		await expect(rows(page).first()).toContainText('Aaron Ashford');
		const callsBefore = api.callsTo('all-players').length;

		await page.locator('.tablegrid-header sl-dropdown sl-icon-button').click();
		await page.locator('sl-menu-item', { hasText: 'Week (Proj)' }).click();

		const call = await api.waitForCall('all-players', callsBefore + 1);
		expect(call.variables.order).toEqual({ pointsThisWeekProj: 'desc' });
		await expect(rows(page).first()).toContainText('Elliot Eastwood');
	});
});

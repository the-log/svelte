import { expect, test } from './support/mockApi';

// The draft board unions three player pools (RFA contracts, the owner's
// roster, uncontracted free agents), sorts them into position groups, and
// computes dropoff and $/pt columns client-side (src/utils/draftBoard.ts).
test.describe('draft board', () => {
	const row = (page: import('@playwright/test').Page, name: string) =>
		page.locator('.tablegrid-row[data-player-id]', { hasText: name });

	test('unions RFAs, the owner roster, and free agents; hides other rosters', async ({ page }) => {
		await page.goto('/draft');

		// One player from each pool, each tagged with its group.
		await expect(row(page, 'Aaron Ashford')).toHaveAttribute('data-group', 'roster');
		await expect(row(page, 'Marcus Monroe')).toHaveAttribute('data-group', 'rfa');
		await expect(row(page, 'Blake Bradford')).toHaveAttribute('data-group', 'fa');

		// Players under contract with other teams stay off the board.
		await expect(row(page, 'Carter Callahan')).toHaveCount(0);
		await expect(row(page, 'Felix Fontaine')).toHaveCount(0);

		await expect(page.locator('h2', { hasText: 'Quarterbacks' })).toBeVisible();
		await expect(page.locator('h2', { hasText: 'Defensive Line' })).toBeVisible();
	});

	test('sorts by position weight then projected rank, with computed columns', async ({ page }) => {
		await page.goto('/draft');

		// QBs carry the lowest positionWeight, ordered by overallRankProj.
		const playerRows = page.locator('.tablegrid-row[data-player-id]');
		await expect(playerRows.nth(0)).toContainText('Aaron Ashford');
		await expect(playerRows.nth(1)).toContainText('Marcus Monroe');
		await expect(playerRows.nth(2)).toContainText('Pierce Palmer');

		// The group leader has no one to drop off from.
		await expect(row(page, 'Aaron Ashford')).toContainText('— / gm');
		// $150.00 over 320 projected points.
		await expect(row(page, 'Aaron Ashford')).toContainText('$0.47');

		// Monroe: 320 → 280 projected, so 40.0 over the year, 2.35 per game;
		// $120.00 over 280 points; franchise-tagged RFA held by Nashville.
		const monroe = row(page, 'Marcus Monroe');
		await expect(monroe).toContainText('40.0');
		await expect(monroe).toContainText('2.35 / gm');
		await expect(monroe).toContainText('$0.43');
		await expect(monroe).toContainText('FT');
		await expect(monroe).toContainText('RFA · NSH');
	});

	test("shows the owner's waived dead cap but hides other teams' waived players", async ({
		page
	}) => {
		await page.goto('/draft');

		// Knox was waived by the owner's own team, so he rides the live pool.
		const knox = row(page, 'Kellen Knox');
		await expect(knox).toHaveAttribute('data-group', 'fa');
		await expect(knox).toContainText('waived · SCR');

		// Vale was waived by Portland: he still has a contract, so he's neither
		// uncontracted nor the owner's, and stays off the board.
		await expect(row(page, 'Victor Vale')).toHaveCount(0);
	});

	test('the projections toggle refetches and reveals unprojected players', async ({
		page,
		api
	}) => {
		await page.goto('/draft');

		await expect(row(page, 'Aaron Ashford')).toBeVisible();
		await expect(row(page, 'Uri Underwood')).toHaveCount(0);

		await page.locator('sl-switch').click();

		await expect(row(page, 'Uri Underwood')).toBeVisible();
		// Unranked players sink to the bottom of their position group.
		await expect(row(page, 'Uri Underwood')).toHaveAttribute('data-group', 'fa');

		// The toggle refetched the static pool without the projection floor.
		// (Live-pool polls land in the same call log, so match on shape rather
		// than call order.)
		const staticWheres = api
			.callsTo('draft-board')
			.map((call) => (call.variables.where as { OR: Record<string, unknown>[] }).OR)
			.filter((or) => or.length === 1 && or[0].contract === null);
		expect(staticWheres.at(0)?.[0]).toHaveProperty('pointsThisYearProj', { gt: 50 });
		expect(staticWheres.at(-1)?.[0]).not.toHaveProperty('pointsThisYearProj');
	});
});

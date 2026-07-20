import { expect, test } from './support/mockApi';

// Rows on My Team belong to the logged-in owner (Scranton), so the Actions
// menu offers roster moves; which moves depends on contract status and injury.
test.describe('my team', () => {
	function row(page: import('@playwright/test').Page, playerName: string) {
		return page.locator('.tablegrid-row', { hasText: playerName });
	}

	async function openActionsMenu(page: import('@playwright/test').Page, playerName: string) {
		await row(page, playerName).locator('sl-dropdown sl-icon-button').click();
	}

	// Every row's menu exists in the DOM, so menu items must stay row-scoped.
	function menuItem(page: import('@playwright/test').Page, playerName: string, label: string) {
		return row(page, playerName).locator('sl-menu-item', { hasText: label });
	}

	test('roster renders grouped by contract status', async ({ page }) => {
		await page.goto('/');

		for (const heading of ['Active', 'Practice Squad', 'Injured Reserve', 'Waived']) {
			await expect(page.getByRole('heading', { name: heading })).toBeVisible();
		}

		await expect(row(page, 'Aaron Ashford')).toContainText('$150.00');
		await expect(row(page, 'Ivan Ingram')).toBeVisible();
		await expect(row(page, 'Jonas Jett')).toBeVisible();
		await expect(row(page, 'Kellen Knox')).toBeVisible();
		await expect(page.locator('.tablegrid-row.needs-attention')).toContainText('Grady Gibson');
	});

	test('available actions track contract status and injuries', async ({ page }) => {
		await page.goto('/');

		// Healthy active player: droppable, nothing else.
		await openActionsMenu(page, 'Aaron Ashford');
		await expect(menuItem(page, 'Aaron Ashford', 'Drop')).toBeVisible();
		await expect(menuItem(page, 'Aaron Ashford', 'To IR')).toHaveCount(0);
		await expect(menuItem(page, 'Aaron Ashford', 'To Active Roster')).toHaveCount(0);
		await page.keyboard.press('Escape');

		// Player who is OUT: IR becomes available.
		await openActionsMenu(page, 'Hollis Hart');
		await expect(menuItem(page, 'Hollis Hart', 'To IR')).toBeVisible();
		await page.keyboard.press('Escape');

		// Practice squad player: promotable.
		await openActionsMenu(page, 'Ivan Ingram');
		await expect(menuItem(page, 'Ivan Ingram', 'To Active Roster')).toBeVisible();
		await page.keyboard.press('Escape');

		// Waived player: no drop, but biddable in season.
		await openActionsMenu(page, 'Kellen Knox');
		await expect(menuItem(page, 'Kellen Knox', 'Place Bid')).toBeVisible();
		await expect(menuItem(page, 'Kellen Knox', 'Drop')).toHaveCount(0);
		await page.keyboard.press('Escape');
	});

	test('dropping a player confirms, mutates, and refreshes the roster', async ({ page, api }) => {
		await page.goto('/');
		await expect(row(page, 'Aaron Ashford')).toBeVisible();
		const fetchesBefore = api.callsTo('contracts-by-team-id').length;

		await openActionsMenu(page, 'Aaron Ashford');
		await menuItem(page, 'Aaron Ashford', 'Drop').click();

		const dialog = page.locator('sl-dialog[open]');
		await expect(dialog).toContainText('Dropping Aaron Ashford. This action is not reversible');
		await dialog.getByRole('button', { name: 'Drop' }).click();

		const call = await api.waitForCall('update-contract');
		expect(call.variables).toMatchObject({
			where: { id: 'c-active-1' },
			data: { status: 'waived' }
		});

		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText(
			'Contract updated for Aaron Ashford (QB, PHI)'
		);
		await api.waitForCall('contracts-by-team-id', fetchesBefore + 1);
	});

	test('promoting from the practice squad asks for contract years', async ({ page, api }) => {
		await page.goto('/');

		await openActionsMenu(page, 'Ivan Ingram');
		await menuItem(page, 'Ivan Ingram', 'To Active Roster').click();

		const dialog = page.locator('sl-dialog[open]');
		await dialog.getByLabel('Years').fill('2');
		await dialog.getByRole('button', { name: 'Promote' }).click();

		const call = await api.waitForCall('update-contract');
		expect(call.variables).toMatchObject({
			where: { id: 'c-dts-1' },
			data: { status: 'active', years: 2 }
		});
	});

	test('bidding on a waived player builds the bid from the form', async ({ page, api }) => {
		await page.goto('/');

		await openActionsMenu(page, 'Kellen Knox');
		await menuItem(page, 'Kellen Knox', 'Place Bid').click();

		const dialog = page.locator('sl-dialog[open]');
		// exact: true — the dialog itself is labelled "Bidding on Player".
		await expect(dialog.getByLabel('Player', { exact: true })).toHaveValue('Kellen Knox (CB, ATL)');
		await dialog.getByLabel('Salary').fill('5');
		await dialog.getByLabel('Years').fill('2');
		await dialog.getByRole('button', { name: 'Bid' }).click();

		const call = await api.waitForCall('new-bid');
		expect(call.variables).toEqual({
			data: {
				team: { connect: { id: 'team-1' } },
				player: { connect: { espn_id: 114 } },
				salary: 500,
				years: 2
			}
		});
		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('Bid Created');
	});
});

import { expect, test } from './support/mockApi';

test.describe('restricted free agency', () => {
	const rows = (page: import('@playwright/test').Page) =>
		page.locator('.tablegrid-row:not(.tablegrid-header)');

	test('lists restricted free agents with franchise tags', async ({ page }) => {
		await page.goto('/rfa');

		await expect(page.getByRole('heading', { name: 'Restricted Free Agents' })).toBeVisible();
		await expect(rows(page)).toHaveCount(4);
		// Default sort: by position weight, QBs first.
		await expect(rows(page).first()).toContainText('Marcus Monroe');
		await expect(rows(page).first().locator('.ft')).toHaveText('FT');

		const nolan = page.locator('.tablegrid-row', { hasText: 'Nolan Nash' });
		await expect(nolan).toContainText('Scranton Stranglers');
		await expect(nolan).toContainText('$80.00');
		await expect(nolan).toContainText('#8');

		// Regular owners get no admin actions (RFA rows have no other buttons).
		await expect(rows(page).locator('sl-icon-button')).toHaveCount(0);
	});

	test('sort options re-rank the list', async ({ page, api }) => {
		await page.goto('/rfa');
		await expect(rows(page).first()).toContainText('Marcus Monroe');
		const callsBefore = api.callsTo('rfas').length;

		await page.locator('sl-radio[value="ovrrank"]').click();

		await api.waitForCall('rfas', callsBefore + 1);
		await expect(rows(page).first()).toContainText('Nolan Nash');
	});

	test('admins can convert a winning bid into a contract', async ({ page, api }) => {
		api.logInAs('admin');
		await page.goto('/rfa');

		// Client-rendered Shoelace elements receive `name` as a property, not an
		// attribute, so locate the row's only icon button structurally.
		// .first() — the action's dialog (with its close icon button) also lives
		// inside the row markup.
		const marcus = page.locator('.tablegrid-row', { hasText: 'Marcus Monroe' });
		await marcus.locator('sl-icon-button').first().click();

		await api.waitForCall('team-options');
		const dialog = page.locator('sl-dialog[open]');
		await expect(dialog.getByLabel('Player')).toHaveValue('Marcus Monroe (QB, LAC)');
		// Salary guidance derives from the expiring contract ($120.00).
		await expect(dialog).toContainText('50%: $60.00; 75%: $90.00');

		await dialog.getByLabel('Salary').fill('70');
		await dialog.locator('sl-select').click();
		await page.locator('sl-option', { hasText: 'Portland Pines' }).click();
		await dialog.getByRole('button', { name: 'Create New Contract' }).click();

		const deletion = await api.waitForCall('delete-contract');
		expect(deletion.variables).toEqual({ where: { id: 'rfa-1' } });

		const creation = await api.waitForCall('create-contract');
		expect(creation.variables).toEqual({
			data: {
				player: { connect: { espn_id: 301 } },
				needsAttention: true,
				salary: 7000,
				status: 'active',
				team: { connect: { espn_id: 3 } },
				years: 0
			}
		});

		await expect(page.locator('.sl-toast-stack sl-alert').first()).toContainText(
			'Contract Deleted for Marcus Monroe'
		);
		await expect(page.locator('.sl-toast-stack sl-alert').last()).toContainText(
			'Contract Created for Marcus Monroe'
		);
	});
});

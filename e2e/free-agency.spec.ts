import { expect, test } from './support/mockApi';

test.describe('free agency', () => {
	test('shows pending bids with a live countdown to the next deadline', async ({ page }) => {
		await page.goto('/free-agency');

		// bid_deadlines[0] is ~3 days out, so the clock reads dd:hh:mm:ss.
		await expect(page.getByRole('heading', { name: /Pending Bids/ })).toContainText(
			/\(\d{2,}:\d{2}:\d{2}:\d{2}\)/
		);

		const quincy = page.locator('.tablegrid-row', { hasText: 'Quincy Quill' });
		await expect(quincy).toContainText('$5.00 - 2yrs');
		await expect(page.locator('.tablegrid-row', { hasText: 'Ruben Royce' })).toBeVisible();
	});

	test('groups auction results by date with the newest open', async ({ page }) => {
		await page.goto('/free-agency');

		const groups = page.locator('sl-details');
		await expect(groups).toHaveCount(2);
		await expect(groups.nth(0)).toContainText('7/10/2026');
		await expect(groups.nth(0)).toHaveAttribute('open', '');
		await expect(groups.nth(1)).toContainText('7/3/2026');
		await expect(groups.nth(1)).not.toHaveAttribute('open', '');

		// Within a date, bids group per player and order by bid_order.
		await expect(groups.nth(0).getByRole('heading', { name: 'Silas Stone' })).toBeVisible();
		await expect(groups.nth(0).getByRole('heading', { name: 'Titus Turner' })).toBeVisible();
		const silasRows = groups.nth(0).locator('.tablegrid-row', { hasText: 'Silas Stone' });
		await expect(silasRows.first()).toContainText('Nashville Hounds');
	});

	test('editing a pending bid converts dollars back to cents', async ({ page, api }) => {
		await page.goto('/free-agency');

		const quincy = page.locator('.tablegrid-row', { hasText: 'Quincy Quill' });
		await quincy.locator('sl-dropdown sl-icon-button').click();
		await quincy.locator('sl-menu-item', { hasText: 'Edit' }).click();

		const dialog = page.locator('sl-dialog[open]');
		await expect(dialog.getByLabel('Salary')).toHaveValue('5');
		await dialog.getByLabel('Salary').fill('7');
		await dialog.getByLabel('Years').fill('3');
		await dialog.getByRole('button', { name: 'Save' }).click();

		const call = await api.waitForCall('update-bid');
		expect(call.variables).toEqual({
			where: { id: 'bid-1' },
			data: { salary: 700, years: 3 }
		});
		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('Bid Updated');
	});

	test('deleting a pending bid asks for confirmation first', async ({ page, api }) => {
		await page.goto('/free-agency');
		const refreshesBefore = api.callsTo('all-bids').length;

		const ruben = page.locator('.tablegrid-row', { hasText: 'Ruben Royce' });
		await ruben.locator('sl-dropdown sl-icon-button').click();
		await ruben.locator('sl-menu-item', { hasText: 'Delete' }).click();

		const dialog = page.locator('sl-dialog[open]');
		await expect(dialog).toContainText('Are you sure you want to delete this bid?');
		await expect(dialog).toContainText('Ruben Royce');
		await dialog.getByRole('button', { name: 'Delete' }).click();

		const call = await api.waitForCall('delete-bid');
		expect(call.variables).toEqual({ where: { id: 'bid-2' } });
		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('Bid Deleted');
		await api.waitForCall('all-bids', refreshesBefore + 1);
	});
});

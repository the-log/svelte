import { expect, test } from './support/mockApi';

test.describe('site navigation', () => {
	test('in-season nav shows Free Agency but not RFA', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByLabel('My Team')).toBeVisible();
		await expect(page.getByLabel('Teams')).toBeVisible();
		await expect(page.getByLabel('Players')).toBeVisible();
		await expect(page.getByLabel('Rulebook')).toBeVisible();
		await expect(page.getByLabel('Free Agency', { exact: true })).toBeVisible();
		await expect(page.getByLabel('Restricted Free Agency')).toHaveCount(0);
	});

	test('off-season nav swaps Free Agency for RFA', async ({ page, api }) => {
		api.setPhase('rfa');

		await page.goto('/');

		await expect(page.getByLabel('Restricted Free Agency')).toBeVisible();
		await expect(page.getByLabel('Free Agency', { exact: true })).toHaveCount(0);
	});

	test('the current section is highlighted', async ({ page }) => {
		await page.goto('/players');

		// The nav renders client-side, so Svelte sets `label` as a property and
		// attribute selectors can't see it; find hosts via their inner aria-label.
		const navButton = (label: string) =>
			page.locator('#site-nav sl-icon-button').filter({ has: page.getByLabel(label) });

		await expect(navButton('Players')).toHaveClass(/is-active/);
		await expect(navButton('My Team')).not.toHaveClass(/is-active/);
	});

	test('nav icons navigate between sections', async ({ page }) => {
		await page.goto('/');

		await page.getByLabel('Teams').click();

		await expect(page).toHaveURL(/\/teams$/);
		await expect(page.getByRole('heading', { name: 'Teams' })).toBeVisible();
	});
});

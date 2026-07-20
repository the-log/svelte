import { expect, test } from './support/mockApi';

// The layout flips to mobile below 45rem (720px); tables collapse columns and
// the header auth button hides in favor of the bottom nav.
test.use({ viewport: { width: 390, height: 844 } });

test.describe('mobile layout', () => {
	test('roster rows collapse team and position into the name cell', async ({ page }) => {
		await page.goto('/');

		const aaron = page.locator('.tablegrid-row', { hasText: 'Aaron Ashford' });
		await expect(aaron).toContainText('PHI - QB');
		// The dedicated Team column disappears on small screens.
		await expect(
			page.locator('.tablegrid-header .tablegrid-cell', { hasText: /^Team$/ })
		).toHaveCount(0);
	});

	test('standings inline the contract counts', async ({ page }) => {
		await page.goto('/teams');

		const nashville = page.locator('.tablegrid-row', { hasText: 'Nashville Hounds' });
		await expect(nashville.locator('.contract-counts')).toContainText('41');
		await expect(nashville.locator('.contract-counts')).toContainText('12');
	});

	test('the nav renders while the header session button hides', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('#site-nav nav')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Log Out' })).toBeHidden();
	});
});

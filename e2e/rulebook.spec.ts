import { expect, test } from './support/mockApi';

test.describe('rulebook', () => {
	test('renders chapters as tabs from the GitHub rulebook', async ({ page }) => {
		await page.goto('/rulebook');

		await expect(page.getByRole('tab', { name: 'Scoring' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Contracts' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Trades' })).toBeVisible();

		// First chapter is active by default, with its markdown rendered.
		await expect(page.getByRole('heading', { name: 'Scoring' })).toBeVisible();
		await expect(page.getByText('Passing touchdowns: 4 points')).toBeVisible();

		await page.getByRole('tab', { name: 'Trades' }).click();
		await expect(page.getByText('Trades must be approved by the commissioner.')).toBeVisible();
	});

	test('shows a fallback when GitHub is unavailable', async ({ page, api }) => {
		api.rulebookAvailable = false;

		await page.goto('/rulebook');

		await expect(page.getByText("The rulebook couldn't be loaded right now")).toBeVisible();
		await expect(page.getByRole('link', { name: 'github.com/the-log/rulebook' })).toBeVisible();
	});
});

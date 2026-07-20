import { expect, test } from './support/mockApi';

// The reset page is a two-step form: request a one-time code, then redeem it
// with a new password.
test.describe('password reset', () => {
	async function requestToken(
		page: import('@playwright/test').Page,
		api: import('./support/mockApi').MockApi
	) {
		api.logInAs(null);
		await page.goto('/reset');
		// Plain CSS pierces the shadow DOM straight to the real <input>; the
		// sl-input host would double-match a placeholder lookup.
		await page.locator('input[placeholder="Email"]').fill('sam@example.com');
		await page.getByRole('button', { name: 'Submit' }).click();
		await api.waitForCall('request-token');
		await expect(page.locator('input[placeholder="one-time code"]')).toBeVisible();
	}

	test('requests a one-time code for the entered email', async ({ page, api }) => {
		await requestToken(page, api);

		const call = api.lastCallTo('request-token');
		expect(call?.variables).toEqual({ email: 'sam@example.com' });
		// The email field locks while the code is pending.
		await expect(page.locator('input[placeholder="Email"]')).toBeDisabled();
	});

	test('rejects mismatched passwords without calling the API', async ({ page, api }) => {
		await requestToken(page, api);

		await page.locator('input[placeholder="one-time code"]').fill('123456');
		await page.locator('input[placeholder="new password"]').fill('password123');
		await page.locator('input[placeholder="confirm new password"]').fill('different123');
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('Passwords must match');
		expect(api.callsTo('reset-pass')).toHaveLength(0);
	});

	test('a successful reset returns to the login page', async ({ page, api }) => {
		await requestToken(page, api);

		await page.locator('input[placeholder="one-time code"]').fill('123456');
		await page.locator('input[placeholder="new password"]').fill('password123');
		await page.locator('input[placeholder="confirm new password"]').fill('password123');
		await page.locator('input[placeholder="confirm new password"]').blur();
		await page.getByRole('button', { name: 'Reset Password' }).click();

		const call = await api.waitForCall('reset-pass');
		expect(call.variables).toEqual({
			email: 'sam@example.com',
			token: '123456',
			password: 'password123'
		});
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText(
			'Your password has been updated'
		);
	});

	test('an invalid token surfaces the failure message', async ({ page, api }) => {
		await requestToken(page, api);
		api.respond('reset-pass', () => ({
			data: {
				redeemUserPasswordResetToken: { code: 'FAILURE', message: 'The token is invalid.' }
			}
		}));

		await page.locator('input[placeholder="one-time code"]').fill('999999');
		await page.locator('input[placeholder="new password"]').fill('password123');
		await page.locator('input[placeholder="confirm new password"]').fill('password123');
		await page.locator('input[placeholder="confirm new password"]').blur();
		await page.getByRole('button', { name: 'Reset Password' }).click();

		await api.waitForCall('reset-pass');
		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('The token is invalid.');
		await expect(page).toHaveURL(/\/reset$/);
	});
});

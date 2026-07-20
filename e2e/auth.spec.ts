import { expect, test } from './support/mockApi';

test.describe('authentication', () => {
	test('logged-out visitors are redirected to the login page', async ({ page, api }) => {
		api.logInAs(null);

		await page.goto('/');

		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
	});

	test('the site nav is hidden without a session', async ({ page, api }) => {
		api.logInAs(null);

		await page.goto('/login');

		// sl-button with an href renders as a link.
		await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();
		await expect(page.locator('#site-nav nav')).toHaveCount(0);
	});

	test('logging in submits credentials and lands on My Team', async ({ page, api }) => {
		api.logInAs(null);
		await page.goto('/login');

		// Plain CSS pierces the shadow DOM straight to the real <input>; the
		// sl-input host would double-match a placeholder lookup.
		await page.locator('input[placeholder="Email"]').fill('sam@example.com');
		await page.locator('input[placeholder="Password"]').fill('extremely-secret');
		await page.getByRole('button', { name: 'Submit' }).click();

		const call = await api.waitForCall('begin-session');
		expect(call.variables).toEqual({ identity: 'sam@example.com', secret: 'extremely-secret' });

		await expect(page).toHaveURL('/');
		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('Welcome, Sam Owner');
		await expect(page.locator('#site-nav nav')).toBeVisible();
	});

	test('a failed login shows the backend message and stays on the form', async ({ page, api }) => {
		api.logInAs(null);
		api.respond('begin-session', () => ({
			data: { authenticateUserWithPassword: { message: 'Authentication failed.' } }
		}));
		await page.goto('/login');

		await page.locator('input[placeholder="Email"]').fill('sam@example.com');
		await page.locator('input[placeholder="Password"]').fill('wrong-password');
		await page.getByRole('button', { name: 'Submit' }).click();

		await expect(page.locator('.sl-toast-stack sl-alert')).toContainText('Authentication failed.');
		await expect(page).toHaveURL(/\/login$/);
	});

	test('logging out ends the session and returns to login', async ({ page, api }) => {
		await page.goto('/');
		await expect(page.locator('#site-nav nav')).toBeVisible();

		await page.getByRole('button', { name: 'Log Out' }).click();

		await api.waitForCall('end-session');
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();
	});
});

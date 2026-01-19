import { test, expect } from '@playwright/test';

const shopBaseUrl = process.env.NEXT_PUBLIC_SHOP_API_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL
    || 'http://localhost:3000/api';
const sdetBaseUrl = process.env.NEXT_PUBLIC_SDET_API_BASE_URL || 'http://localhost:3100/api';

test.describe('Refactor separation', () => {
    test('routes shop and SDET traffic to separate backends', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const shopRequestPromise = page.waitForRequest((req) => {
            const url = req.url();
            return url.startsWith(shopBaseUrl) && (url.includes('/products') || url.includes('/categories'));
        }, { timeout: 15000 });

        await page.getByText('SETS').click();
        const shopRequest = await shopRequestPromise;
        expect(shopRequest.url()).toContain(shopBaseUrl);

        await page.getByTitle('Register / Login').click();
        const authDialog = page.getByRole('dialog');
        await authDialog.getByRole('button', { name: 'Need an account? Register' }).click();

        const email = `sdet.${Date.now()}@dojo.com`;
        await authDialog.getByLabel('Email').fill(email);
        await authDialog.getByLabel('Password').fill('Passw0rd!');
        await authDialog.getByLabel('Name (optional)').fill('Refactor Check');

        const registerRequest = page.waitForRequest((req) => {
            const url = req.url();
            return url.startsWith(sdetBaseUrl) && url.includes('/sdet/auth/register');
        });
        await authDialog.getByRole('button', { name: 'REGISTER', exact: true }).click();

        const registerReq = await registerRequest;
        expect(registerReq.url()).toContain(sdetBaseUrl);
        if (await authDialog.isVisible()) {
            await authDialog.getByRole('button', { name: 'Close' }).click();
        }
    });
});

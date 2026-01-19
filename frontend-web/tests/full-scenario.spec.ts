import { test, expect } from '@playwright/test';

test.describe('Full Shop Scenario', () => {
    test.setTimeout(180000);

    const authHost = process.env.NEXT_PUBLIC_SHOP_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    const testUser = {
        email: 'test.user@example.com',
        password: '123456',
    };

    test.beforeAll(async ({ request }) => {
        const signUpUrl = `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;
        const signUpRes = await request.post(signUpUrl, {
            data: {
                email: testUser.email,
                password: testUser.password,
                returnSecureToken: true,
            },
        });

        if (!signUpRes.ok()) {
            const payload = await signUpRes.json().catch(() => null);
            const message = payload?.error?.message;
            if (message !== 'EMAIL_EXISTS') {
                throw new Error(`Failed to prepare test user: ${message || signUpRes.status()}`);
            }
        }
    });

    test('should complete full user journey', async ({ page }) => {
        page.on('console', msg => {
            console.log(`PAGE ${msg.type().toUpperCase()}:`, msg.text());
        });

        const handleCartMergePrompt = async () => {
            const mergeModal = page.getByRole('dialog', { name: 'Choose which cart to keep' });
            if (await mergeModal.isVisible()) {
                await mergeModal.getByRole('button', { name: 'Use saved cart' }).click();
            }
        };

        const openCart = async () => {
            await page.locator('header button svg.lucide-shopping-cart').locator('..').click();
        };

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Logout
        const userBtn = page.getByTitle('Account');
        if (await userBtn.isVisible()) {
            await userBtn.click();
            const logoutBtn = page.getByText('Logout');
            if (await logoutBtn.isVisible()) {
                await logoutBtn.click();
                await page.waitForTimeout(1000);
            } else if (page.url().includes('/login')) {
                await page.goto('/');
            }
        }

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);
        await page.click('button:has-text("CONTINUE")');
        await expect(page).toHaveURL('/');
        await handleCartMergePrompt();

        // Clear Cart
        await openCart();
        const itemsInCart = page.getByTestId('cart-item');
        let itemCount = await itemsInCart.count();
        while (itemCount > 0) {
            await itemsInCart.first().getByTestId('remove-btn').click();
            await expect(itemsInCart).toHaveCount(itemCount - 1);
            itemCount = await itemsInCart.count();
        }
        await page.locator('button:has(svg.lucide-x)').first().click();

        // Add Items
        const store = page.getByTestId('store-section');
        const products = store.getByTestId('product-card');
        const listProducts = page.getByTestId('product-list-scroll').getByTestId('product-card');
        await expect(products.first()).toBeVisible({ timeout: 20000 });

        const setProductQty = async (index: number, TargetQty: number) => {
            const product = products.nth(index);
            await product.scrollIntoViewIfNeeded();

            await product.getByTestId('add-btn').click();

            if (TargetQty > 1) {
                for (let i = 1; i < TargetQty; i++) {
                    await product.hover();
                    const plusBtn = product.getByTestId('increment-btn');
                    await plusBtn.click({ force: true });
                    await page.waitForTimeout(200);
                }
            }
        }

        await setProductQty(0, 1);
        await setProductQty(1, 2);
        await setProductQty(2, 3);

        // Verifications
        await openCart();
        await expect(itemsInCart).toHaveCount(3);

        await itemsInCart.nth(0).locator('button:has(svg.lucide-minus)').click();
        await expect(itemsInCart).toHaveCount(2);

        const img = itemsInCart.nth(0).locator('img');
        await expect(img).toBeVisible();
        await expect(img).toHaveJSProperty('complete', true);

        await page.locator('button:has(svg.lucide-x)').first().click();

        // Category
        await page.getByText('SETS').click();
        await page.waitForTimeout(2000);
        await expect(listProducts.first()).toBeVisible();
        await listProducts.first().scrollIntoViewIfNeeded();
        await listProducts.first().getByTestId('add-btn').click({ force: true });

        await openCart();
        await expect(itemsInCart).toHaveCount(3);
        await page.locator('button:has(svg.lucide-x)').first().click();

        // Logout/Login
        await userBtn.click();
        await page.getByText('Logout').click();
        await page.waitForTimeout(1000);

        // Add item as guest to trigger merge prompt on login
        await products.first().getByTestId('add-btn').click();

        await page.goto('/login');
        await page.fill('input[type="email"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);
        await page.click('button:has-text("CONTINUE")');
        await handleCartMergePrompt();

        // Final Checkout
        await openCart();
        await expect(itemsInCart).toHaveCount(3);
        await page.getByRole('button', { name: 'CHECKOUT' }).click();

        await expect(page.locator('h2:has-text("CHECKOUT")')).toBeVisible();
        await page.fill('input[placeholder*="0000"]', '9999999999999999');
        await page.click('button:has-text("PAY")');

        await expect(page.getByText('ORDER SUCCESSFUL!')).toBeVisible({ timeout: 20000 });
        console.log('Test Passed!');
    });
});

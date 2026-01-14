import { test, expect } from '@playwright/test';

test.describe('Full Shop Scenario', () => {
    test.setTimeout(180000);

    test('should complete full user journey', async ({ page }) => {
        page.on('console', msg => {
            console.log(`PAGE ${msg.type().toUpperCase()}:`, msg.text());
        });

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
            }
        }

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test.user@example.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button:has-text("CONTINUE")');
        await expect(page).toHaveURL('/');

        // Clear Cart
        await page.locator('header button svg.lucide-shopping-cart').locator('..').click();
        const itemsInCart = page.locator('div[class*="CartDrawer_item__"]');
        let itemCount = await itemsInCart.count();
        while (itemCount > 0) {
            await itemsInCart.first().locator('button:has(svg.lucide-trash-2)').click();
            await page.waitForTimeout(400);
            itemCount = await itemsInCart.count();
        }
        await page.locator('button:has(svg.lucide-x)').first().click();

        // Add Items
        const products = page.locator('[data-testid="product-card"]');
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
        await page.locator('header button svg.lucide-shopping-cart').locator('..').click();
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
        await expect(products.first()).toBeVisible();
        await products.first().getByTestId('add-btn').click();

        // Logout/Login
        await userBtn.click();
        await page.getByText('Logout').click();
        await page.waitForTimeout(1000);
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test.user@example.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button:has-text("CONTINUE")');

        // Final Checkout
        await page.locator('header button svg.lucide-shopping-cart').locator('..').click();
        await expect(itemsInCart).toHaveCount(3);
        await page.getByText('CHECKOUT').click();

        await expect(page.locator('h2:has-text("CHECKOUT")')).toBeVisible();
        await page.fill('input[placeholder*="0000"]', '4242424242424242');
        await page.click('button:has-text("PAY")');

        await expect(page.getByText('ORDER SUCCESSFUL!')).toBeVisible({ timeout: 20000 });
        console.log('Test Passed!');
    });
});

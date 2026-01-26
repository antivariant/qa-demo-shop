import { test, expect } from '@playwright/test';

test.describe('Full Shop Scenario', () => {
    test.setTimeout(180000);

    test('should complete full user journey', async ({ page }, testInfo) => {
        const uniqueId = `${Date.now()}-${testInfo.retry}`;
        const testUser = {
            email: `user.${uniqueId}.sandbox@example.com`,
            password: '123456',
        };
        const handleCartMergePrompt = async () => {
            const mergeModal = page.getByRole('dialog', { name: 'Choose which cart to keep' });
            if (await mergeModal.isVisible()) {
                await mergeModal.getByRole('button', { name: 'Use saved cart' }).click();
            }
        };

        const cartButton = page.locator('header button svg.lucide-shopping-cart').locator('..');
        const openUserMenu = async () => {
            await page.evaluate(() => {
                const btn = document.querySelector('header button[title="Account"]') as HTMLButtonElement | null;
                btn?.click();
            });
        };
        const logoutIfLoggedIn = async () => {
            await openUserMenu();
            const logoutBtn = page.getByText('Logout');
            if (await logoutBtn.isVisible()) {
                await logoutBtn.click();
                await page.waitForTimeout(1000);
            }
        };
        const goToStore = async () => {
            const testShopLink = page.getByText('TEST SHOP', { exact: true });
            await testShopLink.click();
            await page.getByTestId('store-section').scrollIntoViewIfNeeded();
        };
        const openCart = async () => {
            if (!(await cartButton.isVisible())) {
                await goToStore();
            }
            await cartButton.waitFor({ state: 'attached' });
            await page.evaluate(() => {
                const btn = document.querySelector('header button svg.lucide-shopping-cart')?.closest('button') as HTMLButtonElement | null;
                btn?.click();
            });
            await expect(page.getByTestId('cart-drawer')).toBeVisible();
        };
        const closeCart = async () => {
            const cartDrawer = page.getByTestId('cart-drawer');
            if (!(await cartDrawer.isVisible())) {
                return;
            }
            await page.evaluate(() => {
                const drawer = document.querySelector('[data-testid="cart-drawer"]');
                const closeBtn = drawer?.querySelector('button[aria-label="Close cart"]') as HTMLButtonElement | null;
                closeBtn?.click();
            });
            await expect(cartDrawer).toBeHidden();
        };
        const selectCategory = async (label: string) => {
            await page.evaluate((targetLabel) => {
                const buttons = Array.from(document.querySelectorAll('header button'));
                const btn = buttons.find((button) => button.textContent?.trim() === targetLabel) as HTMLButtonElement | undefined;
                btn?.click();
            }, label);
        };

        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.addStyleTag({ content: '* { scroll-behavior: auto !important; }' });

        // Logout
        await logoutIfLoggedIn();

        // Register
        await page.goto('/login');
        await page.getByText('Sign up').click();

        const registerModal = page.getByRole('dialog');
        await registerModal.getByPlaceholder('chef@dojo.com').fill(testUser.email);
        await registerModal.getByPlaceholder('••••••••').fill(testUser.password);
        await registerModal.getByPlaceholder('Your display name').fill('Test User');
        await registerModal.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
        await page.waitForURL('/', { timeout: 20000 }).catch(() => undefined);
        await expect(registerModal).toBeHidden({ timeout: 20000 });

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
        await closeCart();

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

        await closeCart();

        // Category
        await goToStore();
        await selectCategory('SETS');
        await page.waitForTimeout(2000);
        await expect(listProducts.first()).toBeVisible();
        await listProducts.first().scrollIntoViewIfNeeded();
        await listProducts.first().getByTestId('add-btn').click({ force: true });

        await openCart();
        await expect(itemsInCart).toHaveCount(3);
        await closeCart();

        // Logout/Login
        await goToStore();
        await openUserMenu();
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

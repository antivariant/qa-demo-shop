import { test, expect } from '@playwright/test';

/**
 * Store Section Scroll Behavior Test
 * 
 * Verifies that:
 * 1. When the Store section is "docked" (top aligned with header at 80px),
 *    scrolling should move the product list ONLY, not the page.
 * 2. When the list reaches top/bottom, page scroll should resume.
 * 3. The Store section should stay locked at 80px while list scrolls.
 */

test.describe('Store Scroll Behavior', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/'); // Use baseURL from config
        // Wait for the page to load
        await page.waitForSelector('[data-testid="store-section"]');
    });

    test('should lock Store section at 80px when docked', async ({ page }) => {
        // Calculate exact scroll position to dock Store at 80px
        const scrollPosition = await page.evaluate(() => {
            const store = document.querySelector('[data-testid="store-section"]');
            if (!store) return 0;
            const rect = store.getBoundingClientRect();
            const main = document.querySelector('[data-testid="main-container"]') as HTMLElement;
            if (!main) return 0;
            // Current scroll + how far Store is from top (rect.top) - desired position (80px)
            return main.scrollTop + rect.top - 80;
        });

        // Scroll to exact position
        await page.evaluate((pos) => {
            const main = document.querySelector('[data-testid="main-container"]') as HTMLElement;
            if (main) main.scrollTop = pos;
        }, scrollPosition);

        await page.waitForTimeout(500);

        // Verify Store is now at 80px
        const initialTop = await page.evaluate(() => {
            const store = document.querySelector('[data-testid="store-section"]');
            return store?.getBoundingClientRect().top;
        });

        console.log('Initial Store top:', initialTop);
        expect(Math.abs((initialTop || 0) - 80)).toBeLessThan(25); // Within 25px

        // Scroll down multiple times using wheel events on the store section
        const storeSection = page.locator('[data-testid="store-section"]');

        for (let i = 0; i < 5; i++) {
            await storeSection.hover();
            await page.mouse.wheel(0, 100);
            await page.waitForTimeout(100);
        }

        // Verify Store position hasn't changed significantly
        const afterScrollTop = await page.evaluate(() => {
            const store = document.querySelector('[data-testid="store-section"]');
            return store?.getBoundingClientRect().top;
        });

        console.log('After scroll Store top:', afterScrollTop);

        // The section should still be docked at ~80px (within tolerance)
        expect(Math.abs((afterScrollTop || 0) - 80)).toBeLessThan(30);
    });

    test('should scroll product list when Store is docked', async ({ page }) => {
        // Dock the Store section
        await page.evaluate(() => {
            const main = document.querySelector('[data-testid="main-container"]') as HTMLElement;
            if (main) {
                main.scrollTop = window.innerHeight - 100;
            }
        });

        await page.waitForTimeout(500);

        // Get initial list scroll position
        const initialListScroll = await page.evaluate(() => {
            const listContainer = document.querySelector('[data-testid="product-list-scroll"]') as HTMLElement;
            return listContainer?.scrollTop || 0;
        });

        // Scroll down
        const storeSection = page.locator('[data-testid="store-section"]');
        await storeSection.hover();
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(300);

        // Verify list scrolled
        const afterListScroll = await page.evaluate(() => {
            const listContainer = document.querySelector('[data-testid="product-list-scroll"]') as HTMLElement;
            return listContainer?.scrollTop || 0;
        });

        console.log('List scroll - before:', initialListScroll, 'after:', afterListScroll);
        expect(afterListScroll).toBeGreaterThan(initialListScroll);
    });

    test('should allow page scroll when list reaches bottom', async ({ page }) => {
        // Dock Store and scroll list to bottom
        await page.evaluate(() => {
            const main = document.querySelector('[data-testid="main-container"]') as HTMLElement;
            const listContainer = document.querySelector('[data-testid="product-list-scroll"]') as HTMLElement;

            if (main) main.scrollTop = window.innerHeight - 100;
            if (listContainer) {
                listContainer.scrollTop = listContainer.scrollHeight;
            }
        });

        await page.waitForTimeout(500);

        const initialPageScroll = await page.evaluate(() => {
            return document.querySelector('[data-testid="main-container"]')?.scrollTop || 0;
        });

        // Scroll down - should move page since list is at bottom
        const storeSection = page.locator('[data-testid="store-section"]');
        await storeSection.hover();
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(300);

        const afterPageScroll = await page.evaluate(() => {
            return document.querySelector('[data-testid="main-container"]')?.scrollTop || 0;
        });

        console.log('Page scroll - before:', initialPageScroll, 'after:', afterPageScroll);
        expect(afterPageScroll).toBeGreaterThan(initialPageScroll);
    });

    test('should allow page scroll when list reaches top', async ({ page }) => {
        // Dock Store and ensure list is at top
        await page.evaluate(() => {
            const main = document.querySelector('[data-testid="main-container"]') as HTMLElement;
            const listContainer = document.querySelector('[data-testid="product-list-scroll"]') as HTMLElement;

            if (main) main.scrollTop = window.innerHeight - 100;
            if (listContainer) listContainer.scrollTop = 0;
        });

        await page.waitForTimeout(500);

        const initialPageScroll = await page.evaluate(() => {
            return document.querySelector('[data-testid="main-container"]')?.scrollTop || 0;
        });

        // Scroll up - should move page since list is at top
        const storeSection = page.locator('[data-testid="store-section"]');
        await storeSection.hover();
        await page.mouse.wheel(0, -300);
        await page.waitForTimeout(300);

        const afterPageScroll = await page.evaluate(() => {
            return document.querySelector('[data-testid="main-container"]')?.scrollTop || 0;
        });

        console.log('Page scroll up - before:', initialPageScroll, 'after:', afterPageScroll);
        expect(afterPageScroll).toBeLessThan(initialPageScroll);
    });
});

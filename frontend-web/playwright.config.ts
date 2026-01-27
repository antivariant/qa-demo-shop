import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for QA Demo Shop
 * See https://playwright.dev/docs/test-configuration.
 */
const isCi = !!process.env.CI;
const defaultBaseUrl = isCi ? 'http://localhost:3030' : 'https://localhost:3030';

export default defineConfig({
    testDir: './tests',
    globalSetup: './tests/global-setup.ts',
    globalTeardown: './tests/global-teardown.ts',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.PLAYWRIGHT_BASE_URL || defaultBaseUrl,
        ignoreHTTPSErrors: !isCi,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

});

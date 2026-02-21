import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 60000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1, // Run sequentially for this test to avoid state issues
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
        screenshot: 'on',
        video: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});

import { test, expect } from '@playwright/test';

test.describe('UK Cookie Consent Banner', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage to simulate a new user
        await page.goto('/');
        await page.evaluate(() => window.localStorage.clear());
    });

    test('should display for new users and disappear when "Accept All" is clicked', async ({ page }) => {
        await page.goto('/');

        // 1. Verify banner is visible
        const banner = page.locator('text=We value your privacy');
        await expect(banner).toBeVisible();

        // 2. Verify link to existing Cookie Policy
        const policyLink = page.locator('a:has-text("Cookie Policy")');
        await expect(policyLink).toHaveAttribute('href', '/legal/cookies');

        // 3. Click Accept All
        const acceptButton = page.locator('button:has-text("Accept All")');
        await acceptButton.click();

        // 4. Verify banner disappears
        await expect(banner).not.toBeVisible();

        // 5. Verify local storage is set properly
        const consent = await page.evaluate(() => window.localStorage.getItem('cookieConsent'));
        expect(consent).toBe('accepted');

        // 6. Verify banner does not reappear on reload
        await page.reload();
        await expect(banner).not.toBeVisible();
    });

    test('should disappear and save preference when "Reject Non-Essential" is clicked', async ({ page }) => {
        await page.goto('/');

        const banner = page.locator('text=We value your privacy');
        await expect(banner).toBeVisible();

        const rejectButton = page.locator('button:has-text("Reject Non-Essential")');
        await rejectButton.click();

        await expect(banner).not.toBeVisible();

        const consent = await page.evaluate(() => window.localStorage.getItem('cookieConsent'));
        expect(consent).toBe('rejected');

        await page.reload();
        await expect(banner).not.toBeVisible();
    });
});

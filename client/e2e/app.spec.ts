import { test, expect } from '@playwright/test';

test.describe('Transmittal App User Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Set local storage to bypass "Welcome Modal"
        await page.addInitScript(() => {
            window.localStorage.setItem('hasSeenWelcome_test_user_123', 'true');
        });
    });

    test('Complete User Journey', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        // 1. Visit App Dashboard (Mock Auth handles login)
        console.log('Navigating to dashboard...');
        await page.goto('/app');

        // Check title
        await expect(page).toHaveTitle(/Transmit.AI/);

        // 2. Welcome Modal is bypassed via localStorage

        // 3. Verify Dashboard Empty State
        console.log('Verifying Dashboard Empty State...');
        await expect(page.getByText('No documents yet')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Upload Your First Document' })).toBeVisible();

        // 4. Navigate to Upload
        await page.getByRole('button', { name: 'Upload Your First Document' }).click();
        await expect(page).toHaveURL(/\/app\/upload/);

        // Check Guidance
        await expect(page.getByText('Supported Formats')).toBeVisible();

        // 5. Upload File
        console.log('Uploading file...');
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles('test-upload.pdf');

        // Verify file in list
        await expect(page.getByText('test-upload.pdf')).toBeVisible();

        // 6. Process File
        console.log('Processing file...');
        const processButton = page.getByRole('button', { name: 'Start AI Extraction' });
        await processButton.click();

        // Check loading state
        await expect(page.getByText('Processing')).toBeVisible();

        // Wait for results
        await expect(page.getByText('Extraction Results')).toBeVisible({ timeout: 15000 });

        // 7. Verify Results
        console.log('Verifying results...');
        await expect(page.getByText('test-upload.pdf')).toBeVisible();
        // Check for "AI" badge
        await expect(page.getByText('AI', { exact: true })).toBeVisible();

        // 8. Test Export
        console.log('Testing Export...');
        // There are multiple "Export Excel" buttons? No, just one in the results header.
        await page.getByRole('button', { name: 'Export Excel' }).click();

        // Verify Toast Success
        const toast = page.locator('.bg-green-50').first();
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('Exported');

        // 9. Return to Dashboard and Verify Data
        console.log('Returning to Dashboard...');
        // Click logo or dashboard link?
        // Let's use the explicit "Dashboard" link in sidebar or just go back
        await page.goto('/app');

        // Verify populated dashboard
        // Should see a transmittal card
        // The default transmittal title logic might group them or put them in "Unsorted Uploads" if no title set.
        // In UploadPage we didn't set a title, so it might be "Unsorted Uploads" or empty string if logic handles it.
        // Let's check for "Docs" count or the filename in the detailed view if "Unsorted" isn't a transmittal.
        // Dashboard logic:
        // Object.entries(transmittals).map(([title, docs])
        // If title is empty/undefined, it groups by that key.

        // Let's just check that "No documents yet" is GONE.
        await expect(page.getByText('No documents yet')).not.toBeVisible();

        // 10. Test Delete
        console.log('Testing Delete...');
        // Find a delete button (trash can)
        // The dashboard has delete buttons for Transmittals AND Documents.
        // Let's delete the Transmittal (there should be one card).
        const deleteTransmittalBtn = page.locator('button[title="Delete Transmittal"]').first();
        await deleteTransmittalBtn.click();

        // Check Confirmation Modal
        const deleteModalTitle = page.locator('text=Delete Transmittal?');
        await expect(deleteModalTitle).toBeVisible();
        await expect(page.locator('text=This will delete all 1 documents')).toBeVisible();

        // Confirm Delete
        await page.getByRole('button', { name: 'Delete', exact: true }).click();

        // Verify Loading state on button? Hard to catch.
        await expect(page.locator('text=Deleted transmittal')).toBeVisible();

        // Verify Empty State Returns
        await expect(page.getByText('No documents yet')).toBeVisible();

        console.log('Test Complete!');
    });
});

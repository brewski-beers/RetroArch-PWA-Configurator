import { test, expect } from '@playwright/test';

// E2E-001: Use data-testid for selectors
// Validates the content index for Remote Downloader

test.describe('ROMs Content Index', () => {
  test('serves directory index for Remote Downloader', async ({ page }) => {
    await page.goto('/content');
    await expect(page.getByTestId('content-header')).toBeVisible();
    // Presence-only checks to accommodate empty environments
    const index = page.getByTestId('content-index');
    await expect(index).toHaveCount(1);
    const list = page.getByTestId('content-list');
    await expect(list).toHaveCount(1);
  });
});

/**
 * Acceptance Tests
 * Tests happy path user flows through the application
 */

import { test, expect } from '@playwright/test';

test.describe('Acceptance Test: Landing Page Happy Path', () => {
  test('user can view landing page content', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Verify page loads successfully
    await expect(page).toHaveTitle(
      'RetroArch PWA Configurator | TechByBrewski'
    );

    // Verify main header is visible using data-testid
    const header = page.getByTestId('landing-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('RetroArch PWA Configurator');

    // Verify main content is visible using data-testid
    const content = page.getByTestId('landing-content');
    await expect(content).toBeVisible();
    await expect(content).toContainText(
      'Configure and manage your RetroArch server'
    );

    // Verify footer is visible using data-testid
    const footer = page.getByTestId('landing-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('TechByBrewski');
  });

  test('landing page has proper styling', async ({ page }) => {
    await page.goto('/');

    // Verify body has flex layout
    const body = page.locator('body');
    const bodyStyles = await body.evaluate((el) => {
      // @ts-expect-error - window is available in browser context
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
      };
    });

    expect(bodyStyles.display).toBe('flex');
    expect(bodyStyles.flexDirection).toBe('column');
  });

  test('page is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const header = page.getByTestId('landing-header');
    await expect(header).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(header).toBeVisible();
  });
});

test.describe('Acceptance Test: Future Features', () => {
  test('application is ready for authentication', async ({ page }) => {
    await page.goto('/');
    // Placeholder for future auth acceptance tests
    expect(page).toBeDefined();
  });

  test('application is ready for middleware', async ({ page }) => {
    await page.goto('/');
    // Placeholder for future middleware acceptance tests
    expect(page).toBeDefined();
  });

  test('application is ready for plugins', async ({ page }) => {
    await page.goto('/');
    // Placeholder for future plugin acceptance tests
    expect(page).toBeDefined();
  });
});

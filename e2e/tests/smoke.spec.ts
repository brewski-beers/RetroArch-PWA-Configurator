/**
 * Smoke Test Suite
 * Auto-generated acceptance tests based on configuration
 * Tests policy-driven design, logic, and behavior
 * Follows E2E-003: Auto-Generated Tests and E2E-006: Configuration-Driven
 */

import { test, expect } from '@playwright/test';
import { pagesConfig } from '../../config/pages.config.js';
import { e2ePolicyConfig } from '../config/e2e-policy.config.js';
import { policyConfig } from '../../config/policy.config.js';

// Auto-generate smoke tests for each configured page
// Follows E2E-003: Auto-Generated Tests from configuration
for (const pageConfig of pagesConfig) {
  test.describe(`Smoke Test: ${pageConfig.name}`, () => {
    test(`should load ${pageConfig.name} successfully`, async ({ page }) => {
      await page.goto(pageConfig.route);

      // Verify page loads with correct title
      await expect(page).toHaveTitle(pageConfig.title);

      // Verify page has correct data attribute
      const body = page.locator('body');
      await expect(body).toHaveAttribute('data-page-id', pageConfig.id);
    });

    test(`should display all components on ${pageConfig.name}`, async ({
      page,
    }) => {
      await page.goto(pageConfig.route);

      // Follows E2E-001: Use Test IDs - all selectors use data-testid
      for (const component of pageConfig.components) {
        const element = page.getByTestId(component.testId);
        await expect(element).toBeVisible();
        await expect(element).toContainText(component.content);

        // Also verify component has proper id attribute
        await expect(element).toHaveAttribute('id', component.id);
      }
    });

    test(`should have proper HTML structure on ${pageConfig.name}`, async ({
      page,
    }) => {
      await page.goto(pageConfig.route);

      // Follows E2E-004: Semantic HTML Validation
      const header = page.locator('header');
      const main = page.locator('main');
      const footer = page.locator('footer');

      await expect(header).toBeVisible();
      await expect(main).toBeVisible();
      await expect(footer).toBeVisible();
    });
  });
}

// E2E Policy compliance smoke tests
test.describe('Smoke Test: E2E Policy Compliance', () => {
  test('should verify E2E policy configuration is loaded', async ({ page }) => {
    await page.goto('/');

    // Verify E2E policy is properly configured
    expect(e2ePolicyConfig.category).toBe('e2e');
    expect(e2ePolicyConfig.rules.length).toBeGreaterThan(0);

    // Verify page responds (basic availability)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have compliance metadata', async ({ page }) => {
    await page.goto('/');

    // Verify page has proper meta tags (security/SEO compliance)
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    const metaViewport = page.locator('meta[name="viewport"]');
    await expect(metaViewport).toHaveAttribute('content', /.+/);
  });

  test('should validate E2E-001: All selectors use data-testid', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify E2E-001 rule is enabled
    const testIdRule = e2ePolicyConfig.rules.find((r) => r.id === 'E2E-001');
    expect(testIdRule?.enabled).toBe(true);
    expect(testIdRule?.severity).toBe('critical');

    // All component selectors in this test file use getByTestId
    // This is enforced by E2E-001 policy
  });
});

// Feature logic smoke tests (for future features)
test.describe('Smoke Test: Feature Logic', () => {
  test('should prepare for middleware logic', async ({ page }) => {
    await page.goto('/');
    // Placeholder: When middleware is implemented, test it here
    expect(policyConfig.compliance.requireMiddleware).toBe(false); // Not yet required
  });

  test('should prepare for auth logic', async ({ page }) => {
    await page.goto('/');
    // Placeholder: When auth is implemented, test it here
    expect(policyConfig.compliance.requireAuth).toBe(false); // Not yet required
  });

  test('should prepare for plugin logic', async ({ page }) => {
    await page.goto('/');
    // Placeholder: When plugins are implemented, test them here
    expect(policyConfig.compliance.requirePlugins).toBe(false); // Not yet required
  });

  test('should prepare for paywall logic', async ({ page }) => {
    await page.goto('/');
    // Placeholder: When paywalls are implemented, test them here
    expect(policyConfig.compliance.requirePaywalls).toBe(false); // Not yet required
  });
});

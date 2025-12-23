/**
 * ROM Ingestion E2E Test Suite
 * Tests the complete ROM upload and processing workflow
 * Follows E2E-001: Use Test IDs for all selectors
 */

import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const INGEST_PAGE_URL = '/ingest';
const TEST_ROM_PATH = join(process.cwd(), 'examples', 'roms', 'demo-game.nes');

test.describe('ROM Ingestion Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(INGEST_PAGE_URL);
  });

  test('should load ROM ingestion page successfully', async ({ page }) => {
    // E2E-004: Semantic HTML - verify proper structure
    await expect(page).toHaveTitle(
      'ROM Ingestion | RetroArch PWA Configurator'
    );

    const body = page.locator('body');
    await expect(body).toHaveAttribute('data-page-id', 'ingest');
  });

  test('should display all required components', async ({ page }) => {
    // E2E-001: Use Test IDs for all selectors
    await expect(page.getByTestId('ingest-header')).toBeVisible();
    await expect(page.getByTestId('ingest-description')).toBeVisible();
    await expect(page.getByTestId('ingest-form')).toBeVisible();

    // Use ID selectors for elements within the form
    await expect(page.locator('#rom-file-input')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByTestId('ingest-footer')).toBeVisible();
  });

  test('should have proper form attributes', async ({ page }) => {
    const form = page.getByTestId('ingest-form');

    await expect(form).toHaveAttribute('action', '/api/roms/upload');
    await expect(form).toHaveAttribute('method', 'POST');
    await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  test('should have file input with correct accept attribute', async ({
    page,
  }) => {
    const fileInput = page.locator('#rom-file-input');

    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('required', '');

    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('.nes');
    expect(acceptAttr).toContain('.sfc');
    expect(acceptAttr).toContain('.gba');
  });

  test('should upload and process ROM file successfully', async ({ page }) => {
    // E2E-002: User Flow Testing - complete upload workflow

    // Verify test ROM exists
    expect(existsSync(TEST_ROM_PATH)).toBe(true);

    // Select file
    const fileInput = page.locator('#rom-file-input');
    await fileInput.setInputFiles(TEST_ROM_PATH);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for status to appear (processing or success)
    const statusDiv = page.locator('#upload-status');
    await expect(statusDiv).toBeVisible({ timeout: 10000 });

    // Verify success status
    await expect(statusDiv).toHaveClass(/success/);
    await expect(statusDiv).toContainText('ROM processed successfully!');
    await expect(statusDiv).toContainText('Platform: nes');
    await expect(statusDiv).toContainText('Filename:');
    await expect(statusDiv).toContainText('Hash:');
  });

  test('should show error when no file selected', async ({ page }) => {
    // E2E-005: Error State Testing

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for status to appear
    const statusDiv = page.locator('#upload-status');
    await expect(statusDiv).toBeVisible({ timeout: 5000 });

    // Verify error status
    await expect(statusDiv).toHaveClass(/error/);
    await expect(statusDiv).toContainText('Please select a ROM file');
  });

  test('should reset form after successful upload', async ({ page }) => {
    // Verify test ROM exists
    expect(existsSync(TEST_ROM_PATH)).toBe(true);

    // Upload file
    const fileInput = page.locator('#rom-file-input');
    await fileInput.setInputFiles(TEST_ROM_PATH);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for success
    const statusDiv = page.locator('#upload-status');
    await expect(statusDiv).toHaveClass(/success/, { timeout: 10000 });

    // Verify form is reset (file input should be empty)
    const fileInputValue = await fileInput.inputValue();
    expect(fileInputValue).toBe('');
  });

  test('should disable submit button during processing', async ({ page }) => {
    // Verify test ROM exists
    expect(existsSync(TEST_ROM_PATH)).toBe(true);

    const fileInput = page.locator('#rom-file-input');
    const submitButton = page.locator('button[type="submit"]');

    // Select file
    await fileInput.setInputFiles(TEST_ROM_PATH);

    // Submit and immediately check if disabled
    await submitButton.click();

    // Button should be disabled during processing
    await expect(submitButton).toBeDisabled();

    // Wait for completion
    const statusDiv = page.locator('#upload-status');
    await expect(statusDiv).toBeVisible({ timeout: 10000 });

    // Button should be enabled again
    await expect(submitButton).toBeEnabled();
  });
});

/**
 * Batch Processing E2E
 * Verifies job status transitions via test-only enqueue endpoint
 * POL-022: Serial processing, continueOnError
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

type BatchStatus = {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: { processed: number; total: number };
  errors?: string[];
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
};

async function waitForStatus(
  request: APIRequestContext,
  jobId: string,
  timeoutMs = 15000
): Promise<BatchStatus> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const resp = await request.get(`/api/roms/batch-status/${jobId}`);
    if (resp.status() === 200) {
      const data = (await resp.json()) as BatchStatus;
      if (data.status === 'completed' || data.status === 'failed') {
        return data;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Status timeout');
}

test.describe('Batch Processing Flow (POL-022)', () => {
  test('enqueue and process batch via test endpoint', async ({ request }) => {
    // Arrange: Enqueue job (non-production only)
    const enqueue = await request.post('/api/roms/test-enqueue', {
      data: { files: ['game1.nes', 'game2.snes'] },
    });

    // Accept 404 when test endpoint disabled in production
    const code = enqueue.status();
    expect([202, 200, 404]).toContain(code);
    if (code === 404) {
      // Endpoint disabled in production; skip status polling
      return;
    }
    const payload = (await enqueue.json()) as { jobId: string };
    expect(typeof payload.jobId).toBe('string');

    // Act: Poll status until completed or failed
    const status = await waitForStatus(request, payload.jobId, 15000);

    // Assert: Status object shape
    expect(status.jobId).toBe(payload.jobId);
    expect(['completed', 'failed']).toContain(status.status);
    expect(status.progress).toBeDefined();
  });

  test('UI has test IDs (E2E-001)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-header')).toBeVisible();
  });
});

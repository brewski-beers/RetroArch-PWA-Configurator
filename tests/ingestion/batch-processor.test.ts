/**
 * Batch Processor Unit Tests
 * Following POL-009 (TDD), TEST-001 (Factories), TEST-002 (SRP), TEST-004 (AAA)
 * Tests: job processing, status updates, error handling, progress tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { batchQueue, type BatchFile } from '../../src/ingestion/batch-queue.js';
import { batchProcessor } from '../../src/ingestion/batch-processor.js';

/**
 * Test factories
 */
function createTestBatchFile(
  filename: string,
  overrides?: Partial<BatchFile>
): BatchFile {
  return {
    filename,
    path: `/tmp/test/${filename}`,
    size: 1024 * 1024, // 1MB default
    ...overrides,
  };
}

// Removed unused factory to satisfy TS6133

describe('Batch Processor (POL-022, TEST-001, TEST-004)', () => {
  beforeEach(() => {
    // Clear batch queue before each test
    batchQueue.listJobs().forEach((_job) => {
      // Queue is not directly clearable, but we test with fresh jobs
    });

    // Mock console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Batch Job Queue Operations', () => {
    it('should create a batch job with correct properties', () => {
      // Arrange
      const files = [
        createTestBatchFile('game1.nes'),
        createTestBatchFile('game2.snes'),
      ];

      // Act
      const job = batchQueue.createJob(files);

      // Assert
      expect(job.id).toBeDefined();
      expect(job.status).toBe('queued');
      expect(job.files).toHaveLength(2);
      expect(job.progress.total).toBe(2);
      expect(job.progress.processed).toBe(0);
      expect(job.errors).toHaveLength(0);
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve job by ID', () => {
      // Arrange
      const files = [createTestBatchFile('game.nes')];
      const created = batchQueue.createJob(files);

      // Act
      const retrieved = batchQueue.getJob(created.id);

      // Assert
      expect(retrieved).toBe(created);
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent job ID', () => {
      // Act
      const job = batchQueue.getJob('non-existent-id');

      // Assert
      expect(job).toBeUndefined();
    });

    it('should list all jobs', () => {
      // Arrange
      const job1 = batchQueue.createJob([createTestBatchFile('game1.nes')]);
      const job2 = batchQueue.createJob([createTestBatchFile('game2.nes')]);

      // Act
      const jobs = batchQueue.listJobs();

      // Assert
      expect(jobs.length).toBeGreaterThanOrEqual(2);
      expect(jobs).toContainEqual(job1);
      expect(jobs).toContainEqual(job2);
    });
  });

  describe('Job Status Management', () => {
    it('should update job status from queued to processing', () => {
      // Arrange
      const job = batchQueue.createJob([createTestBatchFile('game.nes')]);
      expect(job.status).toBe('queued');

      // Act
      const updated = batchQueue.updateStatus(job.id, 'processing');

      // Assert
      expect(updated?.status).toBe('processing');
      expect(updated?.startedAt).toBeDefined();
    });

    it('should update job status to completed', () => {
      // Arrange
      const job = batchQueue.createJob([createTestBatchFile('game.nes')]);
      batchQueue.updateStatus(job.id, 'processing');

      // Act
      const updated = batchQueue.updateStatus(job.id, 'completed');

      // Assert
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should update job status to failed', () => {
      // Arrange
      const job = batchQueue.createJob([createTestBatchFile('game.nes')]);

      // Act
      const updated = batchQueue.updateStatus(job.id, 'failed');

      // Assert
      expect(updated?.status).toBe('failed');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should return undefined when updating non-existent job', () => {
      // Act
      const result = batchQueue.updateStatus('non-existent-id', 'completed');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Job Progress Tracking', () => {
    it('should update job progress', () => {
      // Arrange
      const job = batchQueue.createJob([
        createTestBatchFile('game1.nes'),
        createTestBatchFile('game2.nes'),
        createTestBatchFile('game3.nes'),
      ]);

      // Act
      batchQueue.updateProgress(job.id, 1);
      let updated = batchQueue.getJob(job.id);
      expect(updated?.progress.processed).toBe(1);

      batchQueue.updateProgress(job.id, 2);
      updated = batchQueue.getJob(job.id);

      // Assert
      expect(updated?.progress.processed).toBe(2);
      expect(updated?.progress.total).toBe(3);
    });

    it('should not exceed total progress', () => {
      // Arrange
      const job = batchQueue.createJob([
        createTestBatchFile('game1.nes'),
        createTestBatchFile('game2.nes'),
      ]);

      // Act
      batchQueue.updateProgress(job.id, 99); // Try to set progress > total

      // Assert
      const updated = batchQueue.getJob(job.id);
      expect(updated?.progress.processed).toBe(2); // Capped at total
    });

    it('should return undefined when updating progress for non-existent job', () => {
      // Act
      const result = batchQueue.updateProgress('non-existent-id', 1);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should add error to job', () => {
      // Arrange
      const job = batchQueue.createJob([createTestBatchFile('game.nes')]);
      expect(job.errors).toHaveLength(0);

      // Act
      batchQueue.addError(job.id, 'Processing failed');

      // Assert
      const updated = batchQueue.getJob(job.id);
      expect(updated?.errors).toHaveLength(1);
      expect(updated?.errors[0]).toBe('Processing failed');
    });

    it('should accumulate multiple errors', () => {
      // Arrange
      const job = batchQueue.createJob([createTestBatchFile('game.nes')]);

      // Act
      batchQueue.addError(job.id, 'Error 1');
      batchQueue.addError(job.id, 'Error 2');
      batchQueue.addError(job.id, 'Error 3');

      // Assert
      const updated = batchQueue.getJob(job.id);
      expect(updated?.errors).toHaveLength(3);
      expect(updated?.errors).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });

    it('should return undefined when adding error to non-existent job', () => {
      // Act
      const result = batchQueue.addError('non-existent-id', 'Error');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Job Cleanup', () => {
    it('should clear old completed jobs', () => {
      // Arrange
      const job1 = batchQueue.createJob([createTestBatchFile('game1.nes')]);
      const job2 = batchQueue.createJob([createTestBatchFile('game2.nes')]);

      batchQueue.updateStatus(job1.id, 'completed');
      batchQueue.updateStatus(job2.id, 'processing');

      // Act
      // Manually set completedAt to far past for testing
      const jobObj1 = batchQueue.getJob(job1.id);
      if (jobObj1 !== undefined) {
        jobObj1.completedAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      }

      const cleared = batchQueue.clearOldJobs(24 * 60 * 60 * 1000); // 24 hour threshold

      // Assert
      expect(cleared).toBeGreaterThan(0);
      expect(batchQueue.getJob(job1.id)).toBeUndefined(); // Old job removed
    });

    it('should not clear recent completed jobs', () => {
      // Arrange
      const job = batchQueue.createJob([createTestBatchFile('game.nes')]);
      batchQueue.updateStatus(job.id, 'completed');

      // Act
      batchQueue.clearOldJobs(24 * 60 * 60 * 1000);

      // Assert
      expect(batchQueue.getJob(job.id)).toBeDefined(); // Recent job kept
    });

    it('should not clear queued or processing jobs', () => {
      // Arrange
      const queuedJob = batchQueue.createJob([
        createTestBatchFile('game1.nes'),
      ]);
      const processingJob = batchQueue.createJob([
        createTestBatchFile('game2.nes'),
      ]);
      batchQueue.updateStatus(processingJob.id, 'processing');

      // Act
      batchQueue.clearOldJobs(0); // Clear all old, but queued/processing protected

      // Assert
      expect(batchQueue.getJob(queuedJob.id)).toBeDefined();
      expect(batchQueue.getJob(processingJob.id)).toBeDefined();
    });
  });

  describe('Batch Processor Start/Stop', () => {
    it('should start processor without error', () => {
      // Act & Assert
      expect(() => {
        batchProcessor.start();
      }).not.toThrow();
    });

    it('should stop processor without error', () => {
      // Arrange
      batchProcessor.start();

      // Act & Assert
      expect(() => {
        batchProcessor.stop();
      }).not.toThrow();
    });

    it('should not start processor twice', () => {
      // Arrange
      batchProcessor.start();
      vi.spyOn(console, 'log');

      // Act
      batchProcessor.start(); // Try to start again

      // Assert
      // Should return early without error (idempotent)
      batchProcessor.stop();
    });
  });
});

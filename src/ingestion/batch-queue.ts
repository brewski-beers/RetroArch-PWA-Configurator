/**
 * Batch Job Queue Management
 * In-memory queue for tracking batch ROM upload jobs
 * Follows POL-022 (Batch Upload Policy) for job lifecycle
 */

import { v4 as uuidv4 } from 'uuid';

export type BatchJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface BatchFile {
  filename: string;
  path: string;
  size: number;
}

export interface BatchJob {
  id: string;
  files: BatchFile[];
  status: BatchJobStatus;
  progress: {
    processed: number;
    total: number;
  };
  errors: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * In-memory batch job queue manager
 * Stores job metadata and progress
 * Note: This is not persistent. For production, use Redis or database.
 */
export class BatchQueue {
  private jobs: Map<string, BatchJob> = new Map();

  /**
   * Create and queue a new batch job
   */
  createJob(files: BatchFile[]): BatchJob {
    const job: BatchJob = {
      id: uuidv4(),
      files,
      status: 'queued',
      progress: {
        processed: 0,
        total: files.length,
      },
      errors: [],
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job status
   */
  updateStatus(jobId: string, status: BatchJobStatus): BatchJob | undefined {
    const job = this.jobs.get(jobId);
    if (job === undefined) {
      return undefined;
    }

    job.status = status;

    if (status === 'processing' && job.startedAt === undefined) {
      job.startedAt = new Date();
    }

    if (
      (status === 'completed' || status === 'failed') &&
      job.completedAt === undefined
    ) {
      job.completedAt = new Date();
    }

    return job;
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, processed: number): BatchJob | undefined {
    const job = this.jobs.get(jobId);
    if (job === undefined) {
      return undefined;
    }

    job.progress.processed = Math.min(processed, job.progress.total);
    return job;
  }

  /**
   * Add error to job
   */
  addError(jobId: string, error: string): BatchJob | undefined {
    const job = this.jobs.get(jobId);
    if (job === undefined) {
      return undefined;
    }

    job.errors.push(error);
    return job;
  }

  /**
   * List all jobs (for monitoring/debugging)
   */
  listJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clear completed jobs older than specified time (for cleanup)
   */
  clearOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [jobId, job] of this.jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt !== undefined &&
        now - job.completedAt.getTime() > maxAgeMs
      ) {
        this.jobs.delete(jobId);
        cleared++;
      }
    }

    return cleared;
  }
}

// Singleton instance for use throughout the application
export const batchQueue = new BatchQueue();

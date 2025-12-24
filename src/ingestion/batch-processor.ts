/**
 * Batch ROM Processor
 * Consumes batch jobs from queue and processes files serially via pipeline
 * Following POL-022 (processingStrategy: 'serial', continueOnError error handling)
 * Following POL-001 (Pipeline pattern integration)
 */

import { PipelineOrchestrator } from '../pipeline/pipeline-orchestrator.js';
import { Classifier } from '../pipeline/classifier.js';
import { Validator } from '../pipeline/validator.js';
import { Normalizer } from '../pipeline/normalizer.js';
import { Archiver } from '../pipeline/archiver.js';
import { Promoter } from '../pipeline/promoter.js';
import { ConfigLoader } from '../config/config-loader.js';
import { platformConfig } from '../../config/platform.config.js';
import { batchUploadConfig } from '../../config/policy.config.js';

import { batchQueue, type BatchJob } from './batch-queue.js';

/**
 * Batch processor for handling queued ROM upload jobs
 * Runs serially (one file at a time) to avoid resource exhaustion
 * Follows POL-022 configuration for batch processing behavior
 */
export class BatchProcessor {
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // Poll queue every 5 seconds
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Clean old jobs daily

  /**
   * Start the batch processor
   * Begins polling queue for jobs and processing them serially
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Start main processing loop
    this.processingInterval = setInterval(() => {
      void this.processNextJob();
    }, this.POLL_INTERVAL_MS);

    // Start cleanup loop for old completed jobs
    setInterval(() => {
      const cleared = batchQueue.clearOldJobs();
      if (cleared > 0) {
        // eslint-disable-next-line no-console
        console.log(`Batch processor: Cleared ${cleared} old jobs`);
      }
    }, this.CLEANUP_INTERVAL_MS);

    // eslint-disable-next-line no-console
    console.log('Batch processor started (polling every 5s)');
  }

  /**
   * Immediately process the next queued job (used by tests/initial enqueue)
   */
  async processQueuedNow(): Promise<void> {
    await this.processNextJob();
  }

  /**
   * Stop the batch processor
   */
  stop(): void {
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.isRunning = false;
    // eslint-disable-next-line no-console
    console.log('Batch processor stopped');
  }

  /**
   * Process the next queued job
   * Polls queue for 'queued' status jobs and processes them serially
   */
  private async processNextJob(): Promise<void> {
    try {
      // Find first queued job
      const jobs = batchQueue.listJobs();
      const queuedJob = jobs.find((j) => j.status === 'queued');

      if (queuedJob === undefined) {
        return; // No jobs to process
      }

      // Process this job
      await this.processJob(queuedJob);
    } catch (error) {
      const err = error as Error;
      // eslint-disable-next-line no-console
      console.error('Error in batch processor loop:', err.message);
    }
  }

  /**
   * Process a single batch job
   * Updates job status and processes each file serially
   */
  private async processJob(job: BatchJob): Promise<void> {
    try {
      // Update status to processing
      batchQueue.updateStatus(job.id, 'processing');

      // Load configuration
      const configLoader = new ConfigLoader();
      const configResult = await configLoader.load();

      if (!configResult.success || configResult.config === undefined) {
        batchQueue.updateStatus(job.id, 'failed');
        batchQueue.addError(job.id, 'Configuration not found');
        return;
      }

      // Initialize pipeline components
      const classifier = new Classifier(platformConfig);
      const validator = new Validator(platformConfig);
      const normalizer = new Normalizer(platformConfig);
      const archiver = new Archiver(platformConfig);
      const promoter = new Promoter(platformConfig);

      // Create orchestrator with user config
      const orchestrator = PipelineOrchestrator.fromUserConfig(
        configResult.config,
        classifier,
        validator,
        normalizer,
        archiver,
        promoter
      );

      // Process each file serially (per POL-022)
      let successCount = 0;
      for (const file of job.files) {
        try {
          const result = await orchestrator.process(file.path);

          if (result.success) {
            successCount++;
          } else {
            const errorMsg = `${file.filename}: ${result.errors.join(', ')} (phase: ${result.phase})`;
            batchQueue.addError(job.id, errorMsg);

            // Per POL-022 continueOnError: keep processing remaining files
            if (batchUploadConfig.errorHandling !== 'continueOnError') {
              // If not continueOnError, stop on first error
              break;
            }
          }
        } catch (fileError) {
          const err = fileError as Error;
          const errorMsg = `${file.filename}: ${err.message}`;
          batchQueue.addError(job.id, errorMsg);

          // Per POL-022 continueOnError: keep processing
          if (batchUploadConfig.errorHandling !== 'continueOnError') {
            break;
          }
        }

        // Update progress
        batchQueue.updateProgress(job.id, successCount + job.errors.length);
      }

      // Determine final status
      const finalStatus = job.errors.length === 0 ? 'completed' : 'completed'; // All processed (even with errors)
      batchQueue.updateStatus(job.id, finalStatus);

      // eslint-disable-next-line no-console
      console.log(
        `Batch ${job.id}: Completed ${successCount}/${job.files.length} files (${job.errors.length} errors)`
      );
    } catch (error) {
      const err = error as Error;
      batchQueue.updateStatus(job.id, 'failed');
      batchQueue.addError(job.id, `Processing failed: ${err.message}`);
      // eslint-disable-next-line no-console
      console.error(`Batch ${job.id} failed:`, err.message);
    }
  }
}

// Singleton instance for application-wide use
export const batchProcessor = new BatchProcessor();

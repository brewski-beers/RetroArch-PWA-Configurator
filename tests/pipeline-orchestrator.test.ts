/**
 * Tests for Pipeline Orchestrator
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PipelineOrchestrator } from '../src/pipeline/pipeline-orchestrator.js';
import { Classifier } from '../src/pipeline/classifier.js';
import { Validator } from '../src/pipeline/validator.js';
import { Normalizer } from '../src/pipeline/normalizer.js';
import { Archiver } from '../src/pipeline/archiver.js';
import { Promoter } from '../src/pipeline/promoter.js';
import { PlatformConfigFactory } from './factories/pipeline.factory.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;
  let testDir: string;

  beforeEach(async () => {
    // Arrange: Set up test environment with all pipeline phases
    const config = PlatformConfigFactory.create();

    const classifier = new Classifier(config);
    const validator = new Validator(config);
    const normalizer = new Normalizer(config);
    const archiver = new Archiver(config);
    const promoter = new Promoter(config);

    orchestrator = new PipelineOrchestrator(
      config,
      classifier,
      validator,
      normalizer,
      archiver,
      promoter
    );

    // Create temporary test directory
    testDir = join(tmpdir(), `pipeline-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  describe('process', () => {
    it('should process a valid ROM file through all phases', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await orchestrator.process(testFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rom).toBeDefined();
      expect(result.rom?.platform).toBe('nes');
      expect(result.errors).toEqual([]);
    });

    it('should fail when classifier is disabled', async () => {
      // Arrange
      const config = PlatformConfigFactory.create({
        pipeline: {
          enableClassifier: false,
          enableValidator: false,
          enableNormalizer: false,
          enableArchiver: false,
          enablePromoter: false,
          enableCHDConversion: false,
          enableThumbnails: false,
          enableMetadata: false,
        },
      });

      const classifier = new Classifier(config);
      const validator = new Validator(config);
      const normalizer = new Normalizer(config);
      const archiver = new Archiver(config);
      const promoter = new Promoter(config);

      const disabledOrchestrator = new PipelineOrchestrator(
        config,
        classifier,
        validator,
        normalizer,
        archiver,
        promoter
      );

      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await disabledOrchestrator.process(testFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.phase).toBe('classifier');
      expect(result.errors[0]).toContain('disabled');
    });

    it('should fail for unknown file extension', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.unknown');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await orchestrator.process(testFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.phase).toBe('classifier');
      expect(result.errors[0]).toContain('Unknown file extension');
    });

    it('should generate hash during validation phase', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await orchestrator.process(testFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rom?.hash).toBeDefined();
      // Real SHA-256 hash should be a 64-character hex string
      expect(result.rom?.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

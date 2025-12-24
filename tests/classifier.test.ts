/**
 * Tests for Classifier Phase
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 * Covering error paths for POL-002 (Test Coverage)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach } from 'vitest';

import { Classifier } from '../src/pipeline/classifier.js';
import type { ROMFile } from '../src/interfaces/pipeline.interface.js';

import {
  PlatformConfigFactory,
  ROMFileFactory,
} from './factories/pipeline.factory.js';

describe('Classifier', () => {
  let classifier: Classifier;
  let testDir: string;

  beforeEach(async () => {
    // Arrange: Set up test environment
    const config = PlatformConfigFactory.create();
    classifier = new Classifier(config);

    // Create temporary test directory
    testDir = join(tmpdir(), `classifier-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  describe('classify', () => {
    it('should classify NES file correctly', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await classifier.classify(testFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.platform).toBe('nes');
      expect(result.data?.extension).toBe('.nes');
      expect(result.data?.filename).toBe('test-game.nes');
      expect(result.data?.size).toBeGreaterThan(0);
    });

    it('should return error for unknown file extension', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.unknown');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await classifier.classify(testFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown file extension');
    });

    it('should handle non-existent file', async () => {
      // Arrange
      const testFile = join(testDir, 'non-existent.nes');

      // Act
      const result = await classifier.classify(testFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include metadata in classification result', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await classifier.classify(testFile);

      // Assert
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.['classifiedAt']).toBeDefined();
      expect(result.data?.metadata?.['platformName']).toBe(
        'Nintendo - Nintendo Entertainment System'
      );
    });

    it('should generate unique ROM ID for each file', async () => {
      // Arrange
      const testFile1 = join(testDir, 'game1.nes');
      const testFile2 = join(testDir, 'game2.nes');
      await writeFile(testFile1, 'content1');
      await writeFile(testFile2, 'content2');

      // Act
      const result1 = await classifier.classify(testFile1);
      const result2 = await classifier.classify(testFile2);

      // Assert
      expect(result1.data?.id).toBeDefined();
      expect(result2.data?.id).toBeDefined();
      expect(result1.data?.id).not.toBe(result2.data?.id);
    });

    it('should handle null/empty file path', async () => {
      // Act
      const result = await classifier.classify('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle file path with no extension', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game-no-ext');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await classifier.classify(testFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown file extension');
    });

    it('should handle directory instead of file', async () => {
      // Arrange
      const dirPath = join(testDir, 'test-directory');
      await mkdir(dirPath, { recursive: true });

      // Act
      const result = await classifier.classify(dirPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle file with multiple extensions', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.tar.nes');
      await writeFile(testFile, 'test-content');

      // Act
      const result = await classifier.classify(testFile);

      // Assert - Should use last extension (.nes)
      expect(result.success).toBe(true);
      expect(result.data?.platform).toBe('nes');
      expect(result.data?.extension).toBe('.nes');
    });
  });

  describe('moveToValidation', () => {
    it('should return validation path for ROM', () => {
      // Arrange
      const rom = ROMFileFactory.create();

      // Act
      const result = classifier.moveToValidation(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toContain('RetroArch-Workspace/Validation');
      expect(result.data).toContain(rom.platform);
      expect(result.data).toContain(rom.filename);
    });

    it('should include timestamp in metadata', () => {
      // Arrange
      const rom = ROMFileFactory.create();

      // Act
      const result = classifier.moveToValidation(rom);

      // Assert
      expect(result.metadata?.['movedAt']).toBeDefined();
    });

    it('should handle null ROM input', () => {
      // Act
      const result = classifier.moveToValidation(null as unknown as ROMFile);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle ROM with missing platform', () => {
      // Arrange
      const rom = ROMFileFactory.create();
      const invalidRom = { ...rom, platform: '' };

      // Act
      const result = classifier.moveToValidation(invalidRom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('platform');
    });

    it('should handle ROM with missing filename', () => {
      // Arrange
      const rom = ROMFileFactory.create();
      const invalidRom = { ...rom, filename: '' };

      // Act
      const result = classifier.moveToValidation(invalidRom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('filename');
    });
  });
});

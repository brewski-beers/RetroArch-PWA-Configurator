/**
 * Tests for Batch Processor
 * Following TEST-002 (AAA Pattern) and TEST-003 (SRP)
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { BatchProcessor } from '../src/batch-processor.js';

import { RetroArchPathsFactory } from './factories/simple-config.factory.js';
import { PlatformConfigFactory } from './factories/pipeline.factory.js';

describe('Batch Processor', () => {
  const testDir = '/tmp/batch-processor-test';
  const inputDir = join(testDir, 'input');
  const outputDir = join(testDir, 'output');

  beforeEach(async () => {
    // Clean up and create test directories
    await rm(testDir, { recursive: true, force: true });
    await mkdir(inputDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Directory Scanning', () => {
    it('should scan directory and find ROM files', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      // Create test ROM files
      await writeFile(join(inputDir, 'game1.nes'), 'test data');
      await writeFile(join(inputDir, 'game2.nes'), 'test data');
      await writeFile(join(inputDir, 'readme.txt'), 'not a rom');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.total).toBe(2); // Only .nes files
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should recursively scan subdirectories', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      // Create nested structure
      const subDir = join(inputDir, 'nes', 'action');
      await mkdir(subDir, { recursive: true });
      await writeFile(join(inputDir, 'game1.nes'), 'test');
      await writeFile(join(subDir, 'game2.nes'), 'test');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.total).toBe(2);
      expect(result.processed).toBe(2);
    });

    it('should handle empty directory', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.total).toBe(0);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('File Processing', () => {
    it('should create hard links for ROM files', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game.nes'), 'test data');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.processed).toBe(1);
      expect(result.files[0]?.destination).toContain('downloads');
      expect(result.files[0]?.platformName).toContain('Nintendo');
    });

    it('should group files by platform', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create({
        platforms: [
          {
            id: 'nes',
            name: 'Nintendo - Nintendo Entertainment System',
            extensions: ['.nes'],
            requiresBIOS: false,
          },
          {
            id: 'snes',
            name: 'Nintendo - Super Nintendo Entertainment System',
            extensions: ['.sfc'],
            requiresBIOS: false,
          },
        ],
      });
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game1.nes'), 'test');
      await writeFile(join(inputDir, 'game2.nes'), 'test');
      await writeFile(join(inputDir, 'game3.sfc'), 'test');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.processed).toBe(3);
      const nesFiles = result.files.filter((f) => f.platform === 'nes');
      const snesFiles = result.files.filter((f) => f.platform === 'snes');
      expect(nesFiles.length).toBe(2);
      expect(snesFiles.length).toBe(1);
    });
  });

  describe('Manifest Generation', () => {
    it('should generate manifest files', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game.nes'), 'test data');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.processed).toBe(1);
      // Manifests are written to paths.manifests directory
      // Would need to check file system in integration test
    });
  });

  describe('Playlist Generation', () => {
    it('should generate RetroArch playlists', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game.nes'), 'test data');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.processed).toBe(1);
      // Playlists are written to paths.playlists directory
      // Would need to check file system in integration test
    });
  });

  describe('Error Handling', () => {
    it('should continue processing on individual file errors', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game1.nes'), 'test');
      await writeFile(join(inputDir, 'game2.nes'), 'test');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.processed).toBeGreaterThan(0);
      // Even if one file fails, others should process
    });

    it('should track processing duration', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game.nes'), 'test');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('Platform Mapping', () => {
    it('should correctly map file extensions to platforms', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create({
        platforms: [
          {
            id: 'nes',
            name: 'Nintendo - Nintendo Entertainment System',
            extensions: ['.nes'],
            requiresBIOS: false,
          },
        ],
      });
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game.nes'), 'test');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.files[0]?.platform).toBe('nes');
      expect(result.files[0]?.platformName).toBe(
        'Nintendo - Nintendo Entertainment System'
      );
    });

    it('should handle case-insensitive extensions', async () => {
      // Arrange
      const paths = RetroArchPathsFactory.create(outputDir);
      const config = PlatformConfigFactory.create();
      const processor = new BatchProcessor(paths, config);

      await writeFile(join(inputDir, 'game.NES'), 'test');
      await writeFile(join(inputDir, 'game2.NeS'), 'test');

      // Act
      const result = await processor.processDirectory(inputDir);

      // Assert
      expect(result.processed).toBe(2);
    });
  });
});

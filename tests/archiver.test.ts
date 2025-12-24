/**
 * Tests for Archiver Phase
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 * Covering error paths for POL-002 (Test Coverage)
 */

import { writeFile, mkdir, rm, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Archiver } from '../src/pipeline/archiver.js';
import type {
  ROMFile,
  ManifestEntry,
} from '../src/interfaces/pipeline.interface.js';

import { PlatformConfigFactory } from './factories/pipeline.factory.js';

describe('Archiver', () => {
  let archiver: Archiver;
  let testDir: string;

  beforeEach(async () => {
    // Arrange: Create unique temp directory for each test
    const uniqueId = `archiver-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    testDir = join(tmpdir(), uniqueId);
    await mkdir(testDir, { recursive: true });

    const config = PlatformConfigFactory.create({
      directories: {
        archive: {
          root: join(testDir, 'Archive'),
          bios: join(testDir, 'Archive/BIOS'),
          manifests: join(testDir, 'Archive/Manifests'),
          roms: join(testDir, 'Archive/ROMs'),
        },
        sync: {
          root: join(testDir, 'Sync'),
          content: {
            roms: join(testDir, 'Sync/content/roms'),
            bios: join(testDir, 'Sync/content/bios'),
            saves: join(testDir, 'Sync/content/saves'),
            states: join(testDir, 'Sync/content/states'),
          },
          playlists: join(testDir, 'Sync/playlists'),
          config: join(testDir, 'Sync/retroarch.cfg'),
        },
        thumbnails: {
          root: join(testDir, 'Thumbnails'),
        },
        workspace: {
          root: join(testDir, 'Workspace'),
          staging: join(testDir, 'Workspace/Staging'),
          validation: join(testDir, 'Workspace/Validation'),
          rejected: join(testDir, 'Workspace/Rejected'),
          tools: join(testDir, 'Workspace/Tools'),
        },
      },
    });

    archiver = new Archiver(config);
  });

  afterEach(async () => {
    // Cleanup: Remove test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('archiveROM', () => {
    it('should successfully archive a ROM file', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');

      const rom: ROMFile = {
        id: 'test-rom-1',
        path: testFile,
        filename: 'test-game.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
      };

      // Act
      const result = await archiver.archiveROM(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toContain('Archive/ROMs/nes/test-game.nes');
      expect(result.metadata).toHaveProperty('archivedAt');
      expect(result.metadata).toHaveProperty('sourcePath', testFile);
    });

    it('should handle error when source file does not exist', async () => {
      // Arrange
      const nonExistentFile = join(testDir, 'non-existent.nes');

      const rom: ROMFile = {
        id: 'test-rom-2',
        path: nonExistentFile,
        filename: 'non-existent.nes',
        extension: '.nes',
        size: 0,
        platform: 'nes',
      };

      // Act
      const result = await archiver.archiveROM(rom);

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('ENOENT');
    });

    it('should handle ROM with undefined platform', async () => {
      // Arrange
      const testFile = join(testDir, 'unknown-platform.rom');
      await writeFile(testFile, 'test-content');

      const rom: ROMFile = {
        id: 'test-rom-3',
        path: testFile,
        filename: 'unknown-platform.rom',
        extension: '.rom',
        size: 12,
        // platform omitted - should use 'unknown' as fallback
      };

      // Act
      const result = await archiver.archiveROM(rom);

      // Assert - Should use 'unknown' as fallback
      expect(result.success).toBe(true);
      expect(result.data).toContain(
        'Archive/ROMs/unknown/unknown-platform.rom'
      );
    });
  });

  describe('writeManifest', () => {
    it('should create new manifest file', async () => {
      // Arrange
      const entry: ManifestEntry = {
        id: 'rom-1',
        filename: 'game.nes',
        platform: 'nes',
        hash: 'abc123',
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      // Act
      const result = await archiver.writeManifest(entry);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata).toHaveProperty('manifestPath');
      expect(result.metadata?.['totalEntries']).toBe(1);
    });

    it('should update existing manifest entry by ID', async () => {
      // Arrange
      const entry1: ManifestEntry = {
        id: 'rom-1',
        filename: 'game.nes',
        platform: 'nes',
        hash: 'abc123',
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      const entry2: ManifestEntry = {
        id: 'rom-1', // Same ID
        filename: 'game-updated.nes',
        platform: 'nes',
        hash: 'def456',
        size: 200,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: { updated: true },
      };

      // Act
      await archiver.writeManifest(entry1);
      const result = await archiver.writeManifest(entry2);

      // Assert - Should update, not duplicate
      expect(result.success).toBe(true);
      expect(result.metadata?.['totalEntries']).toBe(1); // Still 1 entry
    });

    it('should update existing manifest entry by hash', async () => {
      // Arrange
      const entry1: ManifestEntry = {
        id: 'rom-1',
        filename: 'game.nes',
        platform: 'nes',
        hash: 'same-hash',
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      const entry2: ManifestEntry = {
        id: 'rom-2', // Different ID
        filename: 'game-copy.nes',
        platform: 'nes',
        hash: 'same-hash', // Same hash
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      // Act
      await archiver.writeManifest(entry1);
      const result = await archiver.writeManifest(entry2);

      // Assert - Should update by hash match
      expect(result.success).toBe(true);
      expect(result.metadata?.['totalEntries']).toBe(1);
    });

    it('should add multiple different entries to manifest', async () => {
      // Arrange
      const entry1: ManifestEntry = {
        id: 'rom-1',
        filename: 'game1.nes',
        platform: 'nes',
        hash: 'hash1',
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      const entry2: ManifestEntry = {
        id: 'rom-2',
        filename: 'game2.nes',
        platform: 'nes',
        hash: 'hash2',
        size: 200,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      // Act
      await archiver.writeManifest(entry1);
      const result = await archiver.writeManifest(entry2);

      // Assert - Should have 2 entries
      expect(result.success).toBe(true);
      expect(result.metadata?.['totalEntries']).toBe(2);
    });

    it('should handle error when manifest directory is read-only', async () => {
      // Arrange
      const manifestDir = join(testDir, 'Archive/Manifests');
      await mkdir(manifestDir, { recursive: true });

      // Make directory read-only
      await chmod(manifestDir, 0o444);

      const entry: ManifestEntry = {
        id: 'rom-1',
        filename: 'game.nes',
        platform: 'nes',
        hash: 'abc123',
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      // Act
      const result = await archiver.writeManifest(entry);

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
      expect(result.error).toBeDefined();

      // Cleanup: Restore permissions
      await chmod(manifestDir, 0o755);
    });

    it('should handle corrupted manifest JSON file', async () => {
      // Arrange
      const manifestDir = join(testDir, 'Archive/Manifests');
      await mkdir(manifestDir, { recursive: true });

      // Create corrupted manifest file
      const manifestPath = join(manifestDir, 'nes.json');
      await writeFile(manifestPath, '{ invalid json content', 'utf-8');

      const entry: ManifestEntry = {
        id: 'rom-1',
        filename: 'game.nes',
        platform: 'nes',
        hash: 'abc123',
        size: 100,
        extension: '.nes',
        archivedAt: new Date().toISOString(),
        metadata: {},
      };

      // Act
      const result = await archiver.writeManifest(entry);

      // Assert - Should fail gracefully when JSON.parse fails
      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('storeMetadata', () => {
    it('should store ROM metadata successfully', async () => {
      // Arrange
      const rom: ROMFile = {
        id: 'rom-metadata-1',
        path: '/tmp/test.nes',
        filename: 'test.nes',
        extension: '.nes',
        size: 100,
        platform: 'nes',
        hash: 'abc123',
        metadata: { title: 'Test Game' },
      };

      // Act
      const result = await archiver.storeMetadata(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata).toHaveProperty('storedAt');
      expect(result.metadata).toHaveProperty('metadataPath');
    });

    it('should handle error when metadata directory is read-only', async () => {
      // Arrange
      const manifestDir = join(testDir, 'Archive/Manifests');
      await mkdir(manifestDir, { recursive: true });

      // Make parent directory read-only to prevent subdirectory creation
      await chmod(manifestDir, 0o444);

      const rom: ROMFile = {
        id: 'rom-metadata-2',
        path: '/tmp/test.nes',
        filename: 'test.nes',
        extension: '.nes',
        size: 100,
        platform: 'nes',
        hash: 'def456',
      };

      // Act
      const result = await archiver.storeMetadata(rom);

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
      expect(result.error).toBeDefined();

      // Cleanup: Restore permissions
      await chmod(manifestDir, 0o755);
    });
  });
});

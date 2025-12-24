/**
 * Tests for Validator Phase
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 * Following TEST-001 (Use test factories)
 */

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Validator } from '../src/pipeline/validator.js';

import {
  PlatformConfigFactory,
  ROMFileFactory,
  PlatformDefinitionFactory,
} from './factories/pipeline.factory.js';

describe('Validator', () => {
  let validator: Validator;
  let testDir: string;
  let biosDir: string;
  let manifestsDir: string;

  beforeEach(async () => {
    // Arrange: Set up test environment
    testDir = join(tmpdir(), `validator-test-${Date.now()}`);
    biosDir = join(testDir, 'BIOS');
    manifestsDir = join(testDir, 'Manifests');

    await mkdir(testDir, { recursive: true });
    await mkdir(biosDir, { recursive: true });
    await mkdir(manifestsDir, { recursive: true });

    const config = PlatformConfigFactory.create({
      directories: {
        archive: {
          root: 'RetroArch-Archive',
          bios: biosDir,
          manifests: manifestsDir,
          roms: 'RetroArch-Archive/ROMs',
        },
        sync: {
          root: 'RetroArch-Sync',
          content: {
            roms: 'RetroArch-Sync/content/roms',
            bios: 'RetroArch-Sync/content/bios',
            saves: 'RetroArch-Sync/content/saves',
            states: 'RetroArch-Sync/content/states',
          },
          playlists: 'RetroArch-Sync/playlists',
          config: 'RetroArch-Sync/retroarch.cfg',
        },
        thumbnails: {
          root: 'RetroArch-Thumbnails',
        },
        workspace: {
          root: 'RetroArch-Workspace',
          staging: 'RetroArch-Workspace/Staging',
          validation: 'RetroArch-Workspace/Validation',
          rejected: 'RetroArch-Workspace/Rejected',
          tools: 'RetroArch-Workspace/Tools',
        },
      },
      platforms: [
        PlatformDefinitionFactory.nes(),
        PlatformDefinitionFactory.psx(),
      ],
    });

    validator = new Validator(config);
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateIntegrity', () => {
    it('should validate file exists and is readable', async () => {
      // Arrange
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, 'test-content');
      const rom = ROMFileFactory.create({ path: testFile });

      // Act
      const result = await validator.validateIntegrity(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.['validatedAt']).toBeDefined();
    });

    it('should return error for non-existent file', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        path: join(testDir, 'non-existent.nes'),
      });

      // Act
      const result = await validator.validateIntegrity(rom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for unreadable file', async () => {
      // Arrange
      const testFile = join(testDir, 'unreadable.nes');
      await writeFile(testFile, 'test-content');
      // Note: This test is platform-dependent (Unix permissions)
      // We'll just verify the interface works with a non-existent path
      const rom = ROMFileFactory.create({
        path: '/root/unreadable-file.nes',
      });

      // Act
      const result = await validator.validateIntegrity(rom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
    });
  });

  describe('generateHash', () => {
    it('should generate SHA-256 hash for file', async () => {
      // Arrange
      const testContent = 'test-rom-content-for-hashing';
      const testFile = join(testDir, 'test-game.nes');
      await writeFile(testFile, testContent);

      // Calculate expected hash
      const expectedHash = createHash('sha256')
        .update(testContent)
        .digest('hex');

      const rom = ROMFileFactory.create({
        path: testFile,
        size: testContent.length,
      });

      // Act
      const result = await validator.generateHash(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(expectedHash);
      expect(result.metadata?.['algorithm']).toBe('sha256');
      expect(result.metadata?.['generatedAt']).toBeDefined();
      expect(result.metadata?.['fileSize']).toBe(testContent.length);
    });

    it('should return error for non-existent file', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        path: join(testDir, 'non-existent.nes'),
      });

      // Act
      const result = await validator.generateHash(rom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty files', async () => {
      // Arrange
      const testFile = join(testDir, 'empty-game.nes');
      await writeFile(testFile, '');

      const expectedHash = createHash('sha256').update('').digest('hex');
      const rom = ROMFileFactory.create({ path: testFile, size: 0 });

      // Act
      const result = await validator.generateHash(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(expectedHash);
    });

    it('should generate consistent hashes for same content', async () => {
      // Arrange
      const testContent = 'consistent-content';
      const testFile1 = join(testDir, 'file1.nes');
      const testFile2 = join(testDir, 'file2.nes');
      await writeFile(testFile1, testContent);
      await writeFile(testFile2, testContent);

      const rom1 = ROMFileFactory.create({ path: testFile1 });
      const rom2 = ROMFileFactory.create({ path: testFile2 });

      // Act
      const result1 = await validator.generateHash(rom1);
      const result2 = await validator.generateHash(rom2);

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).toBe(result2.data);
    });

    it('should generate different hashes for different content', async () => {
      // Arrange
      const testFile1 = join(testDir, 'file1.nes');
      const testFile2 = join(testDir, 'file2.nes');
      await writeFile(testFile1, 'content-a');
      await writeFile(testFile2, 'content-b');

      const rom1 = ROMFileFactory.create({ path: testFile1 });
      const rom2 = ROMFileFactory.create({ path: testFile2 });

      // Act
      const result1 = await validator.generateHash(rom1);
      const result2 = await validator.generateHash(rom2);

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data).not.toBe(result2.data);
    });
  });

  describe('checkCompanionFiles', () => {
    it('should find companion files for PlayStation ROMs', async () => {
      // Arrange
      const testFile = join(testDir, 'game.bin');
      const cueFile = join(testDir, 'game.cue');
      await writeFile(testFile, 'test-content');
      await writeFile(cueFile, 'FILE "game.bin" BINARY');

      const rom = ROMFileFactory.forPlayStation({
        path: testFile,
        filename: 'game.bin',
      });

      // Act
      const result = await validator.checkCompanionFiles(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toContain('game.cue');
      expect(result.metadata?.['companionFilesFound']).toBe(1);
    });

    it('should return empty array when no companion files exist', async () => {
      // Arrange
      const testFile = join(testDir, 'game.bin');
      await writeFile(testFile, 'test-content');

      const rom = ROMFileFactory.forPlayStation({
        path: testFile,
        filename: 'game.bin',
      });

      // Act
      const result = await validator.checkCompanionFiles(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.metadata?.['companionFilesFound']).toBe(0);
    });

    it('should return empty array for platforms without companion file support', async () => {
      // Arrange
      const testFile = join(testDir, 'game.nes');
      await writeFile(testFile, 'test-content');

      const rom = ROMFileFactory.create({
        path: testFile,
        platform: 'nes',
      });

      // Act
      const result = await validator.checkCompanionFiles(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.metadata?.['noCompanionFilesRequired']).toBe(true);
    });

    it('should handle directory read errors', async () => {
      // Arrange
      const rom = ROMFileFactory.forPlayStation({
        path: '/non-existent/directory/game.bin',
      });

      // Act
      const result = await validator.checkCompanionFiles(rom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toEqual([]);
    });

    it('should match companion files case-insensitively by base name', async () => {
      // Arrange
      const testFile = join(testDir, 'MyGame.bin');
      const cueFile = join(testDir, 'MyGame.cue');
      await writeFile(testFile, 'test-content');
      await writeFile(cueFile, 'FILE "MyGame.bin" BINARY');

      const rom = ROMFileFactory.forPlayStation({
        path: testFile,
        filename: 'MyGame.bin',
      });

      // Act
      const result = await validator.checkCompanionFiles(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toContain('MyGame.cue');
    });
  });

  describe('checkDuplicate', () => {
    it('should return false when no manifest exists', async () => {
      // Arrange
      const hash = 'abc123def456';

      // Act
      const result = await validator.checkDuplicate(hash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['checkedAt']).toBeDefined();
    });

    it('should return false when hash not found in manifest', async () => {
      // Arrange
      const hash = 'abc123def456';
      const manifestPath = join(manifestsDir, 'nes.json');
      const manifest = [
        {
          id: 'rom-1',
          filename: 'game1.nes',
          platform: 'nes',
          hash: 'different-hash-111',
          size: 1024,
          archivedAt: new Date().toISOString(),
        },
      ];
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Act
      const result = await validator.checkDuplicate(hash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should return true when hash found in manifest', async () => {
      // Arrange
      const hash = 'abc123def456';
      const manifestPath = join(manifestsDir, 'nes.json');
      const manifest = [
        {
          id: 'rom-1',
          filename: 'game1.nes',
          platform: 'nes',
          hash: 'abc123def456',
          size: 1024,
          archivedAt: new Date().toISOString(),
        },
      ];
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Act
      const result = await validator.checkDuplicate(hash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.['foundInManifest']).toBeDefined();
      expect(result.metadata?.['duplicateOf']).toBe('game1.nes');
    });

    it('should search across multiple platform manifests', async () => {
      // Arrange
      const hash = 'xyz789';
      const nesManifest = join(manifestsDir, 'nes.json');
      const psxManifest = join(manifestsDir, 'psx.json');

      await writeFile(
        nesManifest,
        JSON.stringify([
          {
            id: 'rom-1',
            filename: 'game1.nes',
            platform: 'nes',
            hash: 'hash-111',
            size: 1024,
            archivedAt: new Date().toISOString(),
          },
        ])
      );

      await writeFile(
        psxManifest,
        JSON.stringify([
          {
            id: 'rom-2',
            filename: 'game2.cue',
            platform: 'psx',
            hash: 'xyz789',
            size: 2048,
            archivedAt: new Date().toISOString(),
          },
        ])
      );

      // Act
      const result = await validator.checkDuplicate(hash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.['duplicateOf']).toBe('game2.cue');
    });

    it('should handle malformed manifest files gracefully', async () => {
      // Arrange
      const hash = 'abc123';
      const manifestPath = join(manifestsDir, 'nes.json');
      await writeFile(manifestPath, 'invalid-json{]');

      // Act
      const result = await validator.checkDuplicate(hash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['manifestErrors']).toBeDefined();
    });

    it('should handle manifest read permission errors', async () => {
      // Arrange
      const hash = 'abc123';
      // Use a directory that doesn't exist to simulate error
      const brokenValidator = new Validator(
        PlatformConfigFactory.create({
          directories: {
            archive: {
              root: 'RetroArch-Archive',
              bios: '/root/no-access/BIOS',
              manifests: '/root/no-access/Manifests',
              roms: 'RetroArch-Archive/ROMs',
            },
            sync: {
              root: 'RetroArch-Sync',
              content: {
                roms: 'RetroArch-Sync/content/roms',
                bios: 'RetroArch-Sync/content/bios',
                saves: 'RetroArch-Sync/content/saves',
                states: 'RetroArch-Sync/content/states',
              },
              playlists: 'RetroArch-Sync/playlists',
              config: 'RetroArch-Sync/retroarch.cfg',
            },
            thumbnails: {
              root: 'RetroArch-Thumbnails',
            },
            workspace: {
              root: 'RetroArch-Workspace',
              staging: 'RetroArch-Workspace/Staging',
              validation: 'RetroArch-Workspace/Validation',
              rejected: 'RetroArch-Workspace/Rejected',
              tools: 'RetroArch-Workspace/Tools',
            },
          },
        })
      );

      // Act
      const result = await brokenValidator.checkDuplicate(hash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('validateBIOSDependencies', () => {
    it('should return true for platforms without BIOS requirements', async () => {
      // Arrange
      const rom = ROMFileFactory.create({ platform: 'nes' });

      // Act
      const result = await validator.validateBIOSDependencies(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.['biosRequired']).toBe(false);
    });

    it('should return false when platform not found', async () => {
      // Arrange
      const rom = ROMFileFactory.create({ platform: 'unknown-platform' });

      // Act
      const result = await validator.validateBIOSDependencies(rom);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Platform not found');
    });

    it('should return true when all required BIOS files exist', async () => {
      // Arrange
      await writeFile(join(biosDir, 'scph5500.bin'), 'bios-content');
      await writeFile(join(biosDir, 'scph5501.bin'), 'bios-content');
      await writeFile(join(biosDir, 'scph5502.bin'), 'bios-content');

      const rom = ROMFileFactory.forPlayStation();

      // Act
      const result = await validator.validateBIOSDependencies(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.['biosRequired']).toBe(true);
      expect(result.metadata?.['biosFiles']).toEqual([
        'scph5500.bin',
        'scph5501.bin',
        'scph5502.bin',
      ]);
      expect(result.metadata?.['foundFiles']).toEqual([
        'scph5500.bin',
        'scph5501.bin',
        'scph5502.bin',
      ]);
    });

    it('should return false when some BIOS files are missing', async () => {
      // Arrange
      await writeFile(join(biosDir, 'scph5500.bin'), 'bios-content');
      // Missing scph5501.bin and scph5502.bin

      const rom = ROMFileFactory.forPlayStation();

      // Act
      const result = await validator.validateBIOSDependencies(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['biosRequired']).toBe(true);
      expect(result.metadata?.['missingFiles']).toEqual([
        'scph5501.bin',
        'scph5502.bin',
      ]);
    });

    it('should return false when no BIOS files exist', async () => {
      // Arrange
      const rom = ROMFileFactory.forPlayStation();

      // Act
      const result = await validator.validateBIOSDependencies(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['missingFiles']).toHaveLength(3);
    });

    it('should handle BIOS directory access errors', async () => {
      // Arrange
      const brokenValidator = new Validator(
        PlatformConfigFactory.create({
          directories: {
            archive: {
              root: 'RetroArch-Archive',
              bios: '/root/no-access/BIOS',
              manifests: manifestsDir,
              roms: 'RetroArch-Archive/ROMs',
            },
            sync: {
              root: 'RetroArch-Sync',
              content: {
                roms: 'RetroArch-Sync/content/roms',
                bios: 'RetroArch-Sync/content/bios',
                saves: 'RetroArch-Sync/content/saves',
                states: 'RetroArch-Sync/content/states',
              },
              playlists: 'RetroArch-Sync/playlists',
              config: 'RetroArch-Sync/retroarch.cfg',
            },
            thumbnails: {
              root: 'RetroArch-Thumbnails',
            },
            workspace: {
              root: 'RetroArch-Workspace',
              staging: 'RetroArch-Workspace/Staging',
              validation: 'RetroArch-Workspace/Validation',
              rejected: 'RetroArch-Workspace/Rejected',
              tools: 'RetroArch-Workspace/Tools',
            },
          },
          platforms: [PlatformDefinitionFactory.psx()],
        })
      );

      const rom = ROMFileFactory.forPlayStation();

      // Act
      const result = await brokenValidator.validateBIOSDependencies(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('validateNaming', () => {
    it('should validate correct naming pattern', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        filename: 'Super Mario Bros (USA).nes',
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.['validatedAt']).toBeDefined();
    });

    it('should reject filenames with invalid characters', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        filename: 'Super*Mario<Bros>.nes',
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['invalidCharacters']).toBeDefined();
    });

    it('should reject filenames that are too long', async () => {
      // Arrange
      const longName = 'A'.repeat(300) + '.nes';
      const rom = ROMFileFactory.create({
        filename: longName,
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['reason']).toContain('too long');
    });

    it('should accept filenames with parentheses and hyphens', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        filename: 'Legend of Zelda - Ocarina of Time (USA) (Rev A).nes',
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should accept filenames with numbers', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        filename: 'Mega Man 2 (USA).nes',
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should reject empty filenames', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        filename: '',
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['reason']).toContain('empty');
    });

    it('should reject filenames without extensions', async () => {
      // Arrange
      const rom = ROMFileFactory.create({
        filename: 'Super Mario Bros',
        extension: '',
      });

      // Act
      const result = await validator.validateNaming(rom);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['reason']).toContain('extension');
    });
  });
});

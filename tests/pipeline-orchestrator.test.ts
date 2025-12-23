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
import type {
  IClassifier,
  IValidator,
  INormalizer,
  IArchiver,
  IPromoter,
  PhaseResult,
  ROMFile,
  PlaylistEntry,
} from '../src/interfaces/pipeline.interface.js';

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;
  let testDir: string;

  beforeEach(async () => {
    // Arrange: Set up test environment with all pipeline phases
    // Create unique temp directory for this test to avoid duplicate detection
    const uniqueId = `pipeline-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    testDir = join(tmpdir(), uniqueId);
    await mkdir(testDir, { recursive: true });

    // Create isolated directories for archive, sync, etc.
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

    it('should reject duplicate ROM based on hash', async () => {
      // Arrange: Ingest the same ROM twice
      const testFile = join(testDir, 'duplicate-game.nes');
      await writeFile(testFile, 'duplicate-content');

      // Act: First ingestion should succeed
      const firstResult = await orchestrator.process(testFile);
      expect(firstResult.success).toBe(true);

      // Act: Second ingestion of same content (same hash) should fail
      const testFile2 = join(testDir, 'duplicate-game-copy.nes');
      await writeFile(testFile2, 'duplicate-content'); // Same content = same hash
      const secondResult = await orchestrator.process(testFile2);

      // Assert: Second ingestion should fail with duplicate error
      expect(secondResult.success).toBe(false);
      expect(secondResult.phase).toBe('validator');
      expect(secondResult.errors).toContain('Duplicate ROM detected');
    });

    it('should create manifest entry during archival phase', async () => {
      // Arrange
      const testFile = join(testDir, 'manifest-test.nes');
      await writeFile(testFile, 'manifest-content');

      // Act
      const result = await orchestrator.process(testFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.rom?.platform).toBe('nes');

      // Verify manifest file was created
      const manifestPath = join(testDir, 'Archive/Manifests/nes.json');
      const { readFile: fsReadFile } = await import('node:fs/promises');
      const manifestContent = await fsReadFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      expect(Array.isArray(manifest)).toBe(true);
      expect(manifest.length).toBeGreaterThan(0);
      expect(manifest[0]).toHaveProperty('id');
      expect(manifest[0]).toHaveProperty('hash');
      expect(manifest[0]).toHaveProperty('platform', 'nes');
    });
  });

  describe('process - error handling', () => {
    const createIsolatedConfig =
      (): import('../src/interfaces/platform-config.interface.js').PlatformConfig =>
        PlatformConfigFactory.create({
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

    const baseRom = (filePath: string): ROMFile => ({
      id: 'rom-id',
      filename: 'demo.nes',
      path: filePath,
      extension: '.nes',
      size: 10,
      platform: 'nes',
    });

    class StubClassifier implements IClassifier {
      classify(filePath: string): Promise<PhaseResult<ROMFile>> {
        return Promise.resolve({ success: true, data: baseRom(filePath) });
      }
      moveToValidation(_rom: ROMFile): PhaseResult<string> {
        return { success: true, data: 'validation' };
      }
    }

    class ValidatorFailHash implements IValidator {
      validateIntegrity(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: true });
      }
      checkCompanionFiles(): Promise<PhaseResult<string[]>> {
        return Promise.resolve({ success: true, data: [] });
      }
      generateHash(): Promise<PhaseResult<string>> {
        return Promise.resolve({ success: false, error: 'hash failed' });
      }
      checkDuplicate(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: false });
      }
      validateBIOSDependencies(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: true });
      }
      validateNaming(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: true });
      }
    }

    class NormalizerFail implements INormalizer {
      applyNamingPattern(): Promise<PhaseResult<ROMFile>> {
        return Promise.resolve({ success: false, error: 'naming failed' });
      }
      convertToCHD(rom: ROMFile): Promise<PhaseResult<ROMFile>> {
        return Promise.resolve({ success: true, data: rom });
      }
      generateMetadata(): Promise<PhaseResult<Record<string, unknown>>> {
        return Promise.resolve({ success: true, data: {} });
      }
    }

    class ArchiverFail implements IArchiver {
      archiveROM(): Promise<PhaseResult<string>> {
        return Promise.resolve({ success: false, error: 'archive failed' });
      }
      writeManifest(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: true });
      }
      storeMetadata(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: true });
      }
    }

    class PromoterFail implements IPromoter {
      promoteROM(): Promise<PhaseResult<string>> {
        return Promise.resolve({ success: false, error: 'promote failed' });
      }
      updatePlaylist(): Promise<PhaseResult<PlaylistEntry>> {
        return Promise.resolve({
          success: true,
          data: {
            path: '',
            label: '',
            core_path: '',
            core_name: '',
            crc32: '00000000',
            db_name: 'unknown',
          },
        });
      }
      syncThumbnails(): Promise<PhaseResult<boolean>> {
        return Promise.resolve({ success: true, data: false });
      }
    }

    it('should fail when validator hash generation fails', async () => {
      const config = createIsolatedConfig();
      const orchestrator = new PipelineOrchestrator(
        config,
        new StubClassifier(),
        new ValidatorFailHash(),
        new Normalizer(config),
        new Archiver(config),
        new Promoter(config)
      );

      const testFile = join(testDir, 'hashfail.nes');
      await writeFile(testFile, 'content');

      const result = await orchestrator.process(testFile);

      expect(result.success).toBe(false);
      expect(result.phase).toBe('validator');
      expect(result.errors[0]).toContain('hash failed');
    });

    it('should fail when normalizer naming fails', async () => {
      const config = createIsolatedConfig();
      const orchestrator = new PipelineOrchestrator(
        config,
        new StubClassifier(),
        new Validator(config),
        new NormalizerFail(),
        new Archiver(config),
        new Promoter(config)
      );

      const testFile = join(testDir, 'namefail.nes');
      await writeFile(testFile, 'content');

      const result = await orchestrator.process(testFile);

      expect(result.success).toBe(false);
      expect(result.phase).toBe('normalizer');
      expect(result.errors[0]).toContain('naming failed');
    });

    it('should fail when archiver fails', async () => {
      const config = createIsolatedConfig();
      const orchestrator = new PipelineOrchestrator(
        config,
        new StubClassifier(),
        new Validator(config),
        new Normalizer(config),
        new ArchiverFail(),
        new Promoter(config)
      );

      const testFile = join(testDir, 'archivefail.nes');
      await writeFile(testFile, 'content');

      const result = await orchestrator.process(testFile);

      expect(result.success).toBe(false);
      expect(result.phase).toBe('archiver');
      expect(result.errors[0]).toContain('archive failed');
    });

    it('should fail when promoter fails', async () => {
      const config = createIsolatedConfig();
      const orchestrator = new PipelineOrchestrator(
        config,
        new StubClassifier(),
        new Validator(config),
        new Normalizer(config),
        new Archiver(config),
        new PromoterFail()
      );

      const testFile = join(testDir, 'promotefail.nes');
      await writeFile(testFile, 'content');

      const result = await orchestrator.process(testFile);

      expect(result.success).toBe(false);
      expect(result.phase).toBe('promoter');
      expect(result.errors[0]).toContain('promote failed');
    });
  });
});

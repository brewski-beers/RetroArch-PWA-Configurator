/**
 * Test Factory for Pipeline Components
 * Follows Factory Pattern and DRY principles (TEST-001)
 * Single Responsibility: Create test fixtures for pipeline types
 */

import type {
  ROMFile,
  ManifestEntry,
  PlaylistEntry,
} from '../../src/interfaces/pipeline.interface.js';
import type {
  PlatformConfig,
  PlatformDefinition,
} from '../../src/interfaces/platform-config.interface.js';

export class ROMFileFactory {
  /**
   * Create a minimal valid ROMFile for testing
   */
  static create(overrides: Partial<ROMFile> = {}): ROMFile {
    return {
      id: 'test-rom-123',
      filename: 'test-game.nes',
      path: '/path/to/test-game.nes',
      platform: 'nes',
      extension: '.nes',
      size: 1024,
      ...overrides,
    };
  }

  /**
   * Create a ROMFile with hash
   */
  static withHash(hash = 'abc123def456'): ROMFile {
    return this.create({
      hash,
      metadata: {
        hashAlgorithm: 'sha256',
      },
    });
  }

  /**
   * Create a ROMFile for PlayStation (requires BIOS)
   */
  static forPlayStation(overrides: Partial<ROMFile> = {}): ROMFile {
    return this.create({
      filename: 'test-game.cue',
      extension: '.cue',
      platform: 'psx',
      ...overrides,
    });
  }

  /**
   * Create a ROMFile with metadata
   */
  static withMetadata(metadata: Record<string, unknown>): ROMFile {
    return this.create({
      metadata,
    });
  }
}

export class ManifestEntryFactory {
  /**
   * Create a minimal valid ManifestEntry for testing
   */
  static create(overrides: Partial<ManifestEntry> = {}): ManifestEntry {
    return {
      id: 'test-rom-123',
      filename: 'test-game.nes',
      platform: 'nes',
      hash: 'abc123def456',
      size: 1024,
      archivedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Create a ManifestEntry from a ROMFile
   */
  static fromROMFile(rom: ROMFile): ManifestEntry {
    return this.create({
      id: rom.id,
      filename: rom.filename,
      platform: rom.platform ?? 'unknown',
      hash: rom.hash ?? 'no-hash',
      size: rom.size,
    });
  }
}

export class PlaylistEntryFactory {
  /**
   * Create a minimal valid PlaylistEntry for testing
   */
  static create(overrides: Partial<PlaylistEntry> = {}): PlaylistEntry {
    return {
      path: '/path/to/rom/test-game.nes',
      label: 'Test Game',
      core_path: 'DETECT',
      core_name: 'DETECT',
      crc32: '00000000',
      db_name: 'Nintendo - NES',
      ...overrides,
    };
  }

  /**
   * Create a PlaylistEntry from a ROMFile
   */
  static fromROMFile(rom: ROMFile): PlaylistEntry {
    const CRC32_LENGTH = 8;
    return this.create({
      path: rom.path,
      label: rom.filename.replace(/\.[^.]+$/, ''),
      crc32: rom.hash?.substring(0, CRC32_LENGTH) ?? '00000000',
      db_name: rom.platform ?? 'Unknown',
    });
  }
}

export class PlatformConfigFactory {
  /**
   * Create a minimal valid PlatformConfig for testing
   */
  static create(overrides: Partial<PlatformConfig> = {}): PlatformConfig {
    return {
      version: '1.0.0',
      directories: {
        archive: {
          root: 'RetroArch-Archive',
          bios: 'RetroArch-Archive/BIOS',
          manifests: 'RetroArch-Archive/Manifests',
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
      pipeline: {
        enableClassifier: true,
        enableValidator: true,
        enableNormalizer: true,
        enableArchiver: true,
        enablePromoter: true,
        enableCHDConversion: false,
        enableThumbnails: false,
        enableMetadata: true,
      },
      platforms: [PlatformDefinitionFactory.nes()],
      plugins: {
        enabled: false,
      },
      ...overrides,
    };
  }

  /**
   * Create a PlatformConfig with all pipeline phases disabled
   */
  static withDisabledPipeline(): PlatformConfig {
    return this.create({
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
  }
}

export class PlatformDefinitionFactory {
  /**
   * Create NES platform definition
   */
  static nes(): PlatformDefinition {
    return {
      id: 'nes',
      name: 'Nintendo Entertainment System',
      extensions: ['.nes'],
      requiresBIOS: false,
    };
  }

  /**
   * Create PlayStation platform definition (requires BIOS)
   */
  static psx(): PlatformDefinition {
    return {
      id: 'psx',
      name: 'Sony PlayStation',
      extensions: ['.cue', '.bin', '.chd'],
      requiresBIOS: true,
      biosFiles: ['scph5500.bin', 'scph5501.bin', 'scph5502.bin'],
      supportedCompanionFiles: ['.cue'],
    };
  }

  /**
   * Create SNES platform definition
   */
  static snes(): PlatformDefinition {
    return {
      id: 'snes',
      name: 'Super Nintendo Entertainment System',
      extensions: ['.sfc', '.smc'],
      requiresBIOS: false,
    };
  }
}

/**
 * Archiver Phase Implementation
 * Phase 4: Archives normalized ROMs
 * Following SRP - single responsibility: archival
 */

import type {
  IArchiver,
  PhaseResult,
  ROMFile,
  ManifestEntry,
} from '../interfaces/pipeline.interface.js';
import type { PlatformConfig } from '../interfaces/platform-config.interface.js';

export class Archiver implements IArchiver {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Copies normalized ROM to archive
   */
  async archiveROM(rom: ROMFile): Promise<PhaseResult<string>> {
    // TODO: Implement in Phase D
    const archivePath = `${this.config.directories.archive.roms}/${rom.platform}/${rom.filename}`;

    return Promise.resolve({
      success: true,
      data: archivePath,
      metadata: {
        archivedAt: new Date().toISOString(),
        sourcePath: rom.path,
      },
    });
  }

  /**
   * Writes manifest entry
   */
  async writeManifest(entry: ManifestEntry): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: true,
      metadata: {
        manifestPath: `${this.config.directories.archive.manifests}/${entry.platform}.json`,
        writtenAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Stores hash and metadata
   */
  async storeMetadata(rom: ROMFile): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: true,
      metadata: {
        storedAt: new Date().toISOString(),
        metadataPath: `${this.config.directories.archive.manifests}/metadata/${rom.id}.json`,
      },
    });
  }
}

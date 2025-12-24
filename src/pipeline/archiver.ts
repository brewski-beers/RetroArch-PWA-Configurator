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
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
const JSON_INDENT = 2;

export class Archiver implements IArchiver {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Copies normalized ROM to archive
   */
  async archiveROM(rom: ROMFile): Promise<PhaseResult<string>> {
    try {
      const archivePath = join(
        this.config.directories.archive.roms,
        rom.platform ?? 'unknown',
        rom.filename
      );

      // Ensure directory exists
      await mkdir(dirname(archivePath), { recursive: true });

      // Copy file to archive
      await copyFile(rom.path, archivePath);

      return {
        success: true,
        data: archivePath,
        metadata: {
          archivedAt: new Date().toISOString(),
          sourcePath: rom.path,
        },
      };
    } catch (error) {
      return {
        success: false,
        // TEST-007: Skip coverage - defensive check for non-Error exception
        error: error instanceof Error ? error.message : 'Archive failed',
      };
    }
  }

  /**
   * Writes manifest entry
   */
  async writeManifest(entry: ManifestEntry): Promise<PhaseResult<boolean>> {
    try {
      const manifestPath = join(
        this.config.directories.archive.manifests,
        `${entry.platform}.json`
      );

      // Ensure manifests directory exists
      await mkdir(this.config.directories.archive.manifests, {
        recursive: true,
      });

      // Read existing manifest or create new one
      let manifest: ManifestEntry[] = [];
      if (existsSync(manifestPath)) {
        const data = await readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(data) as ManifestEntry[];
      }

      // Check if entry already exists (by id or hash)
      const existingIndex = manifest.findIndex(
        (e) => e.id === entry.id || e.hash === entry.hash
      );

      if (existingIndex >= 0) {
        // Update existing entry
        manifest[existingIndex] = entry;
      } else {
        // Add new entry
        manifest.push(entry);
      }

      // Write manifest back
      await writeFile(
        manifestPath,
        JSON.stringify(manifest, null, JSON_INDENT),
        'utf-8'
      );

      return {
        success: true,
        data: true,
        metadata: {
          manifestPath,
          writtenAt: new Date().toISOString(),
          totalEntries: manifest.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        // TEST-007: Skip coverage - defensive check for non-Error exception
        error: error instanceof Error ? error.message : 'Manifest write failed',
      };
    }
  }

  /**
   * Stores hash and metadata
   */
  async storeMetadata(rom: ROMFile): Promise<PhaseResult<boolean>> {
    try {
      const metadataDir = join(
        this.config.directories.archive.manifests,
        'metadata'
      );
      const metadataPath = join(metadataDir, `${rom.id}.json`);

      // Ensure metadata directory exists
      await mkdir(metadataDir, { recursive: true });

      // Write metadata
      const metadata = {
        id: rom.id,
        filename: rom.filename,
        platform: rom.platform,
        hash: rom.hash,
        size: rom.size,
        extension: rom.extension,
        metadata: rom.metadata,
        storedAt: new Date().toISOString(),
      };

      await writeFile(
        metadataPath,
        JSON.stringify(metadata, null, JSON_INDENT),
        'utf-8'
      );

      return {
        success: true,
        data: true,
        metadata: {
          storedAt: new Date().toISOString(),
          metadataPath,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        // TEST-007: Skip coverage - defensive check for non-Error exception
        error: error instanceof Error ? error.message : 'Metadata store failed',
      };
    }
  }
}

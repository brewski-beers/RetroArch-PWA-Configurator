/**
 * Classifier Phase Implementation
 * Phase 1: Accepts raw ROMs and classifies them by extension
 * Following SRP - single responsibility: file classification
 */

import type {
  IClassifier,
  PhaseResult,
  ROMFile,
} from '../interfaces/pipeline.interface.js';
import type { PlatformConfig } from '../interfaces/platform-config.interface.js';
import { basename, extname, resolve } from 'node:path';
import { stat } from 'node:fs/promises';

export class Classifier implements IClassifier {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Classifies a file by extension and determines platform
   */
  async classify(filePath: string): Promise<PhaseResult<ROMFile>> {
    // Defensive: Validate input
    if (!filePath || filePath.trim() === '') {
      return {
        success: false,
        error: 'Invalid input: file path is required',
      };
    }

    try {
      // Security: Resolve to absolute path and validate
      const resolvedPath = resolve(filePath);
      const filename = basename(resolvedPath);

      // Reject paths with traversal attempts or invalid characters
      if (filePath.includes('..') || filename !== basename(filePath)) {
        return {
          success: false,
          error: 'Invalid file path',
        };
      }

      const extension = extname(filename).toLowerCase();
      const stats = await stat(resolvedPath);

      // Defensive: Check if path is a directory
      if (stats.isDirectory()) {
        return {
          success: false,
          error: 'Invalid input: path is a directory, not a file',
        };
      }

      // Find platform by extension
      const platform = this.config.platforms.find((p) =>
        p.extensions.includes(extension)
      );

      if (!platform) {
        return {
          success: false,
          error: `Unknown file extension: ${extension}`,
        };
      }

      const rom: ROMFile = {
        id: this.generateROMId(filename),
        filename,
        path: resolvedPath,
        platform: platform.id,
        extension,
        size: stats.size,
        metadata: {
          classifiedAt: new Date().toISOString(),
          platformName: platform.name,
        },
      };

      return {
        success: true,
        data: rom,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Moves classified files to validation phase
   */
  moveToValidation(rom: ROMFile): PhaseResult<string> {
    // Defensive: Validate input
    if (rom === undefined || rom === null) {
      return {
        success: false,
        error: 'Invalid input: ROM object is null or undefined',
      };
    }

    if (
      rom.platform === undefined ||
      rom.platform === null ||
      rom.platform.trim() === ''
    ) {
      return {
        success: false,
        error: 'Invalid input: ROM platform is required',
      };
    }

    if (
      rom.filename === undefined ||
      rom.filename === null ||
      rom.filename.trim() === ''
    ) {
      return {
        success: false,
        error: 'Invalid input: ROM filename is required',
      };
    }

    // TODO: Implement in Phase D
    // For now, return success with placeholder
    return {
      success: true,
      data: `${this.config.directories.workspace.validation}/${rom.platform}/${rom.filename}`,
      metadata: {
        movedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generates a unique ROM ID
   */
  private generateROMId(filename: string): string {
    const timestamp = Date.now();
    const cleanName = filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `rom-${cleanName}-${timestamp}`;
  }
}

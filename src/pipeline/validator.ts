/**
 * Validator Phase Implementation
 * Phase 2: Validates file integrity and dependencies
 * Following SRP - single responsibility: validation
 */

import type {
  IValidator,
  PhaseResult,
  ROMFile,
} from '../interfaces/pipeline.interface.js';
import type { PlatformConfig } from '../interfaces/platform-config.interface.js';
import { createHash } from 'node:crypto';
import { createReadStream, access } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, basename, extname, join } from 'node:path';

export class Validator implements IValidator {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Validates file integrity
   */
  async validateIntegrity(rom: ROMFile): Promise<PhaseResult<boolean>> {
    try {
      // Check if file exists and is readable
      await new Promise<void>((resolve, reject) => {
        access(rom.path, constants.R_OK, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      return {
        success: true,
        data: true,
        metadata: {
          validatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : 'File access error',
      };
    }
  }

  /**
   * Checks for companion files (cue sheets, etc.)
   */
  async checkCompanionFiles(rom: ROMFile): Promise<PhaseResult<string[]>> {
    try {
      const platform = this.config.platforms.find((p) => p.id === rom.platform);
      if (!platform?.supportedCompanionFiles) {
        return {
          success: true,
          data: [],
          metadata: {
            checkedAt: new Date().toISOString(),
            noCompanionFilesRequired: true,
          },
        };
      }

      const dir = dirname(rom.path);
      const baseName = basename(rom.path, extname(rom.path));
      const files = await readdir(dir);

      const companionFiles = files.filter((file) => {
        const fileBase = basename(file, extname(file));
        const fileExt = extname(file);
        return (
          fileBase === baseName &&
          platform.supportedCompanionFiles !== undefined &&
          platform.supportedCompanionFiles.includes(fileExt)
        );
      });

      return {
        success: true,
        data: companionFiles.map((file) => join(dir, file)),
        metadata: {
          checkedAt: new Date().toISOString(),
          companionFilesFound: companionFiles.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      };
    }
  }

  /**
   * Generates hash for file
   */
  async generateHash(rom: ROMFile): Promise<PhaseResult<string>> {
    return new Promise((resolve) => {
      try {
        const hash = createHash('sha256');
        const stream = createReadStream(rom.path);

        stream.on('data', (chunk) => hash.update(chunk));

        stream.on('end', () => {
          const digest = hash.digest('hex');
          resolve({
            success: true,
            data: digest,
            metadata: {
              algorithm: 'sha256',
              generatedAt: new Date().toISOString(),
              fileSize: rom.size,
            },
          });
        });

        stream.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Checks for duplicates
   */
  async checkDuplicate(_hash: string): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: false,
      metadata: {
        checkedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Validates BIOS dependencies
   */
  async validateBIOSDependencies(rom: ROMFile): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    const platform = this.config.platforms.find((p) => p.id === rom.platform);
    if (!platform) {
      return Promise.resolve({
        success: false,
        error: `Platform not found: ${rom.platform}`,
      });
    }

    if (!platform.requiresBIOS) {
      return Promise.resolve({
        success: true,
        data: true,
        metadata: {
          biosRequired: false,
        },
      });
    }

    // Placeholder for BIOS validation
    return Promise.resolve({
      success: true,
      data: true,
      metadata: {
        biosRequired: true,
        biosFiles: platform.biosFiles,
      },
    });
  }

  /**
   * Validates naming correctness
   */
  async validateNaming(_rom: ROMFile): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: true,
      metadata: {
        validatedAt: new Date().toISOString(),
      },
    });
  }
}

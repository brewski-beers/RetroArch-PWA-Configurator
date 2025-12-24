/**
 * Validator Phase Implementation
 * Phase 2: Validates file integrity and dependencies
 * Following SRP - single responsibility: validation
 */

import { createHash } from 'node:crypto';
import { createReadStream, access } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, basename, extname, join } from 'node:path';

import type { PlatformConfig } from '../interfaces/platform-config.interface.js';
import type {
  IValidator,
  PhaseResult,
  ROMFile,
  ManifestEntry,
} from '../interfaces/pipeline.interface.js';

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
   * Checks for duplicates by searching all platform manifests
   */
  async checkDuplicate(hash: string): Promise<PhaseResult<boolean>> {
    try {
      const manifestsDir = this.config.directories.archive.manifests;
      const manifestErrors: string[] = [];

      // Read all manifest files in the manifests directory
      let manifestFiles: string[] = [];
      try {
        manifestFiles = await readdir(manifestsDir);
      } catch {
        // Directory doesn't exist or can't be read - no duplicates
        return {
          success: true,
          data: false,
          metadata: {
            checkedAt: new Date().toISOString(),
          },
        };
      }

      // Filter to only .json files
      const jsonFiles = manifestFiles.filter((file) => file.endsWith('.json'));

      // Search each manifest for the hash
      for (const manifestFile of jsonFiles) {
        try {
          const manifestPath = join(manifestsDir, manifestFile);
          const data = await readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(data) as ManifestEntry[];

          // Search for hash in this manifest
          const duplicate = manifest.find((entry) => entry.hash === hash);
          if (duplicate) {
            return {
              success: true,
              data: true,
              metadata: {
                checkedAt: new Date().toISOString(),
                foundInManifest: manifestFile,
                duplicateOf: duplicate.filename,
              },
            };
          }
        } catch (error) {
          // Track malformed manifests but continue searching
          manifestErrors.push(
            `${manifestFile}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // No duplicate found
      const result: PhaseResult<boolean> = {
        success: true,
        data: false,
        metadata: {
          checkedAt: new Date().toISOString(),
        },
      };

      if (manifestErrors.length > 0) {
        result.metadata = {
          ...result.metadata,
          manifestErrors,
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: false,
      };
    }
  }

  /**
   * Validates BIOS dependencies
   */
  async validateBIOSDependencies(rom: ROMFile): Promise<PhaseResult<boolean>> {
    const platform = this.config.platforms.find((p) => p.id === rom.platform);
    if (!platform) {
      return {
        success: false,
        error: `Platform not found: ${rom.platform}`,
      };
    }

    if (!platform.requiresBIOS || !platform.biosFiles) {
      return {
        success: true,
        data: true,
        metadata: {
          biosRequired: false,
        },
      };
    }

    // Check each required BIOS file
    const biosDir = this.config.directories.archive.bios;
    const foundFiles: string[] = [];
    const missingFiles: string[] = [];

    for (const biosFile of platform.biosFiles) {
      const biosPath = join(biosDir, biosFile);
      try {
        await new Promise<void>((resolve, reject) => {
          access(biosPath, constants.R_OK, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        foundFiles.push(biosFile);
      } catch {
        missingFiles.push(biosFile);
      }
    }

    const allFilesFound = missingFiles.length === 0;

    return {
      success: true,
      data: allFilesFound,
      metadata: {
        biosRequired: true,
        biosFiles: platform.biosFiles,
        foundFiles,
        ...(missingFiles.length > 0 && { missingFiles }),
      },
    };
  }

  /**
   * Validates naming correctness
   * Checks for valid filename format and extension
   */
  async validateNaming(rom: ROMFile): Promise<PhaseResult<boolean>> {
    const MAX_FILENAME_LENGTH = 255;
    const INVALID_CHARS_REGEX = /[<>:"|?*]/;

    // Check for empty filename
    if (!rom.filename || rom.filename.trim().length === 0) {
      return Promise.resolve({
        success: true,
        data: false,
        metadata: {
          validatedAt: new Date().toISOString(),
          reason: 'Filename is empty',
        },
      });
    }

    // Check for extension
    if (!rom.extension || rom.extension.trim().length === 0) {
      return Promise.resolve({
        success: true,
        data: false,
        metadata: {
          validatedAt: new Date().toISOString(),
          reason: 'Filename missing extension',
        },
      });
    }

    // Check for invalid characters
    if (INVALID_CHARS_REGEX.test(rom.filename)) {
      const invalidChars = rom.filename.match(INVALID_CHARS_REGEX);
      return Promise.resolve({
        success: true,
        data: false,
        metadata: {
          validatedAt: new Date().toISOString(),
          invalidCharacters: invalidChars ? [...invalidChars] : [],
        },
      });
    }

    // Check for filename length
    if (rom.filename.length > MAX_FILENAME_LENGTH) {
      return Promise.resolve({
        success: true,
        data: false,
        metadata: {
          validatedAt: new Date().toISOString(),
          reason: `Filename too long (max ${MAX_FILENAME_LENGTH} characters)`,
        },
      });
    }

    // All validations passed
    return Promise.resolve({
      success: true,
      data: true,
      metadata: {
        validatedAt: new Date().toISOString(),
      },
    });
  }
}

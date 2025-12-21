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

export class Validator implements IValidator {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Validates file integrity
   */
  async validateIntegrity(_rom: ROMFile): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: true,
      metadata: {
        validatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Checks for companion files (cue sheets, etc.)
   */
  async checkCompanionFiles(_rom: ROMFile): Promise<PhaseResult<string[]>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: [],
      metadata: {
        checkedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Generates hash for file
   */
  async generateHash(_rom: ROMFile): Promise<PhaseResult<string>> {
    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: 'placeholder-hash',
      metadata: {
        algorithm: 'sha256',
        generatedAt: new Date().toISOString(),
      },
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

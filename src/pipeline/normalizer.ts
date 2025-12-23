/**
 * Normalizer Phase Implementation
 * Phase 3: Normalizes and prepares files for archival
 * Following SRP - single responsibility: normalization
 */

import type {
  INormalizer,
  PhaseResult,
  ROMFile,
} from '../interfaces/pipeline.interface.js';
import type { PlatformConfig } from '../interfaces/platform-config.interface.js';

export class Normalizer implements INormalizer {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Applies naming patterns to ROM
   */
  async applyNamingPattern(rom: ROMFile): Promise<PhaseResult<ROMFile>> {
    // Defensive: Validate input
    if (rom === undefined || rom === null) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: ROM object is null or undefined',
      });
    }

    if (
      rom.filename === undefined ||
      rom.filename === null ||
      rom.filename.trim() === ''
    ) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: filename is required',
      });
    }

    if (
      rom.platform === undefined ||
      rom.platform === null ||
      rom.extension === undefined ||
      rom.extension === null
    ) {
      return Promise.resolve({
        success: false,
        error:
          'Invalid input: ROM missing required fields (platform, extension)',
      });
    }

    // TODO: Implement in Phase D
    return Promise.resolve({
      success: true,
      data: rom,
      metadata: {
        normalizedAt: new Date().toISOString(),
        originalName: rom.filename,
      },
    });
  }

  /**
   * Converts to CHD format (optional)
   */
  async convertToCHD(rom: ROMFile): Promise<PhaseResult<ROMFile>> {
    // Defensive: Validate input
    if (rom === undefined || rom === null) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: ROM object is null or undefined',
      });
    }

    if (rom.platform === undefined || rom.platform === null) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: ROM platform is required for CHD conversion',
      });
    }

    // TODO: Implement in Phase D
    if (!this.config.pipeline.enableCHDConversion) {
      return Promise.resolve({
        success: true,
        data: rom,
        metadata: {
          converted: false,
          reason: 'CHD conversion disabled',
        },
      });
    }

    return Promise.resolve({
      success: true,
      data: rom,
      metadata: {
        converted: false,
        reason: 'Not yet implemented',
      },
    });
  }

  /**
   * Generates metadata for ROM
   */
  async generateMetadata(
    rom: ROMFile
  ): Promise<PhaseResult<Record<string, unknown>>> {
    // Defensive: Validate input
    if (rom === undefined || rom === null) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: ROM object is null or undefined',
      });
    }

    if (
      rom.platform === undefined ||
      rom.platform === null ||
      rom.filename === undefined ||
      rom.filename === null ||
      rom.size === undefined
    ) {
      return Promise.resolve({
        success: false,
        error:
          'Invalid input: ROM missing required fields (platform, filename, size)',
      });
    }

    if (rom.size < 0) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: ROM size cannot be negative',
      });
    }

    if (
      rom.extension === undefined ||
      rom.extension === null ||
      rom.extension.trim() === ''
    ) {
      return Promise.resolve({
        success: false,
        error: 'Invalid input: ROM extension is required',
      });
    }

    // TODO: Implement in Phase D
    const metadata = {
      platform: rom.platform,
      filename: rom.filename,
      size: rom.size,
      extension: rom.extension,
      generatedAt: new Date().toISOString(),
    };

    return Promise.resolve({
      success: true,
      data: metadata,
    });
  }
}

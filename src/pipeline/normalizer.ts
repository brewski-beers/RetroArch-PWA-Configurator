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

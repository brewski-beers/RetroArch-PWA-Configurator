/**
 * Test Factory for Simple Configuration
 * Follows Factory Pattern and DRY principles (TEST-001)
 * Single Responsibility: Create test fixtures for SimpleConfig
 */

import type {
  SimpleConfig,
  RetroArchPaths,
} from '../../src/interfaces/user-config.interface.js';

export class SimpleConfigFactory {
  /**
   * Create a minimal valid SimpleConfig for testing
   */
  static create(overrides: Partial<SimpleConfig> = {}): SimpleConfig {
    return {
      version: '1.0.0',
      basePath: '/test/retroarch',
      ...overrides,
    };
  }

  /**
   * Create an invalid SimpleConfig for testing validation
   */
  static invalid(overrides: Partial<SimpleConfig> = {}): Partial<SimpleConfig> {
    return {
      version: '',
      basePath: '',
      ...overrides,
    };
  }
}

export class RetroArchPathsFactory {
  /**
   * Create RetroArch paths for testing
   */
  static create(basePath = '/test/retroarch'): RetroArchPaths {
    return {
      retroarch: basePath,
      downloads: `${basePath}/downloads`,
      playlists: `${basePath}/playlists`,
      system: `${basePath}/system`,
      saves: `${basePath}/saves`,
      states: `${basePath}/states`,
      thumbnails: `${basePath}/thumbnails`,
      archive: `${basePath}/.archive`,
      manifests: `${basePath}/.archive/manifests`,
    };
  }
}

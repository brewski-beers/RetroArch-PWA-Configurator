/**
 * Test Factory for Configuration Objects
 * Follows Factory Pattern and DRY principles (TEST-001)
 * Single Responsibility: Create test fixtures for config types
 */

import type { UserConfig } from '../../src/interfaces/user-config.interface.js';

export class ConfigFactory {
  /**
   * Create a minimal valid UserConfig for testing
   */
  static create(overrides: Partial<UserConfig> = {}): UserConfig {
    return {
      version: '1.0.0',
      name: 'Test Configuration',
      colocate: false,
      archive: {
        root: {
          path: '/test/archive',
          description: 'Test archive',
          required: true,
        },
        roms: {
          path: '/test/archive/roms',
          description: 'Test ROMs',
          required: true,
        },
        manifests: {
          path: '/test/archive/manifests',
          description: 'Test manifests',
          required: true,
        },
        bios: {
          path: '/test/archive/bios',
          description: 'Test BIOS',
          required: false,
        },
        metadata: {
          path: '/test/archive/metadata',
          description: 'Test metadata',
          required: false,
        },
      },
      sync: {
        root: { path: '/test/sync', description: 'Test sync', required: true },
        content: {
          path: '/test/sync/content',
          description: 'Test content',
          required: true,
        },
        playlists: {
          path: '/test/sync/playlists',
          description: 'Test playlists',
          required: true,
        },
        thumbnails: {
          path: '/test/sync/thumbnails',
          description: 'Test thumbnails',
          required: false,
        },
        saveStates: {
          path: '/test/sync/states',
          description: 'Test states',
          required: false,
        },
      },
      workspace: {
        processing: {
          path: '/test/workspace/processing',
          description: 'Test processing',
          required: true,
        },
        logs: {
          path: '/test/workspace/logs',
          description: 'Test logs',
          required: true,
        },
        backups: {
          path: '/test/workspace/backups',
          description: 'Test backups',
          required: false,
        },
      },
      ...overrides,
    };
  }

  /**
   * Create an invalid UserConfig for testing validation
   */
  static invalid(overrides: Partial<UserConfig> = {}): Partial<UserConfig> {
    return {
      version: '',
      name: '',
      ...overrides,
    };
  }

  /**
   * Create a co-located UserConfig for testing
   */
  static colocated(basePath = '/test/retroarch'): UserConfig {
    return this.create({
      colocate: true,
      basePath,
    });
  }
}

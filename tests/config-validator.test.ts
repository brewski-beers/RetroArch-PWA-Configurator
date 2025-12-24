/**
 * Tests for Configuration Validator
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { ConfigValidator } from '../src/config/config-validator.js';
import { coLocatedTemplate } from '../src/config/config-templates.js';
import type { UserConfig } from '../src/interfaces/user-config.interface.js';

import { ConfigFactory } from './factories/config.factory.js';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;
  const EXAMPLE_BASE_PATH = '/home/user/RetroArch';

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validate', () => {
    it('should validate correct co-located configuration', () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when version is missing', () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      config.version = '';

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration version is required');
    });

    it('should fail when name is missing', () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      config.name = '';

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration name is required');
    });

    it('should fail when colocate is true but basePath is missing', () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      config.colocate = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (config as any).basePath;

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Base path is required when co-locating directories'
      );
    });

    it('should fail when required directory path is empty', () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      config.archive.root.path = '';

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Archive.root: Path is required');
    });

    it('should warn for relative paths', () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      config.archive.root.path = './relative/path';

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('not absolute');
    });

    it('should detect path conflicts when one path is parent of another', () => {
      // Arrange
      const config: UserConfig = {
        version: '1.0.0',
        name: 'Conflicting Paths',
        colocate: false,
        archive: {
          root: {
            path: '/home/user/RetroArch',
            description: 'Archive root',
            required: true,
          },
          roms: {
            path: '/home/user/RetroArch/Archive/ROMs',
            description: 'ROMs',
            required: true,
          },
          manifests: {
            path: '/home/user/RetroArch/Archive/Manifests',
            description: 'Manifests',
            required: true,
          },
          bios: {
            path: '/home/user/RetroArch/Archive/BIOS',
            description: 'BIOS',
            required: false,
          },
          metadata: {
            path: '/home/user/RetroArch/Archive/Metadata',
            description: 'Metadata',
            required: false,
          },
        },
        sync: {
          root: {
            path: '/home/user/RetroArch/Archive/Sync', // Inside archive!
            description: 'Sync root',
            required: true,
          },
          content: {
            path: '/home/user/RetroArch/Archive/Sync/content',
            description: 'Content',
            required: true,
          },
          playlists: {
            path: '/home/user/RetroArch/Archive/Sync/playlists',
            description: 'Playlists',
            required: true,
          },
          thumbnails: {
            path: '/home/user/RetroArch/Archive/Sync/thumbnails',
            description: 'Thumbnails',
            required: false,
          },
          saveStates: {
            path: '/home/user/RetroArch/Archive/Sync/states',
            description: 'States',
            required: false,
          },
        },
        workspace: {
          processing: {
            path: '/tmp/processing',
            description: 'Processing',
            required: true,
          },
          logs: {
            path: '/tmp/logs',
            description: 'Logs',
            required: true,
          },
          backups: {
            path: '/tmp/backups',
            description: 'Backups',
            required: false,
          },
        },
      };

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: string) => e.includes('Path conflict'))
      ).toBe(true);
    });

    it('should allow non-overlapping paths', () => {
      // Arrange
      const config: UserConfig = {
        version: '1.0.0',
        name: 'Non-Overlapping Paths',
        colocate: false,
        archive: {
          root: {
            path: '/home/user/Archive',
            description: 'Archive',
            required: true,
          },
          roms: {
            path: '/home/user/Archive/ROMs',
            description: 'ROMs',
            required: true,
          },
          manifests: {
            path: '/home/user/Archive/Manifests',
            description: 'Manifests',
            required: true,
          },
          bios: {
            path: '/home/user/Archive/BIOS',
            description: 'BIOS',
            required: false,
          },
          metadata: {
            path: '/home/user/Archive/Metadata',
            description: 'Metadata',
            required: false,
          },
        },
        sync: {
          root: {
            path: '/mnt/nas/Sync',
            description: 'Sync',
            required: true,
          },
          content: {
            path: '/mnt/nas/Sync/content',
            description: 'Content',
            required: true,
          },
          playlists: {
            path: '/mnt/nas/Sync/playlists',
            description: 'Playlists',
            required: true,
          },
          thumbnails: {
            path: '/mnt/nas/Sync/thumbnails',
            description: 'Thumbnails',
            required: false,
          },
          saveStates: {
            path: '/mnt/nas/Sync/states',
            description: 'States',
            required: false,
          },
        },
        workspace: {
          processing: {
            path: '/tmp/workspace/processing',
            description: 'Processing',
            required: true,
          },
          logs: {
            path: '/tmp/workspace/logs',
            description: 'Logs',
            required: true,
          },
          backups: {
            path: '/tmp/workspace/backups',
            description: 'Backups',
            required: false,
          },
        },
      };

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate config created by factory', () => {
      // Arrange
      const config = ConfigFactory.create();

      // Act
      const result = validator.validate(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

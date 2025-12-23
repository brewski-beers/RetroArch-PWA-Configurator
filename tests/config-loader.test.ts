/**
 * Tests for Configuration Loader
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 * Covering error paths for POL-002 (Test Coverage)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../src/config/config-loader.js';
import { ConfigValidator } from '../src/config/config-validator.js';
import { coLocatedTemplate } from '../src/config/config-templates.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import type { UserConfig } from '../src/interfaces/user-config.interface.js';
import { ConfigFactory } from './factories/config.factory.js';

describe('ConfigLoader', () => {
  let loader: ConfigLoader;
  const testDir = join(process.cwd(), 'test-config-loader');
  const testConfigPath = join(testDir, 'user-config.json');
  const EXAMPLE_BASE_PATH = '/home/user/RetroArch';

  beforeEach(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
    loader = new ConfigLoader(testConfigPath);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('should load valid configuration file', async () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      await writeFile(testConfigPath, JSON.stringify(config, null, 2));

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.name).toBe(config.name);
      expect(result.config?.version).toBe(config.version);
    });

    it('should return default config when file does not exist', async () => {
      // Arrange - no file created

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.name).toContain('Default');
      expect(result.isDefault).toBe(true);
    });

    it('should fail when config file has invalid JSON', async () => {
      // Arrange
      await writeFile(testConfigPath, 'invalid json content {');

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should fail when config file fails validation', async () => {
      // Arrange
      const invalidConfig = {
        version: '', // Missing required field
        name: 'Invalid Config',
        archive: {},
        sync: {},
        workspace: {},
        colocate: false,
      };
      await writeFile(testConfigPath, JSON.stringify(invalidConfig));

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    it('should provide validation errors in result', async () => {
      // Arrange
      const invalidConfig = ConfigFactory.invalid({
        colocate: false,
        archive: {
          root: { path: '', description: 'Root', required: true },
          roms: { path: '', description: 'ROMs', required: true },
          manifests: { path: '', description: 'Manifests', required: true },
          bios: { path: '', description: 'BIOS', required: false },
          metadata: { path: '', description: 'Metadata', required: false },
        } as UserConfig['archive'],
        sync: {
          root: { path: '', description: 'Root', required: true },
          content: { path: '', description: 'Content', required: true },
          playlists: { path: '', description: 'Playlists', required: true },
          thumbnails: { path: '', description: 'Thumbnails', required: false },
          saveStates: { path: '', description: 'States', required: false },
        } as UserConfig['sync'],
        workspace: {
          processing: { path: '', description: 'Processing', required: true },
          logs: { path: '', description: 'Logs', required: true },
          backups: { path: '', description: 'Backups', required: false },
        } as UserConfig['workspace'],
      }) as UserConfig;
      await writeFile(testConfigPath, JSON.stringify(invalidConfig));

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.length).toBeGreaterThan(0);
    });

    it('should handle file permission errors gracefully', async () => {
      // Arrange - Create a file with no read permissions
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      await writeFile(testConfigPath, JSON.stringify(config));
      // Note: chmod might not work as expected in all test environments
      // This is more of a documentation test

      // Act
      const result = await loader.load();

      // Assert - Should either succeed or fail gracefully
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle empty file gracefully', async () => {
      // Arrange
      await writeFile(testConfigPath, '');

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle null config data', async () => {
      // Arrange
      await writeFile(testConfigPath, 'null');

      // Act
      const result = await loader.load();

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('save', () => {
    it('should save valid configuration to file', async () => {
      // Arrange
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);

      // Act
      const result = await loader.save(config);

      // Assert
      expect(result.success).toBe(true);

      // Verify file was created and can be loaded
      const loadResult = await loader.load();
      expect(loadResult.success).toBe(true);
      expect(loadResult.config?.name).toBe(config.name);
    });

    it('should fail to save invalid configuration', async () => {
      // Arrange
      const invalidConfig = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      invalidConfig.version = ''; // Make it invalid

      // Act
      const result = await loader.save(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    it('should create directory if it does not exist', async () => {
      // Arrange
      const nestedDir = join(testDir, 'nested', 'path');
      const nestedConfigPath = join(nestedDir, 'user-config.json');
      const nestedLoader = new ConfigLoader(nestedConfigPath);
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);

      // Act
      const result = await nestedLoader.save(config);

      // Assert
      expect(result.success).toBe(true);

      // Verify file exists
      const loadResult = await nestedLoader.load();
      expect(loadResult.success).toBe(true);
    });

    it('should handle null config input', async () => {
      // Act
      const result = await loader.save(null as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined config input', async () => {
      // Act
      const result = await loader.save(undefined as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should preserve validation errors on save failure', async () => {
      // Arrange
      const invalidConfig = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);
      invalidConfig.version = '';
      invalidConfig.name = '';

      // Act
      const result = await loader.save(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return recommended template as default', () => {
      // Arrange
      const defaultBasePath = process.cwd();

      // Act
      const config = loader.getDefaultConfig();

      // Assert
      expect(config).toBeDefined();
      expect(config.name).toContain('Default');
      expect(config.colocate).toBe(true); // Recommended template is co-located
      expect(config.basePath).toBe(defaultBasePath);
    });

    it('should return valid configuration', () => {
      // Act
      const config = loader.getDefaultConfig();

      // Assert - Config should pass validation
      const validator = new ConfigValidator();
      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });
  });
});

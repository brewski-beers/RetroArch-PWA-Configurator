/**
 * Tests for Simple Configuration
 * Following TEST-002 (AAA Pattern) and TEST-003 (SRP)
 */

import { describe, it, expect } from 'vitest';

import {
  generateRetroArchPaths,
  validateSimpleConfig,
  createSimpleConfig,
} from '../src/config/simple-config.js';

import { SimpleConfigFactory } from './factories/simple-config.factory.js';

describe('Simple Configuration', () => {
  describe('generateRetroArchPaths', () => {
    it('should generate correct RetroArch paths', () => {
      // Arrange
      const basePath = '/home/user/RetroArch';

      // Act
      const paths = generateRetroArchPaths(basePath);

      // Assert
      expect(paths.retroarch).toBe('/home/user/RetroArch');
      expect(paths.downloads).toBe('/home/user/RetroArch/downloads');
      expect(paths.playlists).toBe('/home/user/RetroArch/playlists');
      expect(paths.system).toBe('/home/user/RetroArch/system');
      expect(paths.saves).toBe('/home/user/RetroArch/saves');
      expect(paths.states).toBe('/home/user/RetroArch/states');
      expect(paths.thumbnails).toBe('/home/user/RetroArch/thumbnails');
      expect(paths.archive).toBe('/home/user/RetroArch/.archive');
      expect(paths.manifests).toBe('/home/user/RetroArch/.archive/manifests');
    });

    it('should handle Windows-style paths', () => {
      // Arrange
      const basePath = 'C:\\Users\\user\\RetroArch';

      // Act
      const paths = generateRetroArchPaths(basePath);

      // Assert
      expect(paths.retroarch).toBe('C:\\Users\\user\\RetroArch');
      expect(paths.downloads).toContain('RetroArch');
      expect(paths.downloads).toContain('downloads');
    });
  });

  describe('validateSimpleConfig', () => {
    it('should validate a correct config', () => {
      // Arrange
      const config = SimpleConfigFactory.create();

      // Act
      const result = validateSimpleConfig(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject config without version', () => {
      // Arrange
      const config = SimpleConfigFactory.create({ version: '' });

      // Act
      const result = validateSimpleConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('version');
    });

    it('should reject config without basePath', () => {
      // Arrange
      const config = SimpleConfigFactory.create({ basePath: '' });

      // Act
      const result = validateSimpleConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('basePath');
    });

    it('should reject config with only whitespace basePath', () => {
      // Arrange
      const config = SimpleConfigFactory.create({ basePath: '   ' });

      // Act
      const result = validateSimpleConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('createSimpleConfig', () => {
    it('should create a valid config', () => {
      // Arrange
      const basePath = '/home/user/RetroArch';

      // Act
      const config = createSimpleConfig(basePath);

      // Assert
      expect(config.version).toBe('1.0.0');
      expect(config.basePath).toBe('/home/user/RetroArch');
    });

    it('should trim whitespace from basePath', () => {
      // Arrange
      const basePath = '  /home/user/RetroArch  ';

      // Act
      const config = createSimpleConfig(basePath);

      // Assert
      expect(config.basePath).toBe('/home/user/RetroArch');
    });

    it('should throw error for empty basePath', () => {
      // Arrange
      const basePath = '';

      // Act & Assert
      expect(() => createSimpleConfig(basePath)).toThrow('Invalid basePath');
    });

    it('should throw error for whitespace-only basePath', () => {
      // Arrange
      const basePath = '   ';

      // Act & Assert
      expect(() => createSimpleConfig(basePath)).toThrow('Invalid basePath');
    });
  });
});

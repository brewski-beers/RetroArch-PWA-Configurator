/**
 * Tests for Normalizer Phase
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 * Covering error paths for POL-002 (Test Coverage)
 */

import { describe, it, expect } from 'vitest';

import { Normalizer } from '../src/pipeline/normalizer.js';
import type { ROMFile } from '../src/interfaces/pipeline.interface.js';

import { PlatformConfigFactory } from './factories/pipeline.factory.js';

const baseRom: ROMFile = {
  id: 'rom-normalizer-1',
  path: '/tmp/test.nes',
  filename: 'test.nes',
  extension: '.nes',
  size: 100,
  platform: 'nes',
};

describe('Normalizer', () => {
  const config = PlatformConfigFactory.create();

  describe('applyNamingPattern', () => {
    it('should apply naming pattern and retain rom', async () => {
      const normalizer = new Normalizer(config);

      const result = await normalizer.applyNamingPattern(baseRom);

      expect(result.success).toBe(true);
      expect(result.data?.filename).toBe('test.nes');
      expect(result.metadata?.['originalName']).toBe('test.nes');
      expect(result.metadata?.['normalizedAt']).toBeDefined();
    });

    it('should handle null ROM input gracefully', async () => {
      const normalizer = new Normalizer(config);

      // Act - Pass null as ROM (defensive programming test)
      const result = await normalizer.applyNamingPattern(
        null as unknown as ROMFile
      );

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle ROM with missing required fields', async () => {
      const normalizer = new Normalizer(config);
      const invalidRom = {
        id: 'invalid-rom',
        path: '/tmp/test.nes',
        // Missing: filename, extension, size, platform
      } as ROMFile;

      // Act
      const result = await normalizer.applyNamingPattern(invalidRom);

      // Assert - Should fail gracefully or handle missing fields
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle ROM with empty filename', async () => {
      const normalizer = new Normalizer(config);
      const romWithEmptyFilename = {
        ...baseRom,
        filename: '',
      };

      // Act
      const result = await normalizer.applyNamingPattern(romWithEmptyFilename);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('filename');
    });
  });

  describe('convertToCHD', () => {
    it('should return disabled CHD conversion when disabled', async () => {
      const disabledConfig = PlatformConfigFactory.create({
        pipeline: {
          ...config.pipeline,
          enableCHDConversion: false,
        },
      });
      const normalizer = new Normalizer(disabledConfig);

      const result = await normalizer.convertToCHD(baseRom);

      expect(result.success).toBe(true);
      expect(result.data).toBe(baseRom);
      expect(result.metadata?.['reason']).toBe('CHD conversion disabled');
    });

    it('should respond not implemented when CHD conversion enabled', async () => {
      const enabledConfig = PlatformConfigFactory.create({
        pipeline: {
          ...config.pipeline,
          enableCHDConversion: true,
        },
      });
      const normalizer = new Normalizer(enabledConfig);

      const result = await normalizer.convertToCHD(baseRom);

      expect(result.success).toBe(true);
      expect(result.data).toBe(baseRom);
      expect(result.metadata?.['reason']).toBe('Not yet implemented');
    });

    it('should handle null ROM input gracefully', async () => {
      const normalizer = new Normalizer(config);

      // Act - Pass null as ROM
      const result = await normalizer.convertToCHD(null as unknown as ROMFile);

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle ROM with undefined platform', async () => {
      const normalizer = new Normalizer(config);
      const romWithoutPlatform = {
        ...baseRom,
        platform: undefined,
      } as unknown as ROMFile;

      // Act
      const result = await normalizer.convertToCHD(romWithoutPlatform);

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateMetadata', () => {
    it('should generate metadata with basic fields', async () => {
      const normalizer = new Normalizer(config);

      const result = await normalizer.generateMetadata(baseRom);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        platform: 'nes',
        filename: 'test.nes',
        size: 100,
        extension: '.nes',
      });
      expect(result.data?.['generatedAt']).toBeDefined();
    });

    it('should handle null ROM input gracefully', async () => {
      const normalizer = new Normalizer(config);

      // Act - Pass null as ROM
      const result = await normalizer.generateMetadata(
        null as unknown as ROMFile
      );

      // Assert - Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle ROM with missing required fields', async () => {
      const normalizer = new Normalizer(config);
      const incompleteRom = {
        id: 'incomplete-rom',
        path: '/tmp/test.nes',
        // Missing: filename, size, platform, extension
      } as ROMFile;

      // Act
      const result = await normalizer.generateMetadata(incompleteRom);

      // Assert - Should handle missing fields appropriately
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle ROM with invalid size (negative)', async () => {
      const normalizer = new Normalizer(config);
      const romWithInvalidSize = {
        ...baseRom,
        size: -100,
      };

      // Act
      const result = await normalizer.generateMetadata(romWithInvalidSize);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should handle ROM with missing extension', async () => {
      const normalizer = new Normalizer(config);
      const romWithoutExtension = {
        ...baseRom,
        extension: '',
      };

      // Act
      const result = await normalizer.generateMetadata(romWithoutExtension);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('extension');
    });
  });
});

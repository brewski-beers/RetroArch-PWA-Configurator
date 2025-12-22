/**
 * Tests for Configuration Templates
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 */

import { describe, it, expect } from 'vitest';
import {
  coLocatedTemplate,
  distributedTemplate,
  minimalTemplate,
  getTemplate,
  getRecommendedTemplate,
} from '../src/config/config-templates.js';

describe('ConfigTemplates', () => {
  // Use obfuscated example paths (not real user paths)
  const EXAMPLE_BASE_PATH = '/home/user/RetroArch';

  describe('coLocatedTemplate', () => {
    it('should generate co-located configuration', () => {
      // Arrange & Act
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      expect(config.version).toBe('1.0.0');
      expect(config.colocate).toBe(true);
      expect(config.basePath).toBe(EXAMPLE_BASE_PATH);
      expect(config.archive.root.path).toBe(`${EXAMPLE_BASE_PATH}/Archive`);
      expect(config.sync.root.path).toBe(`${EXAMPLE_BASE_PATH}/Sync`);
      expect(config.workspace.processing.path).toBe(
        `${EXAMPLE_BASE_PATH}/Workspace/Processing`
      );
    });

    it('should mark template as recommended', () => {
      // Assert
      expect(coLocatedTemplate.recommended).toBe(true);
      expect(coLocatedTemplate.id).toBe('colocated');
    });

    it('should have all required archive directories', () => {
      // Arrange & Act
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      expect(config.archive.root.required).toBe(true);
      expect(config.archive.roms.required).toBe(true);
      expect(config.archive.manifests.required).toBe(true);
    });

    it('should have optional BIOS and metadata directories', () => {
      // Arrange & Act
      const config = coLocatedTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      expect(config.archive.bios.required).toBe(false);
      expect(config.archive.metadata.required).toBe(false);
    });
  });

  describe('distributedTemplate', () => {
    it('should generate distributed configuration', () => {
      // Arrange & Act
      const config = distributedTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      expect(config.version).toBe('1.0.0');
      expect(config.colocate).toBe(false);
      expect(config.archive.root.path).toContain('RetroArch-Archive');
      expect(config.sync.root.path).toContain('/mnt/'); // Network path
    });

    it('should not be marked as recommended', () => {
      // Assert
      expect(distributedTemplate.recommended).toBe(false);
      expect(distributedTemplate.id).toBe('distributed');
    });

    it('should use different paths for archive and sync', () => {
      // Arrange & Act
      const config = distributedTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      const archiveRoot = config.archive.root.path;
      const syncRoot = config.sync.root.path;
      expect(archiveRoot).not.toBe(syncRoot);
      expect(syncRoot).not.toContain(archiveRoot);
    });
  });

  describe('minimalTemplate', () => {
    it('should generate minimal configuration', () => {
      // Arrange & Act
      const config = minimalTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      expect(config.version).toBe('1.0.0');
      expect(config.colocate).toBe(true);
      expect(config.basePath).toBe(EXAMPLE_BASE_PATH);
    });

    it('should not be marked as recommended', () => {
      // Assert
      expect(minimalTemplate.recommended).toBe(false);
      expect(minimalTemplate.id).toBe('minimal');
    });

    it('should have all required directories', () => {
      // Arrange & Act
      const config = minimalTemplate.generate(EXAMPLE_BASE_PATH);

      // Assert
      expect(config.archive.root.required).toBe(true);
      expect(config.sync.root.required).toBe(true);
      expect(config.workspace.processing.required).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should return correct template by id', () => {
      // Act
      const colocated = getTemplate('colocated');
      const distributed = getTemplate('distributed');
      const minimal = getTemplate('minimal');

      // Assert
      expect(colocated).toBe(coLocatedTemplate);
      expect(distributed).toBe(distributedTemplate);
      expect(minimal).toBe(minimalTemplate);
    });

    it('should return undefined for invalid id', () => {
      // Act
      const result = getTemplate('nonexistent');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getRecommendedTemplate', () => {
    it('should return co-located template', () => {
      // Act
      const recommended = getRecommendedTemplate();

      // Assert
      expect(recommended).toBe(coLocatedTemplate);
      expect(recommended.recommended).toBe(true);
    });
  });
});

/**
 * Batch Validator Tests
 * Following POL-009 (TDD) - Test first, implement second
 * Following TEST-002 (Single Responsibility per test)
 * Following TEST-004 (Arrange-Act-Assert pattern)
 */

import { describe, it, expect } from 'vitest';
import { validateBatch } from '../../src/ingestion/batch-validator.js';

// Inline config for testing (POL-022)
// TODO: Fix vitest config import issue and use: import { batchUploadConfig } from '../../config/policy.config.js';
const batchUploadConfig = {
  maxBatchSize: 100,
  maxFileSize: 50 * 1024 * 1024, // 50MB per file
  processingStrategy: 'serial' as const,
  errorHandling: 'continueOnError' as const,
  allowedExtensions: [
    '.zip',
    '.nes',
    '.snes',
    '.sfc',
    '.gba',
    '.gb',
    '.gbc',
    '.n64',
    '.md',
    '.gen',
    '.sms',
    '.gg',
    '.pce',
  ],
  rateLimitPerMinute: 10,
};

describe('Batch Validator (POL-022)', () => {
  describe('batch size validation', () => {
    it('should reject batch exceeding maxBatchSize', () => {
      // Arrange
      const files = Array(101)
        .fill(null)
        .map((_, i) => ({
          name: `game${i}.nes`,
          size: 1024,
        }));

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds max batch size');
      expect(result.error).toContain('100');
    });

    it('should accept batch at maxBatchSize limit', () => {
      // Arrange
      const files = Array(100)
        .fill(null)
        .map((_, i) => ({
          name: `game${i}.nes`,
          size: 1024,
        }));

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept empty batch', () => {
      // Arrange
      const files: Array<{ name: string; size: number }> = [];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('file size validation', () => {
    it('should reject file exceeding maxFileSize', () => {
      // Arrange
      const files = [
        {
          name: 'large.nes',
          size: 51 * 1024 * 1024, // 51MB
        },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds max file size');
      expect(result.error).toContain('large.nes');
    });

    it('should accept file at maxFileSize limit', () => {
      // Arrange
      const files = [
        {
          name: 'limit.nes',
          size: 50 * 1024 * 1024, // Exactly 50MB
        },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should reject when multiple files and one exceeds size', () => {
      // Arrange
      const files = [
        { name: 'ok1.nes', size: 1024 },
        { name: 'ok2.nes', size: 2048 },
        { name: 'toolarge.nes', size: 51 * 1024 * 1024 },
        { name: 'ok3.nes', size: 512 },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('toolarge.nes');
    });
  });

  describe('file extension validation', () => {
    it('should reject disallowed extension', () => {
      // Arrange
      const files = [
        {
          name: 'malicious.exe',
          size: 1024,
        },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid file extension');
      expect(result.error).toContain('malicious.exe');
    });

    it('should accept all allowed ROM extensions', () => {
      // Arrange
      const allowedExtensions = [
        '.nes',
        '.snes',
        '.sfc',
        '.gba',
        '.gb',
        '.gbc',
        '.n64',
        '.md',
        '.gen',
        '.sms',
        '.gg',
        '.pce',
        '.zip',
      ];

      for (const ext of allowedExtensions) {
        const files = [{ name: `game${ext}`, size: 1024 }];

        // Act
        const result = validateBatch(files, batchUploadConfig);

        // Assert
        expect(result.valid).toBe(true);
      }
    });

    it('should be case-insensitive for extensions', () => {
      // Arrange
      const files = [
        { name: 'GAME.NES', size: 1024 },
        { name: 'game.Nes', size: 2048 },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should reject when batch contains mix of valid and invalid extensions', () => {
      // Arrange
      const files = [
        { name: 'valid.nes', size: 1024 },
        { name: 'invalid.txt', size: 512 },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid.txt');
    });
  });

  describe('comprehensive validation', () => {
    it('should validate all rules together for valid batch', () => {
      // Arrange
      const files = [
        { name: 'game1.nes', size: 1024 * 1024 },
        { name: 'game2.snes', size: 2 * 1024 * 1024 },
        { name: 'game3.gba', size: 10 * 1024 * 1024 },
        { name: 'roms.zip', size: 30 * 1024 * 1024 },
      ];

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail fast on first validation error', () => {
      // Arrange - batch size violation (should be caught first)
      const files = Array(101)
        .fill(null)
        .map(() => ({
          name: 'bad.exe', // Also has invalid extension
          size: 100 * 1024 * 1024, // Also too large
        }));

      // Act
      const result = validateBatch(files, batchUploadConfig);

      // Assert
      expect(result.valid).toBe(false);
      // Should fail on batch size first
      expect(result.error).toContain('batch size');
    });
  });
});

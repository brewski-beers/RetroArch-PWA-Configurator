/**
 * Batch Validator
 * Validates batch ROM upload requests per POL-022
 * Following SRP - single responsibility: batch validation
 */

import type { BatchUploadConfig } from '../../config/policy.config.js';

/**
 * File input structure for validation
 */
export interface FileInput {
  name: string;
  size: number;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a batch of files against POL-022 batch upload policy
 * @param files - Array of file objects to validate
 * @param policy - Batch upload configuration policy
 * @returns Validation result with success flag and optional error message
 */
export function validateBatch(
  files: FileInput[],
  policy: BatchUploadConfig
): ValidationResult {
  // Validate batch size
  if (files.length > policy.maxBatchSize) {
    return {
      valid: false,
      error: `Batch size ${files.length} exceeds max batch size of ${policy.maxBatchSize}`,
    };
  }

  // Validate each file
  for (const file of files) {
    // Validate file size
    if (file.size > policy.maxFileSize) {
      return {
        valid: false,
        error: `File ${file.name} exceeds max file size of ${policy.maxFileSize} bytes`,
      };
    }

    // Validate file extension
    const lastDot = file.name.lastIndexOf('.');
    const ext = lastDot >= 0 ? file.name.substring(lastDot).toLowerCase() : '';

    if (!policy.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File ${file.name} has invalid file extension. Allowed: ${policy.allowedExtensions.join(', ')}`,
      };
    }
  }

  // All validations passed
  return { valid: true };
}

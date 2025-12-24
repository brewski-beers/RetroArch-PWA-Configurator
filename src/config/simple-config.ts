/**
 * Simplified Configuration for Batch Processing
 * Zero-config approach with RetroArch-native structure
 *
 * Policy: POL-018 (YAGNI) - Minimal configuration, no unnecessary complexity
 * Policy: POL-019 (KISS) - Single base path, auto-generated subdirectories
 */

import { join } from 'node:path';

import type {
  SimpleConfig,
  RetroArchPaths,
} from '../interfaces/user-config.interface.js';

/**
 * Generate RetroArch-native paths from base path
 */
export function generateRetroArchPaths(basePath: string): RetroArchPaths {
  return {
    retroarch: basePath,
    downloads: join(basePath, 'downloads'),
    playlists: join(basePath, 'playlists'),
    system: join(basePath, 'system'),
    saves: join(basePath, 'saves'),
    states: join(basePath, 'states'),
    thumbnails: join(basePath, 'thumbnails'),
    archive: join(basePath, '.archive'),
    manifests: join(basePath, '.archive', 'manifests'),
  };
}

/**
 * Validate simple configuration
 */
export function validateSimpleConfig(config: SimpleConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.version || typeof config.version !== 'string') {
    return { valid: false, error: 'version is required and must be a string' };
  }

  if (!config.basePath || typeof config.basePath !== 'string') {
    return { valid: false, error: 'basePath is required and must be a string' };
  }

  if (config.basePath.trim() === '') {
    return { valid: false, error: 'basePath cannot be empty' };
  }

  return { valid: true };
}

/**
 * Create a simple configuration
 */
export function createSimpleConfig(basePath: string): SimpleConfig {
  if (!basePath || typeof basePath !== 'string' || basePath.trim() === '') {
    throw new Error('Invalid basePath: must be a non-empty string');
  }

  return {
    version: '1.0.0',
    basePath: basePath.trim(),
  };
}

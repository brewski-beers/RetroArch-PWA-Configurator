/**
 * Configuration Validator
 * Validates UserConfig for correctness (POL-003: SRP)
 * Checks for path conflicts, required fields, and consistency
 */

import type {
  UserConfig,
  DirectoryPath,
} from '../interfaces/user-config.interface.js';
import { isAbsolute, normalize } from 'path';

/**
 * Validation result with detailed errors and warnings
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates user configuration for correctness
 * Following SRP: Only validates configuration, doesn't modify it
 */
export class ConfigValidator {
  /**
   * Validates a UserConfig object
   * @param config - Configuration to validate
   * @returns Validation result with errors and warnings
   */
  validate(config: UserConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    this.validateRequiredFields(config, errors);

    // Validate paths
    this.validatePaths(config, errors, warnings);

    // Validate co-location consistency
    this.validateCoLocationConsistency(config, errors);

    // Check for path conflicts
    this.checkPathConflicts(config, errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates required fields in configuration
   */
  private validateRequiredFields(config: UserConfig, errors: string[]): void {
    if (!config.version || config.version.trim() === '') {
      errors.push('Configuration version is required');
    }

    if (!config.name || config.name.trim() === '') {
      errors.push('Configuration name is required');
    }
  }

  /**
   * Validates all directory paths in configuration
   */
  private validatePaths(
    config: UserConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate archive paths
    this.validateDirectoryGroup(config.archive, 'Archive', errors, warnings);

    // Validate sync paths
    this.validateDirectoryGroup(config.sync, 'Sync', errors, warnings);

    // Validate workspace paths
    this.validateDirectoryGroup(
      config.workspace,
      'Workspace',
      errors,
      warnings
    );
  }

  /**
   * Validates a group of directory paths (archive, sync, workspace)
   */
  private validateDirectoryGroup(
    group: Record<string, DirectoryPath>,
    groupName: string,
    errors: string[],
    warnings: string[]
  ): void {
    for (const [key, dirPath] of Object.entries(group)) {
      // Check required paths
      if (dirPath.required && (!dirPath.path || dirPath.path.trim() === '')) {
        errors.push(`${groupName}.${key}: Path is required`);
        continue;
      }

      // Skip validation for empty optional paths
      if (!dirPath.path || dirPath.path.trim() === '') {
        continue;
      }

      // Warn for relative paths
      if (!isAbsolute(dirPath.path)) {
        warnings.push(
          `${groupName}.${key}: Path "${dirPath.path}" is not absolute. Consider using an absolute path for better reliability.`
        );
      }
    }
  }

  /**
   * Validates co-location consistency
   */
  private validateCoLocationConsistency(
    config: UserConfig,
    errors: string[]
  ): void {
    if (
      config.colocate === true &&
      (config.basePath === undefined || config.basePath === '')
    ) {
      errors.push('Base path is required when co-locating directories');
    }
  }

  /**
   * Checks for path conflicts (one path inside another)
   */
  private checkPathConflicts(config: UserConfig, errors: string[]): void {
    // Collect all paths from all directory groups
    const allPaths: Array<{ path: string; label: string }> = [];

    // Collect archive paths
    for (const [key, dirPath] of Object.entries(config.archive)) {
      if (dirPath.path && dirPath.path.trim() !== '') {
        allPaths.push({
          path: normalize(dirPath.path),
          label: `archive.${key}`,
        });
      }
    }

    // Collect sync paths
    for (const [key, dirPath] of Object.entries(config.sync)) {
      if (dirPath.path && dirPath.path.trim() !== '') {
        allPaths.push({
          path: normalize(dirPath.path),
          label: `sync.${key}`,
        });
      }
    }

    // Collect workspace paths
    for (const [key, dirPath] of Object.entries(config.workspace)) {
      if (dirPath.path && dirPath.path.trim() !== '') {
        allPaths.push({
          path: normalize(dirPath.path),
          label: `workspace.${key}`,
        });
      }
    }

    // Check for conflicts (one path inside another at different hierarchy levels)
    for (let i = 0; i < allPaths.length; i++) {
      for (let j = i + 1; j < allPaths.length; j++) {
        const path1 = allPaths[i];
        const path2 = allPaths[j];

        if (!path1 || !path2) {
          continue;
        }

        // Skip if paths are in parent-child relationship within same group
        // (e.g., archive.root and archive.roms are expected)
        const sameGroup =
          path1.label.split('.')[0] === path2.label.split('.')[0];
        if (sameGroup) {
          continue;
        }

        // Check if one path is a prefix of another (conflict)
        const normalized1 = path1.path.endsWith('/')
          ? path1.path
          : path1.path + '/';
        const normalized2 = path2.path.endsWith('/')
          ? path2.path
          : path2.path + '/';

        if (normalized2.startsWith(normalized1)) {
          errors.push(
            `Path conflict: ${path2.label} ("${path2.path}") is inside ${path1.label} ("${path1.path}")`
          );
        } else if (normalized1.startsWith(normalized2)) {
          errors.push(
            `Path conflict: ${path1.label} ("${path1.path}") is inside ${path2.label} ("${path2.path}")`
          );
        }
      }
    }
  }
}

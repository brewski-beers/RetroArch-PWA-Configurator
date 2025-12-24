/**
 * Configuration Loader
 * Loads and saves user configuration (POL-003: SRP)
 * Handles missing files gracefully with defaults
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

import type { UserConfig } from '../interfaces/user-config.interface.js';

import { ConfigValidator } from './config-validator.js';
import { getRecommendedTemplate } from './config-templates.js';
const JSON_INDENT = 2;

/**
 * Result of loading configuration
 */
export interface LoadResult {
  success: boolean;
  config?: UserConfig;
  error?: string;
  validationErrors?: string[];
  isDefault?: boolean;
}

/**
 * Result of saving configuration
 */
export interface SaveResult {
  success: boolean;
  error?: string;
  validationErrors?: string[];
}

/**
 * Loads and saves user configuration
 * Following SRP: Only handles config persistence, not validation logic
 */
export class ConfigLoader {
  private readonly configPath: string;
  private readonly validator: ConfigValidator;

  constructor(configPath: string = 'user-config.json') {
    this.configPath = configPath;
    this.validator = new ConfigValidator();
  }

  /**
   * Loads configuration from file
   * Returns default config if file doesn't exist
   */
  async load(): Promise<LoadResult> {
    try {
      // Try to read config file
      const content = await readFile(this.configPath, 'utf-8');

      // Parse JSON
      let configRaw: unknown;
      try {
        configRaw = JSON.parse(content);
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON in config file: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        };
      }

      // Defensive: Check if parsed config is null or not an object
      if (configRaw === null || typeof configRaw !== 'object') {
        return {
          success: false,
          error: 'Invalid configuration: config must be an object',
        };
      }

      const config = configRaw as UserConfig;

      // Validate config
      const validation = this.validator.validate(config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Configuration validation failed: ${validation.errors.join(', ')}`,
          validationErrors: validation.errors,
        };
      }

      return {
        success: true,
        config,
        isDefault: false,
      };
    } catch (error) {
      // File doesn't exist or can't be read - return default
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return {
          success: true,
          config: this.getDefaultConfig(),
          isDefault: true,
        };
      }

      // Other errors
      return {
        success: false,
        error: `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Saves configuration to file
   * Validates before saving
   */
  async save(config: UserConfig): Promise<SaveResult> {
    // Defensive: Validate input
    if (config === null || config === undefined || typeof config !== 'object') {
      return {
        success: false,
        error: 'Invalid input: config must be a valid object',
      };
    }

    // Validate config before saving
    const validation = this.validator.validate(config);
    if (!validation.valid) {
      return {
        success: false,
        error: `Configuration validation failed: ${validation.errors.join(', ')}`,
        validationErrors: validation.errors,
      };
    }

    try {
      // Ensure directory exists
      const dir = dirname(this.configPath);
      await mkdir(dir, { recursive: true });

      // Write config to file
      const content = JSON.stringify(config, null, JSON_INDENT);
      await writeFile(this.configPath, content, 'utf-8');

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Gets default configuration (recommended template)
   */
  getDefaultConfig(): UserConfig {
    const template = getRecommendedTemplate();
    const defaultBasePath = process.cwd();
    const config = template.generate(defaultBasePath);

    // Customize name to indicate it's default
    config.name = 'Default Configuration (Co-Located)';

    return config;
  }
}

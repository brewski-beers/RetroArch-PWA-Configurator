/**
 * Plugin System Interfaces
 * Defines the plugin architecture for extensibility
 * Following OCP (Open/Closed Principle) - open for extension, closed for modification
 */

import type {
  IClassifier,
  IValidator,
  INormalizer,
  IArchiver,
  IPromoter,
} from './pipeline.interface.js';

/**
 * Plugin types that can be extended
 */
export type PluginType =
  | 'classifier'
  | 'validator'
  | 'normalizer'
  | 'archiver'
  | 'promoter'
  | 'playlist-generator'
  | 'thumbnail-provider'
  | 'storage-backend'
  | 'metadata-scraper'
  | 'chd-converter';

/**
 * Plugin lifecycle states
 */
export type PluginLifecycle = 'init' | 'execute' | 'cleanup';

/**
 * Plugin manifest structure
 */
export interface IPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  apiVersion: string;
  isPremium: boolean;
  requiresLicense?: boolean;
  dependencies?: string[];
  entryPoint: string;
}

/**
 * Plugin license information
 */
export interface PluginLicense {
  key: string;
  type: 'subscription' | 'perpetual';
  expiresAt?: string;
  features?: string[];
}

/**
 * Base plugin interface
 * All plugins must implement this interface (LSP - Liskov Substitution)
 */
export interface IPlugin {
  /**
   * Plugin manifest
   */
  readonly manifest: IPluginManifest;

  /**
   * Initialize plugin
   */
  init(): Promise<void>;

  /**
   * Execute plugin functionality
   */
  execute(...args: unknown[]): Promise<unknown>;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;

  /**
   * Validate plugin state
   */
  validate(): Promise<boolean>;
}

/**
 * Classifier plugin interface
 */
export interface IClassifierPlugin extends IPlugin, IClassifier {
  readonly manifest: IPluginManifest & { type: 'classifier' };
}

/**
 * Validator plugin interface
 */
export interface IValidatorPlugin extends IPlugin, IValidator {
  readonly manifest: IPluginManifest & { type: 'validator' };
}

/**
 * Normalizer plugin interface
 */
export interface INormalizerPlugin extends IPlugin, INormalizer {
  readonly manifest: IPluginManifest & { type: 'normalizer' };
}

/**
 * Archiver plugin interface
 */
export interface IArchiverPlugin extends IPlugin, IArchiver {
  readonly manifest: IPluginManifest & { type: 'archiver' };
}

/**
 * Promoter plugin interface
 */
export interface IPromoterPlugin extends IPlugin, IPromoter {
  readonly manifest: IPluginManifest & { type: 'promoter' };
}

/**
 * Plugin registry interface
 * Manages plugin lifecycle and validation
 */
export interface IPluginRegistry {
  /**
   * Register a plugin
   */
  register(plugin: IPlugin): Promise<void>;

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): Promise<void>;

  /**
   * Get plugin by ID
   */
  get(pluginId: string): IPlugin | undefined;

  /**
   * Get all plugins of a specific type
   */
  getByType(type: PluginType): IPlugin[];

  /**
   * Validate all registered plugins
   */
  validateAll(): Promise<boolean>;

  /**
   * Check plugin API compatibility
   */
  checkCompatibility(plugin: IPlugin): boolean;
}

/**
 * Plugin loader interface
 * Loads plugins from various sources
 */
export interface IPluginLoader {
  /**
   * Load plugin from local path
   */
  loadLocal(path: string): Promise<IPlugin>;

  /**
   * Load plugin from NPM package
   */
  loadNPM(packageName: string): Promise<IPlugin>;

  /**
   * Load plugin from remote URL
   */
  loadRemote(url: string): Promise<IPlugin>;

  /**
   * Load plugin from marketplace
   */
  loadMarketplace(pluginId: string, license?: PluginLicense): Promise<IPlugin>;

  /**
   * Validate plugin manifest
   */
  validateManifest(manifest: IPluginManifest): boolean;
}

/**
 * Plugin sandbox interface
 * Isolates plugin execution for security
 */
export interface IPluginSandbox {
  /**
   * Execute plugin in sandbox
   */
  execute(plugin: IPlugin, ...args: unknown[]): Promise<unknown>;

  /**
   * Terminate plugin execution
   */
  terminate(pluginId: string): Promise<void>;

  /**
   * Get sandbox status
   */
  getStatus(pluginId: string): 'running' | 'idle' | 'terminated';
}

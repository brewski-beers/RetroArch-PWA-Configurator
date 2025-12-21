/**
 * Platform Configuration Interfaces
 * Defines the configuration schema for the RetroArch platform
 * Following config-as-infrastructure and policy-as-code principles
 */

/**
 * Directory structure configuration
 * Defines all directory paths used by the system
 */
export interface DirectoryStructure {
  archive: {
    root: string;
    bios: string;
    manifests: string;
    roms: string;
  };
  sync: {
    root: string;
    content: {
      roms: string;
      bios: string;
      saves: string;
      states: string;
    };
    playlists: string;
    config: string;
  };
  thumbnails: {
    root: string;
  };
  workspace: {
    root: string;
    staging: string;
    validation: string;
    rejected: string;
    tools: string;
  };
}

/**
 * Pipeline phase configuration
 */
export interface PipelineConfig {
  enableClassifier: boolean;
  enableValidator: boolean;
  enableNormalizer: boolean;
  enableArchiver: boolean;
  enablePromoter: boolean;
  enableCHDConversion: boolean;
  enableThumbnails: boolean;
  enableMetadata: boolean;
}

/**
 * Platform-specific configuration
 */
export interface PlatformDefinition {
  id: string;
  name: string;
  extensions: string[];
  requiresBIOS: boolean;
  biosFiles?: string[];
  supportedCompanionFiles?: string[];
}

/**
 * Main platform configuration
 */
export interface PlatformConfig {
  version: string;
  directories: DirectoryStructure;
  pipeline: PipelineConfig;
  platforms: PlatformDefinition[];
  plugins: {
    enabled: boolean;
    localPath?: string;
    npmPackages?: string[];
    remoteUrls?: string[];
    marketplaceUrl?: string;
  };
}

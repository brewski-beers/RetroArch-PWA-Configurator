/**
 * User Configuration Interface
 * Defines customizable paths for RetroArch pipeline
 *
 * Policy: POL-003 (SOLID - ISP: Interface Segregation)
 * Each interface has a focused responsibility
 */

export interface DirectoryPath {
  /** Absolute or relative path */
  path: string;
  /** Human-readable description */
  description: string;
  /** Whether this directory is required */
  required: boolean;
}

export interface ArchiveDirectories {
  /** Root archive directory (stores original ROMs with manifests) */
  root: DirectoryPath;
  /** ROM storage (organized by platform) */
  roms: DirectoryPath;
  /** JSON manifests (one per platform) */
  manifests: DirectoryPath;
  /** BIOS files (system files) */
  bios: DirectoryPath;
  /** Metadata cache (game info, artwork URLs) */
  metadata: DirectoryPath;
  /** Allow indexed access for validation */
  [key: string]: DirectoryPath;
}

export interface SyncDirectories {
  /** Root sync directory (RetroArch-compatible structure) */
  root: DirectoryPath;
  /** Content directory (ROMs for RetroArch) */
  content: DirectoryPath;
  /** Playlists directory (.lpl files) */
  playlists: DirectoryPath;
  /** Thumbnails directory (boxart, screenshots, titles) */
  thumbnails: DirectoryPath;
  /** Save states directory (optional) */
  saveStates: DirectoryPath;
  /** Allow indexed access for validation */
  [key: string]: DirectoryPath;
}

export interface WorkspaceDirectories {
  /** Temporary processing directory */
  processing: DirectoryPath;
  /** Logs directory */
  logs: DirectoryPath;
  /** Backup directory */
  backups: DirectoryPath;
  /** Allow indexed access for validation */
  [key: string]: DirectoryPath;
}

export interface UserConfig {
  /** Configuration version (for migrations) */
  version: string;
  /** User-friendly name for this configuration */
  name: string;
  /** Archive directories (source of truth) */
  archive: ArchiveDirectories;
  /** Sync directories (RetroArch-ready) */
  sync: SyncDirectories;
  /** Workspace directories (temporary/operational) */
  workspace: WorkspaceDirectories;
  /** Whether to co-locate archive and sync (recommended) */
  colocate: boolean;
  /** Base path when co-locating (e.g., /home/user/RetroArch) */
  basePath?: string;
}

export interface ConfigTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Whether this is the recommended template */
  recommended: boolean;
  /** Generate config from this template */
  generate: (basePath: string) => UserConfig;
}

/**
 * Simplified Configuration for Batch Processing
 * Zero-config approach with single base path
 * Follows RetroArch-native directory structure
 */
export interface SimpleConfig {
  /** Configuration version (for migrations) */
  version: string;
  /** Base path for RetroArch (e.g., /home/user/RetroArch) */
  basePath: string;
}

/**
 * Auto-generated RetroArch paths from SimpleConfig
 */
export interface RetroArchPaths {
  /** Base RetroArch directory */
  retroarch: string;
  /** Downloads directory (ROMs organized by platform name) */
  downloads: string;
  /** Playlists directory (.lpl files) */
  playlists: string;
  /** System directory (BIOS files) */
  system: string;
  /** Saves directory (save files) */
  saves: string;
  /** States directory (save states) */
  states: string;
  /** Thumbnails directory (artwork) */
  thumbnails: string;
  /** Hidden archive directory (tracking with hard links) */
  archive: string;
  /** Manifests directory (within archive) */
  manifests: string;
}

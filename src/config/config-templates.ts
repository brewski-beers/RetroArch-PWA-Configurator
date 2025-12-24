/**
 * Configuration Templates
 * Provides pre-defined directory structures
 *
 * Policy: POL-003 (SOLID - OCP: Open/Closed Principle)
 * New templates can be added without modifying existing code
 */

import type {
  UserConfig,
  ConfigTemplate,
  DirectoryPath,
} from '../interfaces/user-config.interface.js';

/**
 * Helper to create directory path configuration
 */
function createPath(
  path: string,
  description: string,
  required = true
): DirectoryPath {
  return { path, description, required };
}

/**
 * Validates base path input
 */
function validateBasePath(basePath: string): void {
  if (!basePath || typeof basePath !== 'string' || basePath.trim() === '') {
    throw new Error('Invalid input: basePath must be a non-empty string');
  }
}

/**
 * Co-Located Template (RECOMMENDED)
 *
 * All directories under single base path for clarity:
 * /home/user/RetroArch/
 *   ├── Archive/          (source of truth)
 *   ├── Sync/             (RetroArch-ready)
 *   └── Workspace/        (temporary)
 */
export const coLocatedTemplate: ConfigTemplate = {
  id: 'colocated',
  name: 'Co-Located (Recommended)',
  description:
    'All directories under single base path for clarity and ease of management',
  recommended: true,
  generate: (basePath: string): UserConfig => {
    validateBasePath(basePath);
    return {
      version: '1.0.0',
      name: 'Co-Located Configuration',
      colocate: true,
      basePath,
      archive: {
        root: createPath(
          `${basePath}/Archive`,
          'Root archive directory (source of truth)'
        ),
        roms: createPath(
          `${basePath}/Archive/ROMs`,
          'ROM storage organized by platform'
        ),
        manifests: createPath(
          `${basePath}/Archive/Manifests`,
          'JSON manifests (one per platform with SHA-256 hashes)'
        ),
        bios: createPath(
          `${basePath}/Archive/BIOS`,
          'System BIOS files',
          false
        ),
        metadata: createPath(
          `${basePath}/Archive/Metadata`,
          'Cached game metadata and artwork URLs',
          false
        ),
      },
      sync: {
        root: createPath(
          `${basePath}/Sync`,
          'RetroArch-compatible directory structure'
        ),
        content: createPath(
          `${basePath}/Sync/content/roms`,
          'ROM files for RetroArch (organized by platform)'
        ),
        playlists: createPath(
          `${basePath}/Sync/playlists`,
          'RetroArch playlist files (.lpl format)'
        ),
        thumbnails: createPath(
          `${basePath}/Sync/thumbnails`,
          'Thumbnail images (boxart, screenshots, title screens)',
          false
        ),
        saveStates: createPath(
          `${basePath}/Sync/states`,
          'Save state files (optional)',
          false
        ),
      },
      workspace: {
        processing: createPath(
          `${basePath}/Workspace/Processing`,
          'Temporary processing directory'
        ),
        logs: createPath(
          `${basePath}/Workspace/Logs`,
          'Pipeline execution logs'
        ),
        backups: createPath(
          `${basePath}/Workspace/Backups`,
          'Configuration and manifest backups',
          false
        ),
      },
    };
  },
};

/**
 * Distributed Template
 *
 * Separate locations for different purposes:
 * - Archive on local drive (fast access)
 * - Sync on network share (accessible to RetroArch clients)
 * - Workspace on system temp
 */
export const distributedTemplate: ConfigTemplate = {
  id: 'distributed',
  name: 'Distributed',
  description:
    'Separate locations for archive, sync, and workspace (advanced users)',
  recommended: false,
  generate: (basePath: string): UserConfig => {
    validateBasePath(basePath);
    return {
      version: '1.0.0',
      name: 'Distributed Configuration',
      colocate: false,
      archive: {
        root: createPath(
          `${basePath}/RetroArch-Archive`,
          'Root archive directory'
        ),
        roms: createPath(`${basePath}/RetroArch-Archive/ROMs`, 'ROM storage'),
        manifests: createPath(
          `${basePath}/RetroArch-Archive/Manifests`,
          'JSON manifests'
        ),
        bios: createPath(
          `${basePath}/RetroArch-Archive/BIOS`,
          'System BIOS files',
          false
        ),
        metadata: createPath(
          `${basePath}/RetroArch-Archive/Metadata`,
          'Cached metadata',
          false
        ),
      },
      sync: {
        root: createPath(
          '/mnt/nas/RetroArch',
          'RetroArch sync directory (e.g., network share)'
        ),
        content: createPath(
          '/mnt/nas/RetroArch/content/roms',
          'ROM files for RetroArch'
        ),
        playlists: createPath(
          '/mnt/nas/RetroArch/playlists',
          'RetroArch playlists'
        ),
        thumbnails: createPath(
          '/mnt/nas/RetroArch/thumbnails',
          'Thumbnail images',
          false
        ),
        saveStates: createPath(
          '/mnt/nas/RetroArch/states',
          'Save states',
          false
        ),
      },
      workspace: {
        processing: createPath(
          '/tmp/retroarch-pipeline/processing',
          'Temporary processing'
        ),
        logs: createPath(`${basePath}/RetroArch-Logs`, 'Pipeline logs'),
        backups: createPath(`${basePath}/RetroArch-Backups`, 'Backups', false),
      },
    };
  },
};

/**
 * Minimal Template
 *
 * Bare minimum structure for testing:
 * - Archive and Sync only
 * - No optional directories
 */
export const minimalTemplate: ConfigTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Bare minimum structure (testing/development only)',
  recommended: false,
  generate: (basePath: string): UserConfig => {
    validateBasePath(basePath);
    return {
      version: '1.0.0',
      name: 'Minimal Configuration',
      colocate: true,
      basePath,
      archive: {
        root: createPath(`${basePath}/Archive`, 'Archive root'),
        roms: createPath(`${basePath}/Archive/ROMs`, 'ROM storage'),
        manifests: createPath(`${basePath}/Archive/Manifests`, 'Manifests'),
        bios: createPath(`${basePath}/Archive/BIOS`, 'BIOS files', false),
        metadata: createPath(`${basePath}/Archive/Metadata`, 'Metadata', false),
      },
      sync: {
        root: createPath(`${basePath}/Sync`, 'Sync root'),
        content: createPath(`${basePath}/Sync/content/roms`, 'ROM files'),
        playlists: createPath(`${basePath}/Sync/playlists`, 'Playlists'),
        thumbnails: createPath(
          `${basePath}/Sync/thumbnails`,
          'Thumbnails',
          false
        ),
        saveStates: createPath(`${basePath}/Sync/states`, 'Save states', false),
      },
      workspace: {
        processing: createPath(`${basePath}/Processing`, 'Processing'),
        logs: createPath(`${basePath}/Logs`, 'Logs'),
        backups: createPath(`${basePath}/Backups`, 'Backups', false),
      },
    };
  },
};

/**
 * All available templates
 */
export const configTemplates: ConfigTemplate[] = [
  coLocatedTemplate,
  distributedTemplate,
  minimalTemplate,
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ConfigTemplate | undefined {
  return configTemplates.find((t) => t.id === id);
}

/**
 * Get recommended template
 */
export function getRecommendedTemplate(): ConfigTemplate {
  return coLocatedTemplate;
}

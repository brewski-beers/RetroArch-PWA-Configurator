/**
 * RetroArch Platform Configuration
 * Defines the runtime configuration for the RetroArch platform
 * Following config-as-infrastructure principles
 */

import type { PlatformConfig } from '../src/interfaces/platform-config.interface.js';

export const platformConfig: PlatformConfig = {
  version: '1.0.0',
  directories: {
    archive: {
      root: 'RetroArch-Archive',
      bios: 'RetroArch-Archive/BIOS',
      manifests: 'RetroArch-Archive/Manifests',
      roms: 'RetroArch-Archive/ROMs',
    },
    sync: {
      root: 'RetroArch-Sync',
      content: {
        roms: 'RetroArch-Sync/content/roms',
        bios: 'RetroArch-Sync/content/bios',
        saves: 'RetroArch-Sync/content/saves',
        states: 'RetroArch-Sync/content/states',
      },
      playlists: 'RetroArch-Sync/playlists',
      config: 'RetroArch-Sync/retroarch.cfg',
    },
    thumbnails: {
      root: 'RetroArch-Thumbnails',
    },
    workspace: {
      root: 'RetroArch-Workspace',
      staging: 'RetroArch-Workspace/Staging',
      validation: 'RetroArch-Workspace/Validation',
      rejected: 'RetroArch-Workspace/Rejected',
      tools: 'RetroArch-Workspace/Tools',
    },
  },
  pipeline: {
    enableClassifier: true,
    enableValidator: true,
    enableNormalizer: true,
    enableArchiver: true,
    enablePromoter: true,
    enableCHDConversion: false,
    enableThumbnails: false,
    enableMetadata: true,
  },
  platforms: [
    {
      id: 'nes',
      name: 'Nintendo Entertainment System',
      extensions: ['.nes'],
      requiresBIOS: false,
    },
    {
      id: 'snes',
      name: 'Super Nintendo Entertainment System',
      extensions: ['.sfc', '.smc'],
      requiresBIOS: false,
    },
    {
      id: 'genesis',
      name: 'Sega Genesis / Mega Drive',
      extensions: ['.md', '.gen', '.bin'],
      requiresBIOS: false,
    },
    {
      id: 'psx',
      name: 'Sony PlayStation',
      extensions: ['.cue', '.bin', '.chd'],
      requiresBIOS: true,
      biosFiles: ['scph5500.bin', 'scph5501.bin', 'scph5502.bin'],
      supportedCompanionFiles: ['.cue'],
    },
    {
      id: 'n64',
      name: 'Nintendo 64',
      extensions: ['.n64', '.z64', '.v64'],
      requiresBIOS: false,
    },
    {
      id: 'gba',
      name: 'Game Boy Advance',
      extensions: ['.gba'],
      requiresBIOS: false,
    },
  ],
  plugins: {
    enabled: false, // Plugins disabled by default for Phase D
  },
};

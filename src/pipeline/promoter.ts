/**
 * Promoter Phase Implementation
 * Phase 5: Promotes ROMs to RetroArch runtime
 * Following SRP - single responsibility: promotion
 */

import type {
  IPromoter,
  PhaseResult,
  ROMFile,
  PlaylistEntry,
} from '../interfaces/pipeline.interface.js';
import type { PlatformConfig } from '../interfaces/platform-config.interface.js';

export class Promoter implements IPromoter {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Moves ROM to RetroArch-Sync directory
   */
  async promoteROM(rom: ROMFile): Promise<PhaseResult<string>> {
    // TODO: Implement in Phase D
    const syncPath = `${this.config.directories.sync.content.roms}/${rom.platform}/${rom.filename}`;

    return Promise.resolve({
      success: true,
      data: syncPath,
      metadata: {
        promotedAt: new Date().toISOString(),
        sourcePath: rom.path,
      },
    });
  }

  /**
   * Updates RetroArch playlists
   */
  async updatePlaylist(rom: ROMFile): Promise<PhaseResult<PlaylistEntry>> {
    // TODO: Implement in Phase D
    const playlistEntry: PlaylistEntry = {
      path: `${this.config.directories.sync.content.roms}/${rom.platform}/${rom.filename}`,
      label: rom.filename.replace(/\.[^.]+$/, ''),
      core_path: 'DETECT',
      core_name: 'DETECT',
      crc32: rom.hash ?? '00000000',
      db_name: rom.platform ?? 'Unknown',
    };

    return Promise.resolve({
      success: true,
      data: playlistEntry,
      metadata: {
        playlistPath: `${this.config.directories.sync.playlists}/${rom.platform}.lpl`,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Syncs thumbnails (optional)
   */
  async syncThumbnails(_rom: ROMFile): Promise<PhaseResult<boolean>> {
    // TODO: Implement in Phase D
    if (!this.config.pipeline.enableThumbnails) {
      return Promise.resolve({
        success: true,
        data: false,
        metadata: {
          synced: false,
          reason: 'Thumbnail sync disabled',
        },
      });
    }

    return Promise.resolve({
      success: true,
      data: false,
      metadata: {
        synced: false,
        reason: 'Not yet implemented',
      },
    });
  }
}

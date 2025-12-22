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
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

export class Promoter implements IPromoter {
  private readonly config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Moves ROM to RetroArch-Sync directory
   */
  async promoteROM(rom: ROMFile): Promise<PhaseResult<string>> {
    try {
      const syncPath = join(
        this.config.directories.sync.content.roms,
        rom.platform ?? 'unknown',
        rom.filename
      );

      // Ensure directory exists
      await mkdir(dirname(syncPath), { recursive: true });

      // Find the source file (check Archive first)
      const archivePath = join(
        this.config.directories.archive.roms,
        rom.platform ?? 'unknown',
        rom.filename
      );

      const sourcePath = existsSync(archivePath) ? archivePath : rom.path;

      // Copy file to sync directory
      await copyFile(sourcePath, syncPath);

      return {
        success: true,
        data: syncPath,
        metadata: {
          promotedAt: new Date().toISOString(),
          sourcePath,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Promotion failed',
      };
    }
  }

  /**
   * Updates RetroArch playlists
   */
  async updatePlaylist(rom: ROMFile): Promise<PhaseResult<PlaylistEntry>> {
    try {
      const playlistPath = join(
        this.config.directories.sync.playlists,
        `${rom.platform}.lpl`
      );

      const syncPath = join(
        this.config.directories.sync.content.roms,
        rom.platform ?? 'unknown',
        rom.filename
      );

      const playlistEntry: PlaylistEntry = {
        path: syncPath,
        label: rom.filename.replace(/\.[^.]+$/, ''),
        core_path: 'DETECT',
        core_name: 'DETECT',
        crc32: rom.hash?.substring(0, 8) ?? '00000000',
        db_name: rom.platform ?? 'Unknown',
      };

      // Ensure playlists directory exists
      await mkdir(this.config.directories.sync.playlists, { recursive: true });

      // Read existing playlist or create new one
      interface PlaylistFile {
        version: string;
        default_core_path: string;
        default_core_name: string;
        label_display_mode: number;
        right_thumbnail_mode: number;
        left_thumbnail_mode: number;
        sort_mode: number;
        items: PlaylistEntry[];
      }

      let playlist: PlaylistFile;

      if (existsSync(playlistPath)) {
        const data = await readFile(playlistPath, 'utf-8');
        playlist = JSON.parse(data) as PlaylistFile;
      } else {
        playlist = {
          version: '1.5',
          default_core_path: '',
          default_core_name: '',
          label_display_mode: 0,
          right_thumbnail_mode: 0,
          left_thumbnail_mode: 0,
          sort_mode: 0,
          items: [],
        };
      }

      // Check if entry already exists
      const existingIndex = playlist.items.findIndex(
        (e) => e.path === playlistEntry.path || e.crc32 === playlistEntry.crc32
      );

      if (existingIndex >= 0) {
        // Update existing entry
        playlist.items[existingIndex] = playlistEntry;
      } else {
        // Add new entry
        playlist.items.push(playlistEntry);
      }

      // Write playlist back
      await writeFile(playlistPath, JSON.stringify(playlist, null, 2), 'utf-8');

      return {
        success: true,
        data: playlistEntry,
        metadata: {
          playlistPath,
          updatedAt: new Date().toISOString(),
          totalEntries: playlist.items.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Playlist update failed',
      };
    }
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

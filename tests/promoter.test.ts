/**
 * Tests for Promoter Phase
 * Covers happy paths and defensive error handling (TEST-007)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Promoter } from '../src/pipeline/promoter.js';
import { PlatformConfigFactory } from './factories/pipeline.factory.js';
import type { ROMFile } from '../src/interfaces/pipeline.interface.js';
import {
  mkdir,
  writeFile,
  rm,
  chmod,
  readFile as fsReadFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Promoter', () => {
  let promoter: Promoter;
  let testDir: string;

  beforeEach(async () => {
    const uniqueId = `promoter-test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;
    testDir = join(tmpdir(), uniqueId);
    await mkdir(testDir, { recursive: true });

    const config = PlatformConfigFactory.create({
      directories: {
        archive: {
          root: join(testDir, 'Archive'),
          bios: join(testDir, 'Archive/BIOS'),
          manifests: join(testDir, 'Archive/Manifests'),
          roms: join(testDir, 'Archive/ROMs'),
        },
        sync: {
          root: join(testDir, 'Sync'),
          content: {
            roms: join(testDir, 'Sync/content/roms'),
            bios: join(testDir, 'Sync/content/bios'),
            saves: join(testDir, 'Sync/content/saves'),
            states: join(testDir, 'Sync/content/states'),
          },
          playlists: join(testDir, 'Sync/playlists'),
          config: join(testDir, 'Sync/retroarch.cfg'),
        },
        thumbnails: {
          root: join(testDir, 'Thumbnails'),
        },
        workspace: {
          root: join(testDir, 'Workspace'),
          staging: join(testDir, 'Workspace/Staging'),
          validation: join(testDir, 'Workspace/Validation'),
          rejected: join(testDir, 'Workspace/Rejected'),
          tools: join(testDir, 'Workspace/Tools'),
        },
      },
    });

    promoter = new Promoter(config);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('promoteROM', () => {
    it('should promote ROM from archive when available', async () => {
      const archivePath = join(testDir, 'Archive/ROMs/nes/demo.nes');
      await mkdir(join(testDir, 'Archive/ROMs/nes'), { recursive: true });
      await writeFile(archivePath, 'from-archive');

      const rom: ROMFile = {
        id: 'rom-1',
        path: join(testDir, 'Source/demo.nes'),
        filename: 'demo.nes',
        extension: '.nes',
        size: 13,
        platform: 'nes',
      };

      const result = await promoter.promoteROM(rom);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Sync/content/roms/nes/demo.nes');
      expect(result.metadata?.['sourcePath']).toBe(archivePath);
      const promotedContent = await fsReadFile(
        join(testDir, 'Sync/content/roms/nes/demo.nes'),
        'utf-8'
      );
      expect(promotedContent).toBe('from-archive');
    });

    it('should promote ROM from rom.path when archive missing', async () => {
      const romPath = join(testDir, 'Workspace/demo.nes');
      await mkdir(join(testDir, 'Workspace'), { recursive: true });
      await writeFile(romPath, 'from-rom-path');

      const rom: ROMFile = {
        id: 'rom-2',
        path: romPath,
        filename: 'demo.nes',
        extension: '.nes',
        size: 13,
        platform: 'nes',
      };

      const result = await promoter.promoteROM(rom);

      expect(result.success).toBe(true);
      expect(result.metadata?.['sourcePath']).toBe(romPath);
      const promotedContent = await fsReadFile(
        join(testDir, 'Sync/content/roms/nes/demo.nes'),
        'utf-8'
      );
      expect(promotedContent).toBe('from-rom-path');
    });

    it('should fail when source ROM is missing', async () => {
      const rom: ROMFile = {
        id: 'rom-3',
        path: join(testDir, 'missing/demo.nes'),
        filename: 'demo.nes',
        extension: '.nes',
        size: 0,
        platform: 'nes',
      };

      const result = await promoter.promoteROM(rom);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('ENOENT');
    });

    it('should handle undefined platform by using unknown folder', async () => {
      const romPath = join(testDir, 'Workspace/unknown.rom');
      await mkdir(join(testDir, 'Workspace'), { recursive: true });
      await writeFile(romPath, 'unknown-platform');

      const rom: ROMFile = {
        id: 'rom-4',
        path: romPath,
        filename: 'unknown.rom',
        extension: '.rom',
        size: 16,
      };

      const result = await promoter.promoteROM(rom);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Sync/content/roms/unknown/unknown.rom');
    });
  });

  describe('updatePlaylist', () => {
    it('should create a new playlist entry', async () => {
      const rom: ROMFile = {
        id: 'rom-5',
        path: join(testDir, 'Workspace/demo.nes'),
        filename: 'demo.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
        hash: '8186648a5c16e8e71970c6b604a7550416c911197624fed4ebc98363521a9249',
      };

      const result = await promoter.updatePlaylist(rom);

      expect(result.success).toBe(true);
      expect(result.metadata?.['playlistPath']).toContain(
        'Sync/playlists/nes.lpl'
      );
      expect(result.metadata?.['totalEntries']).toBe(1);
      expect(result.data?.label).toBe('demo');

      const playlistContent = await fsReadFile(
        join(testDir, 'Sync/playlists/nes.lpl'),
        'utf-8'
      );
      const playlist = JSON.parse(playlistContent) as {
        items: Array<{ path: string; crc32: string }>;
      };
      expect(playlist.items.length).toBe(1);
      const firstItem = playlist.items[0]!;
      expect(firstItem.path).toContain('Sync/content/roms/nes/demo.nes');
      expect(firstItem.crc32).toBe(rom.hash?.substring(0, 8));
    });

    it('should update existing playlist entry by path', async () => {
      const rom: ROMFile = {
        id: 'rom-6',
        path: join(testDir, 'Workspace/game.nes'),
        filename: 'game.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
        hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      };

      await promoter.updatePlaylist(rom);

      const romUpdated: ROMFile = {
        ...rom,
        hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      };
      const result = await promoter.updatePlaylist(romUpdated);

      expect(result.success).toBe(true);
      expect(result.metadata?.['totalEntries']).toBe(1);

      const playlistContent = await fsReadFile(
        join(testDir, 'Sync/playlists/nes.lpl'),
        'utf-8'
      );
      const playlist = JSON.parse(playlistContent) as {
        items: Array<{ crc32: string }>;
      };
      expect(playlist.items.length).toBe(1);
      expect(playlist.items[0]!.crc32).toBe(romUpdated.hash?.substring(0, 8));
    });

    it('should update existing playlist entry by crc match when path differs', async () => {
      const baseHash =
        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

      const rom1: ROMFile = {
        id: 'rom-7',
        path: join(testDir, 'Workspace/game1.nes'),
        filename: 'game1.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
        hash: baseHash,
      };

      const rom2: ROMFile = {
        id: 'rom-8',
        path: join(testDir, 'Workspace/game2.nes'),
        filename: 'game2.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
        hash: baseHash, // same hash triggers update by crc
      };

      await promoter.updatePlaylist(rom1);
      const result = await promoter.updatePlaylist(rom2);

      expect(result.success).toBe(true);
      expect(result.metadata?.['totalEntries']).toBe(1);

      const playlistContent = await fsReadFile(
        join(testDir, 'Sync/playlists/nes.lpl'),
        'utf-8'
      );
      const playlist = JSON.parse(playlistContent) as {
        items: Array<{ path: string }>;
      };
      expect(playlist.items.length).toBe(1);
      expect(playlist.items[0]!.path).toContain('game2.nes');
    });

    it('should handle corrupted playlist JSON gracefully', async () => {
      const playlistDir = join(testDir, 'Sync/playlists');
      await mkdir(playlistDir, { recursive: true });
      await writeFile(join(playlistDir, 'nes.lpl'), '{ invalid json', 'utf-8');

      const rom: ROMFile = {
        id: 'rom-9',
        path: join(testDir, 'Workspace/broken.nes'),
        filename: 'broken.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
        hash: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      };

      const result = await promoter.updatePlaylist(rom);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail when playlist directory is read-only', async () => {
      const playlistDir = join(testDir, 'Sync/playlists');
      await mkdir(playlistDir, { recursive: true });
      await chmod(playlistDir, 0o444);

      const rom: ROMFile = {
        id: 'rom-10',
        path: join(testDir, 'Workspace/readonly.nes'),
        filename: 'readonly.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
        hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      };

      const result = await promoter.updatePlaylist(rom);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      await chmod(playlistDir, 0o755);
    });

    it('should handle missing hash by using zero crc32', async () => {
      const rom: ROMFile = {
        id: 'rom-11',
        path: join(testDir, 'Workspace/nohash.nes'),
        filename: 'nohash.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
      };

      const result = await promoter.updatePlaylist(rom);

      expect(result.success).toBe(true);
      expect(result.data?.crc32).toBe('00000000');
    });
  });

  describe('syncThumbnails', () => {
    it('should no-op when thumbnails are disabled', async () => {
      const rom: ROMFile = {
        id: 'rom-12',
        path: join(testDir, 'Workspace/thumb.nes'),
        filename: 'thumb.nes',
        extension: '.nes',
        size: 12,
        platform: 'nes',
      };

      const result = await promoter.syncThumbnails(rom);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.metadata?.['reason']).toBe('Thumbnail sync disabled');
    });
  });
});

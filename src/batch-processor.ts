/**
 * High-Performance Batch ROM Processor
 * Processes 8,000+ ROM files in under a minute
 *
 * Policy: POL-003 (SOLID - SRP: Single Responsibility)
 * Policy: POL-018 (YAGNI) - Only what's needed for batch processing
 * Policy: POL-019 (KISS) - Simple, direct approach
 */

import { readdir, stat, link, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { cpus } from 'node:os';

import pLimit from 'p-limit';

import type { RetroArchPaths } from './interfaces/user-config.interface.js';
import type { PlatformConfig } from './interfaces/platform-config.interface.js';

/**
 * Constants for batch processing
 */
const PROGRESS_UPDATE_INTERVAL = 100; // Update progress every N files
const CONCURRENCY_MULTIPLIER = 4; // CPU cores * 4 for I/O bound tasks
const JSON_INDENT = 2;

/**
 * Result of processing a single file
 */
export interface ProcessedFile {
  source: string;
  destination: string;
  platform: string;
  platformName: string;
  size: number;
  filename: string;
}

/**
 * Result of batch processing
 */
export interface BatchResult {
  total: number;
  processed: number;
  failed: number;
  duration: number;
  files: ProcessedFile[];
  errors: Array<{ file: string; error: string }>;
}

/**
 * Batch processor for ROM files
 */
export class BatchProcessor {
  private readonly paths: RetroArchPaths;
  private readonly platformConfig: PlatformConfig;
  private readonly platformMap: Map<string, { id: string; name: string }>;
  private readonly concurrency: number;

  constructor(paths: RetroArchPaths, platformConfig: PlatformConfig) {
    this.paths = paths;
    this.platformConfig = platformConfig;
    this.platformMap = this.buildPlatformMap();
    this.concurrency = cpus().length * CONCURRENCY_MULTIPLIER;
  }

  /**
   * Process files or directory recursively
   * Handles both single file paths and directory paths
   */
  async processDirectory(inputPath: string): Promise<BatchResult> {
    const startTime = Date.now();
    const processedFiles: ProcessedFile[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    // eslint-disable-next-line no-console
    console.log('\n🔍 Scanning for ROM files...');
    const allFiles = await this.scanDirectory(inputPath);
    const total = allFiles.length;

    // eslint-disable-next-line no-console
    console.log(`📊 Found ${total} file${total === 1 ? '' : 's'}\n`);

    if (total === 0) {
      return {
        total: 0,
        processed: 0,
        failed: 0,
        duration: Date.now() - startTime,
        files: [],
        errors: [],
      };
    }

    // Create directories upfront
    // eslint-disable-next-line no-console
    console.log('📁 Creating directories...');
    await this.createDirectories();

    // Process files in parallel with concurrency control
    // eslint-disable-next-line no-console
    console.log(
      `⚡ Processing ${total} files (${this.concurrency} parallel)...\n`
    );

    const limit = pLimit(this.concurrency);
    let processed = 0;

    const tasks = allFiles.map((file) =>
      limit(async () => {
        try {
          const result = await this.processFile(file);
          if (result) {
            processedFiles.push(result);
          }

          processed++;

          // Update progress every 100 files or on last file
          if (
            processed % PROGRESS_UPDATE_INTERVAL === 0 ||
            processed === total
          ) {
            const percent = ((processed / total) * 100).toFixed(1);
            process.stdout.write(
              `\r   Progress: ${processed}/${total} (${percent}%)`
            );
          }

          return result;
        } catch (error) {
          errors.push({
            file,
            error: error instanceof Error ? error.message : String(error),
          });
          processed++;
          return null;
        }
      })
    );

    await Promise.all(tasks);
    // eslint-disable-next-line no-console
    console.log('\n');

    // Write manifests and playlists
    // eslint-disable-next-line no-console
    console.log('📝 Writing manifests and playlists...');
    await this.writeManifests(processedFiles);
    await this.writePlaylists(processedFiles);

    const duration = Date.now() - startTime;

    return {
      total,
      processed: processedFiles.length,
      failed: errors.length,
      duration,
      files: processedFiles,
      errors,
    };
  }

  /**
   * Recursively scan directory for ROM files
   * Also handles single file paths
   */
  private async scanDirectory(path: string): Promise<string[]> {
    const files: string[] = [];

    try {
      // Check if path is a file
      const pathStat = await stat(path);
      
      if (pathStat.isFile()) {
        // Single file - check if it's a recognized ROM file
        const ext = extname(path).toLowerCase();
        if (this.platformMap.has(ext)) {
          files.push(path);
        }
        return files;
      }

      // Path is a directory - scan recursively
      const entries = await readdir(path, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(path, entry.name);

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file has a recognized extension
          const ext = extname(entry.name).toLowerCase();
          if (this.platformMap.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Continue on error (e.g., permission denied)
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: Could not scan ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return files;
  }

  /**
   * Process a single ROM file
   */
  private async processFile(source: string): Promise<ProcessedFile | null> {
    const ext = extname(source).toLowerCase();
    const platform = this.platformMap.get(ext);

    if (!platform) {
      return null;
    }

    const filename = basename(source);
    const fileStats = await stat(source);

    // Destination: basePath/downloads/{Platform Name}/{filename}
    const platformDir = join(this.paths.downloads, platform.name);
    const destination = join(platformDir, filename);

    // Also create hard link in archive
    const archiveDir = join(this.paths.archive, platform.name);
    const archiveDest = join(archiveDir, filename);

    // Ensure platform directories exist
    await mkdir(platformDir, { recursive: true });
    await mkdir(archiveDir, { recursive: true });

    // Create hard link to downloads (primary location)
    if (!existsSync(destination)) {
      await link(source, destination);
    }

    // Create hard link to archive (tracking)
    if (!existsSync(archiveDest)) {
      await link(source, archiveDest);
    }

    return {
      source,
      destination,
      platform: platform.id,
      platformName: platform.name,
      size: fileStats.size,
      filename,
    };
  }

  /**
   * Create all required directories upfront
   */
  private async createDirectories(): Promise<void> {
    const dirs = [
      this.paths.downloads,
      this.paths.playlists,
      this.paths.system,
      this.paths.saves,
      this.paths.states,
      this.paths.thumbnails,
      this.paths.archive,
      this.paths.manifests,
    ];

    await Promise.all(dirs.map((dir) => mkdir(dir, { recursive: true })));
  }

  /**
   * Write manifests (one per platform, batched)
   */
  private async writeManifests(files: ProcessedFile[]): Promise<void> {
    const grouped = this.groupByPlatform(files);

    const tasks = Array.from(grouped.entries()).map(
      async ([platformName, platformFiles]) => {
        const manifest = {
          version: '1.0.0',
          platform: platformName,
          totalFiles: platformFiles.length,
          files: platformFiles.map((f) => ({
            filename: f.filename,
            size: f.size,
            source: f.source,
            destination: f.destination,
            processedAt: new Date().toISOString(),
          })),
        };

        const manifestPath = join(this.paths.manifests, `${platformName}.json`);
        await writeFile(
          manifestPath,
          JSON.stringify(manifest, null, JSON_INDENT),
          'utf-8'
        );
      }
    );

    await Promise.all(tasks);
  }

  /**
   * Write RetroArch playlists (one per platform, batched)
   */
  private async writePlaylists(files: ProcessedFile[]): Promise<void> {
    const grouped = this.groupByPlatform(files);

    const tasks = Array.from(grouped.entries()).map(
      async ([platformName, platformFiles]) => {
        const playlist = {
          version: '1.5',
          default_core_path: '',
          default_core_name: '',
          label_display_mode: 0,
          right_thumbnail_mode: 0,
          left_thumbnail_mode: 0,
          sort_mode: 0,
          items: platformFiles.map((f) => ({
            path: f.destination,
            label: f.filename.replace(/\.[^.]+$/, ''),
            core_path: 'DETECT',
            core_name: 'DETECT',
            crc32: '00000000',
            db_name: platformName,
          })),
        };

        const playlistPath = join(this.paths.playlists, `${platformName}.lpl`);
        await writeFile(
          playlistPath,
          JSON.stringify(playlist, null, JSON_INDENT),
          'utf-8'
        );
      }
    );

    await Promise.all(tasks);
  }

  /**
   * Group files by platform name
   */
  private groupByPlatform(
    files: ProcessedFile[]
  ): Map<string, ProcessedFile[]> {
    const grouped = new Map<string, ProcessedFile[]>();

    for (const file of files) {
      const existing = grouped.get(file.platformName) ?? [];
      existing.push(file);
      grouped.set(file.platformName, existing);
    }

    return grouped;
  }

  /**
   * Build extension to platform mapping
   */
  private buildPlatformMap(): Map<string, { id: string; name: string }> {
    const map = new Map<string, { id: string; name: string }>();

    for (const platform of this.platformConfig.platforms) {
      for (const ext of platform.extensions) {
        map.set(ext.toLowerCase(), {
          id: platform.id,
          name: platform.name,
        });
      }
    }

    return map;
  }
}

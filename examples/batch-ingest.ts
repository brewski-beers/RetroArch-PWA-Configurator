#!/usr/bin/env tsx
/**
 * Batch ROM Ingestion CLI
 * High-performance batch processor for 8,000+ ROM files
 * Usage: npx tsx examples/batch-ingest.ts <directory-path>
 */

/* eslint-disable no-console */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { BatchProcessor } from '../src/batch-processor.js';
import {
  generateRetroArchPaths,
  detectRetroArchPath,
} from '../src/config/simple-config.js';
import { platformConfig } from '../config/platform.config.js';
import type { SimpleConfig } from '../src/interfaces/user-config.interface.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string): void {
  console.log();
  log(`${'═'.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright);
  log(`${'═'.repeat(60)}`, colors.cyan);
}

async function loadConfig(): Promise<SimpleConfig | null> {
  const configPath = 'user-config.json';

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const data = await readFile(configPath, 'utf-8');
    const config = JSON.parse(data) as SimpleConfig;
    return config;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  logSection('RetroArch PWA Configurator - Batch ROM Ingestion');

  // Try to load configuration, fall back to auto-detection
  log('📋 Loading configuration...', colors.cyan);
  const config = await loadConfig();
  let basePath: string;

  if (!config) {
    log('⚠️  No configuration found, using auto-detection...', colors.yellow);

    const detectedPath = detectRetroArchPath();
    if (detectedPath !== null && detectedPath !== undefined) {
      basePath = detectedPath;
      log(`✅ Auto-detected RetroArch: ${basePath}`, colors.green);
    } else {
      log('❌ Could not auto-detect RetroArch directory', colors.red);
      log('💡 Run: npm run setup', colors.yellow);
      log('   Or manually specify a path in user-config.json', colors.reset);
      process.exit(1);
    }
  } else {
    basePath = config.basePath;
    log('✅ Configuration loaded', colors.green);
    log(`   Base Path: ${basePath}`, colors.reset);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    log('\n❌ Error: No path provided', colors.red);
    log('\nUsage:', colors.yellow);
    log('  npm run ingest /path/to/rom-file-or-directory/', colors.reset);
    log(
      '  npx tsx examples/batch-ingest.ts /path/to/rom-file-or-directory/',
      colors.reset
    );
    log('\nExamples:', colors.cyan);
    log('  npm run ingest ~/ROMs/', colors.reset);
    log('  npm run ingest /mnt/usb/games/game.nes', colors.reset);
    log('  npm run ingest "C:\\Users\\user\\ROMs"', colors.reset);
    process.exit(1);
  }

  const inputPath = resolve(args[0] ?? '');

  // Validate path exists
  if (!existsSync(inputPath)) {
    log(`\n❌ Error: Path not found: ${inputPath}`, colors.red);
    process.exit(1);
  }

  log(`\n📁 Input: ${inputPath}`, colors.cyan);

  // Generate RetroArch paths
  const paths = generateRetroArchPaths(basePath);

  // Initialize batch processor
  logSection('Initializing Batch Processor');
  log(`⚙️  Platform Configuration: ${platformConfig.version}`, colors.cyan);
  log(
    `🎮 Supported Platforms: ${platformConfig.platforms.length}`,
    colors.cyan
  );
  log('', colors.reset);

  // Display platform info
  platformConfig.platforms.forEach((platform) => {
    log(
      `   ${platform.id.padEnd(8)} → ${platform.name} (${platform.extensions.join(', ')})`,
      colors.reset
    );
  });

  const processor = new BatchProcessor(paths, platformConfig);

  // Run batch processing
  logSection('Running Batch Processing');

  const result = await processor.processDirectory(inputPath);

  // Display results
  logSection('Batch Processing Results');

  if (result.processed > 0) {
    log('✅ Processing Complete!', colors.green);
    log('', colors.reset);
    log(`  Total Files Scanned:  ${result.total}`, colors.reset);
    log(`  Successfully Processed: ${result.processed}`, colors.green);
    log(
      `  Failed:               ${result.failed}`,
      result.failed > 0 ? colors.yellow : colors.reset
    );
    log(
      `  Duration:             ${(result.duration / 1000).toFixed(2)}s`,
      colors.reset
    );
    log(
      `  Processing Speed:     ${(result.processed / (result.duration / 1000)).toFixed(1)} files/sec`,
      colors.cyan
    );

    // Show errors if any
    if (result.errors.length > 0) {
      log('\n⚠️  Errors:', colors.yellow);
      result.errors.slice(0, 10).forEach((err) => {
        log(`   ${err.file}: ${err.error}`, colors.yellow);
      });
      if (result.errors.length > 10) {
        log(
          `   ... and ${result.errors.length - 10} more errors`,
          colors.yellow
        );
      }
    }

    // Show platforms processed
    const platformCounts = new Map<string, number>();
    for (const file of result.files) {
      const count = platformCounts.get(file.platformName) ?? 0;
      platformCounts.set(file.platformName, count + 1);
    }

    log('\n📊 ROMs by Platform:', colors.cyan);
    for (const [platform, count] of platformCounts.entries()) {
      log(`   ${platform}: ${count} files`, colors.reset);
    }

    logSection('Output Locations');
    log('📂 ROMs:', colors.cyan);
    log(`   ${paths.downloads}/`, colors.reset);
    log('', colors.reset);
    log('📋 Manifests:', colors.cyan);
    log(`   ${paths.manifests}/`, colors.reset);
    log('', colors.reset);
    log('📝 Playlists:', colors.cyan);
    log(`   ${paths.playlists}/`, colors.reset);

    logSection('Next Steps');
    log('1. Configure RetroArch:', colors.reset);
    log('   In RetroArch → Settings → Directory:', colors.reset);
    log(`   Set Base Directory to: ${basePath}`, colors.reset);
    log('', colors.reset);
    log('2. Optional: Setup Syncthing:', colors.reset);
    log(`   Add ${basePath} to Syncthing`, colors.reset);
    log('   Share with your devices for automatic sync', colors.reset);
    log('', colors.reset);
    log('3. Launch RetroArch:', colors.reset);
    log('   Your ROMs and playlists are ready!', colors.reset);
    log('', colors.reset);
    log('🎉 All done!', colors.green);
  } else {
    log('⚠️  No ROM files were processed', colors.yellow);
    log('', colors.reset);
    log(`  Total Files Scanned:  ${result.total}`, colors.reset);
    log(`  Recognized ROM Files: ${result.processed}`, colors.reset);
    log('', colors.reset);
    log('💡 Supported file extensions:', colors.cyan);
    platformConfig.platforms.forEach((platform) => {
      log(
        `   ${platform.extensions.join(', ')} (${platform.name})`,
        colors.reset
      );
    });
  }

  console.log();
}

// Run the CLI
main().catch((error) => {
  log(
    `❌ Fatal Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    colors.red
  );
  console.error(error);
  process.exit(1);
});

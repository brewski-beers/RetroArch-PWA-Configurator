#!/usr/bin/env tsx
/**
 * ROM Ingestion Demo CLI
 * Demonstrates the complete RetroArch Platform pipeline
 * Usage: npx tsx examples/ingest-rom.ts <path-to-rom>
 *
 * ⚠️ DEPRECATED: For batch processing multiple files, use batch-ingest.ts instead:
 *    npm run ingest /path/to/rom-collection/
 *
 * This tool is kept for backward compatibility and single-file processing.
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

import { PipelineOrchestrator } from '../src/pipeline/pipeline-orchestrator.js';
import { Classifier } from '../src/pipeline/classifier.js';
import { Validator } from '../src/pipeline/validator.js';
import { Normalizer } from '../src/pipeline/normalizer.js';
import { Archiver } from '../src/pipeline/archiver.js';
import { Promoter } from '../src/pipeline/promoter.js';
import { ConfigLoader } from '../src/config/config-loader.js';
import { platformConfig } from '../config/platform.config.js';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string): void {
  console.log();
  log(`${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logPhase(
  phase: string,
  status: 'running' | 'success' | 'error'
): void {
  const icon = status === 'running' ? '⏳' : status === 'success' ? '✅' : '❌';
  const color =
    status === 'running'
      ? colors.yellow
      : status === 'success'
        ? colors.green
        : colors.red;
  log(`${icon} ${phase}`, color);
}

async function main(): Promise<void> {
  logSection('RetroArch Platform - ROM Ingestion Demo');

  // Load user configuration
  log('📋 Loading configuration...', colors.cyan);
  const configLoader = new ConfigLoader();
  const configResult = await configLoader.load();

  if (!configResult.success || !configResult.config) {
    log(`❌ Failed to load configuration: ${configResult.error}`, colors.red);
    log('💡 Run: npm run setup', colors.yellow);
    process.exit(1);
  }

  if (configResult.isDefault === true) {
    log('⚠️  Using default configuration', colors.yellow);
    log(`   Archive: ${configResult.config.archive.root.path}`, colors.reset);
    log(`   Sync: ${configResult.config.sync.root.path}`, colors.reset);
  } else {
    log('✅ Configuration loaded successfully', colors.green);
    log(`   Name: ${configResult.config.name}`, colors.reset);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    log('Usage: npx tsx examples/ingest-rom.ts <path-to-rom>', colors.yellow);
    log('', colors.reset);
    log('Examples:', colors.cyan);
    log(
      '  npx tsx examples/ingest-rom.ts examples/roms/demo-game.nes',
      colors.reset
    );
    log(
      '  npx tsx examples/ingest-rom.ts examples/roms/demo-game.sfc',
      colors.reset
    );
    log(
      '  npx tsx examples/ingest-rom.ts examples/roms/demo-game.gba',
      colors.reset
    );
    process.exit(1);
  }

  const romPath = resolve(args[0] ?? '');

  // Validate file exists
  if (!existsSync(romPath)) {
    log(`❌ Error: File not found: ${romPath}`, colors.red);
    process.exit(1);
  }

  log(`📁 Input File: ${romPath}`, colors.blue);
  log(`⚙️  Configuration: ${platformConfig.version}`, colors.blue);
  log(
    `🎮 Platforms: ${platformConfig.platforms.length} configured`,
    colors.blue
  );

  // Initialize pipeline components with user config
  logSection('Initializing Pipeline');
  const classifier = new Classifier(platformConfig);
  const validator = new Validator(platformConfig);
  const normalizer = new Normalizer(platformConfig);
  const archiver = new Archiver(platformConfig);
  const promoter = new Promoter(platformConfig);

  // Create orchestrator from user config
  const orchestrator = PipelineOrchestrator.fromUserConfig(
    configResult.config,
    classifier,
    validator,
    normalizer,
    archiver,
    promoter
  );

  log('✅ Pipeline components initialized', colors.green);
  log(`   Archive → ${configResult.config.archive.root.path}`, colors.reset);
  log(`   Sync → ${configResult.config.sync.root.path}`, colors.reset);

  // Run the pipeline
  logSection('Running Ingestion Pipeline');

  logPhase('Phase 1: Classification', 'running');
  const startTime = Date.now();

  const result = await orchestrator.process(romPath);

  const duration = Date.now() - startTime;

  // Display results
  logSection('Pipeline Results');

  if (result.success && result.rom) {
    logPhase('Pipeline Status', 'success');
    log('', colors.reset);
    log(`  ROM ID:       ${result.rom.id}`, colors.reset);
    log(`  Filename:     ${result.rom.filename}`, colors.reset);
    log(`  Platform:     ${result.rom.platform ?? 'Unknown'}`, colors.reset);
    log(`  Extension:    ${result.rom.extension}`, colors.reset);
    log(`  Size:         ${result.rom.size} bytes`, colors.reset);
    log(`  Hash (SHA256): ${result.rom.hash ?? 'N/A'}`, colors.reset);
    log(`  Duration:     ${duration}ms`, colors.reset);
    log('', colors.reset);

    logSection('Generated Files');
    log(`📦 Archive Location:`, colors.cyan);
    log(
      `  ${platformConfig.directories.archive.roms}/${result.rom.platform}/${result.rom.filename}`,
      colors.reset
    );
    log('', colors.reset);
    log(`📋 Manifest:`, colors.cyan);
    log(
      `  ${platformConfig.directories.archive.manifests}/${result.rom.platform}.json`,
      colors.reset
    );
    log('', colors.reset);
    log(`🎮 Sync Location:`, colors.cyan);
    log(
      `  ${platformConfig.directories.sync.content.roms}/${result.rom.platform}/${result.rom.filename}`,
      colors.reset
    );
    log('', colors.reset);
    log(`📝 Playlist:`, colors.cyan);
    log(
      `  ${platformConfig.directories.sync.playlists}/${result.rom.platform}.lpl`,
      colors.reset
    );

    logSection('Next Steps');
    log('1. Check the Archive directory for the stored ROM', colors.reset);
    log('2. Review the manifest JSON file', colors.reset);
    log(
      '3. Verify the Sync directory for RetroArch runtime files',
      colors.reset
    );
    log('4. Open the playlist in RetroArch', colors.reset);
    log('', colors.reset);
    log('🎉 Ingestion completed successfully!', colors.green);
  } else {
    logPhase('Pipeline Status', 'error');
    log('', colors.reset);
    log(`❌ Phase: ${result.phase ?? 'Unknown'}`, colors.red);
    log(`❌ Errors:`, colors.red);
    result.errors.forEach((error) => {
      log(`   - ${error}`, colors.red);
    });
    log('', colors.reset);
    process.exit(1);
  }
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

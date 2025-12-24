#!/usr/bin/env tsx
/**
 * Simplified Configuration Wizard CLI
 * One-question setup for batch processing
 * Following POL-019 (KISS: Keep It Simple)
 */

/* eslint-disable no-console, no-magic-numbers */

import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline/promises';
import { writeFile, access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { constants } from 'node:fs';

import type { SimpleConfig } from '../interfaces/user-config.interface.js';

import { createSimpleConfig, validateSimpleConfig } from './simple-config.js';

/**
 * Simplified configuration wizard
 * Single question: "Where is your RetroArch folder?"
 */
export class SimpleWizard {
  private readonly rl: readline.Interface;
  private readonly configPath: string;

  constructor(configPath = 'user-config.json') {
    this.rl = readline.createInterface({ input, output });
    this.configPath = configPath;
  }

  /**
   * Runs the simplified wizard
   */
  async run(): Promise<void> {
    console.log('\n🎮 RetroArch PWA Configurator - Quick Setup\n');
    console.log('━'.repeat(60));
    console.log('');

    try {
      // Check for existing config
      const existingConfig = await this.checkExistingConfig();
      if (existingConfig) {
        console.log('✅ Configuration already exists.\n');
        const overwrite = await this.confirm(
          'Do you want to overwrite it? (y/N): '
        );
        if (!overwrite) {
          console.log(
            '\n❌ Setup cancelled. Existing configuration preserved.\n'
          );
          this.rl.close();
          return;
        }
      }

      // Get base path
      console.log('📂 Where is your RetroArch folder?\n');
      console.log(
        '   This is where your ROMs, playlists, and save files will be stored.'
      );
      console.log(
        '   Example: /home/user/RetroArch or C:\\Users\\user\\RetroArch\n'
      );

      const basePath = await this.getBasePath();

      // Validate path is writable
      const pathValid = await this.validatePath(basePath);
      if (!pathValid) {
        console.log(
          '\n❌ Path does not exist or is not writable. Please create the directory first.\n'
        );
        process.exit(1);
      }

      // Create config
      const config = createSimpleConfig(basePath);

      // Validate config
      const validation = validateSimpleConfig(config);
      if (!validation.valid) {
        console.log(`\n❌ Configuration error: ${validation.error}\n`);
        process.exit(1);
      }

      // Preview
      console.log('\n📝 Configuration Preview:\n');
      console.log(`   Version:    ${config.version}`);
      console.log(`   Base Path:  ${config.basePath}`);
      console.log('');
      console.log('   Auto-generated directories:');
      console.log(
        `   → ${config.basePath}/downloads/          (ROMs by platform)`
      );
      console.log(
        `   → ${config.basePath}/playlists/          (RetroArch .lpl files)`
      );
      console.log(`   → ${config.basePath}/system/             (BIOS files)`);
      console.log(`   → ${config.basePath}/saves/              (Save files)`);
      console.log(`   → ${config.basePath}/states/             (Save states)`);
      console.log(`   → ${config.basePath}/thumbnails/         (Artwork)`);
      console.log(
        `   → ${config.basePath}/.archive/           (Hidden tracking)`
      );
      console.log('');

      // Confirm and save
      const confirmed = await this.confirm('Save this configuration? (Y/n): ');
      if (confirmed) {
        await this.saveConfig(config);
        console.log('\n✅ Configuration saved successfully!\n');
        this.printNextSteps(config.basePath);
      } else {
        console.log('\n❌ Setup cancelled. No configuration saved.\n');
      }
    } catch (error) {
      console.error(
        `\n❌ Setup failed: ${error instanceof Error ? error.message : String(error)}\n`
      );
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Check if configuration already exists
   */
  private async checkExistingConfig(): Promise<boolean> {
    try {
      await access(this.configPath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get base path from user
   */
  private async getBasePath(): Promise<string> {
    const answer = await this.rl.question('RetroArch folder: ');
    const trimmed = answer.trim();

    if (!trimmed) {
      console.log('❌ Path cannot be empty. Please try again.');
      return this.getBasePath();
    }

    return resolve(trimmed);
  }

  /**
   * Validate that path exists and is writable
   */
  private async validatePath(path: string): Promise<boolean> {
    try {
      // Try to create the directory if it doesn't exist
      await mkdir(path, { recursive: true });

      // Check if we can write to it
      await access(path, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ask for confirmation (Y/n pattern)
   */
  private async confirm(prompt: string): Promise<boolean> {
    const answer = await this.rl.question(prompt);
    const normalized = answer.trim().toLowerCase();

    // Default to 'yes' if empty (for Y/n pattern)
    if (normalized === '') {
      return prompt.includes('(Y/n)');
    }

    return normalized === 'y' || normalized === 'yes';
  }

  /**
   * Save configuration to file
   */
  private async saveConfig(config: SimpleConfig): Promise<void> {
    const json = JSON.stringify(config, null, 2);
    await writeFile(this.configPath, json, 'utf-8');
  }

  /**
   * Print next steps
   */
  private printNextSteps(basePath: string): void {
    console.log('━'.repeat(60));
    console.log('');
    console.log('🎉 Next Steps:\n');
    console.log('1. Batch ingest your ROM collection:');
    console.log('   npm run ingest /path/to/rom-collection/\n');
    console.log('2. Configure RetroArch:');
    console.log('   In RetroArch → Settings → Directory:');
    console.log(`   Set Base Directory to: ${basePath}\n`);
    console.log('3. Optional: Setup Syncthing:');
    console.log(`   Add ${basePath} to Syncthing`);
    console.log('   Share with your devices for automatic sync\n');
    console.log('━'.repeat(60));
    console.log('');
  }
}

// Run the wizard
const wizard = new SimpleWizard();
wizard.run().catch((error) => {
  console.error(
    `Fatal error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});

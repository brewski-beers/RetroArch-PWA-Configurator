/**
 * Configuration Wizard CLI
 * Interactive setup for user configuration
 * Following POL-003 (SOLID - SRP: Single Responsibility)
 */

import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline/promises';
import { ConfigLoader } from './config-loader.js';
import { configTemplates, getRecommendedTemplate } from './config-templates.js';
import type { UserConfig } from '../interfaces/user-config.interface.js';

/**
 * Interactive configuration wizard
 * Guides users through setup process
 */
export class ConfigWizard {
  private readonly loader: ConfigLoader;
  private readonly rl: readline.Interface;

  constructor(configPath: string = 'user-config.json') {
    this.loader = new ConfigLoader(configPath);
    this.rl = readline.createInterface({ input, output });
  }

  /**
   * Runs the interactive wizard
   */
  async run(): Promise<void> {
    console.log('\n🎮 RetroArch PWA Configurator - Setup Wizard\n');

    try {
      // Step 1: Check for existing config
      const existingConfig = await this.checkExistingConfig();
      if (existingConfig) {
        console.log('\n✅ Configuration already exists. Exiting wizard.\n');
        this.rl.close();
        return;
      }

      // Step 2: Select template
      console.log('📋 Step 1: Choose a directory structure template\n');
      const template = await this.selectTemplate();
      console.log(`\n✅ Selected: ${template.name}\n`);

      // Step 3: Customize base path
      console.log('📂 Step 2: Set your base directory path\n');
      const basePath = await this.getBasePath();
      console.log(`\n✅ Base path: ${basePath}\n`);

      // Step 4: Generate config
      const config = template.generate(basePath);
      config.name = `My RetroArch Configuration (${template.name})`;

      // Step 5: Preview config
      console.log('📝 Step 3: Configuration preview\n');
      this.previewConfig(config);

      // Step 6: Confirm and save
      const confirmed = await this.confirmSave();
      if (confirmed) {
        const saveResult = await this.loader.save(config);
        if (saveResult.success) {
          console.log('\n✅ Configuration saved successfully!\n');
          this.printNextSteps();
        } else {
          console.error(
            `\n❌ Failed to save configuration: ${saveResult.error ?? 'Unknown error'}\n`
          );
        }
      } else {
        console.log(
          '\n❌ Configuration not saved. Run setup again to retry.\n'
        );
      }
    } catch (error) {
      console.error(
        `\n❌ Setup failed: ${error instanceof Error ? error.message : String(error)}\n`
      );
    } finally {
      this.rl.close();
    }
  }

  /**
   * Checks if configuration already exists
   */
  private async checkExistingConfig(): Promise<boolean> {
    const loadResult = await this.loader.load();
    return loadResult.success === true && loadResult.isDefault === false;
  }

  /**
   * Interactive template selection
   */
  private async selectTemplate(): Promise<(typeof configTemplates)[number]> {
    // List templates
    configTemplates.forEach((template, index) => {
      const recommended = template.recommended === true ? ' (RECOMMENDED)' : '';
      console.log(
        `  ${index + 1}. ${template.name}${recommended}\n     ${template.description}\n`
      );
    });

    // Get user choice
    const answer = await this.rl.question(
      `Choose template (1-${configTemplates.length}) [1]: `
    );
    const choice = parseInt(answer.trim() || '1', 10) - 1;

    if (choice >= 0 && choice < configTemplates.length) {
      const selected = configTemplates[choice];
      if (selected !== undefined) {
        return selected;
      }
    }

    // Default to recommended
    return getRecommendedTemplate();
  }

  /**
   * Get base path from user
   */
  private async getBasePath(): Promise<string> {
    const defaultPath = process.cwd();
    console.log(`  The base path is where your RetroArch data will be stored.`);
    console.log(
      `  For co-located setup, all directories will be created here.`
    );
    console.log(`  Default: ${defaultPath}\n`);

    const answer = await this.rl.question(`Enter base path [${defaultPath}]: `);
    return answer.trim() || defaultPath;
  }

  /**
   * Preview configuration
   */
  private previewConfig(config: UserConfig): void {
    console.log(`  Name: ${config.name}`);
    console.log(`  Version: ${config.version}`);
    console.log(`  Co-located: ${config.colocate === true ? 'Yes' : 'No'}`);
    if (
      config.basePath !== undefined &&
      config.basePath !== null &&
      config.basePath !== ''
    ) {
      console.log(`  Base Path: ${config.basePath}`);
    }
    console.log('\n  Directory Structure:');
    console.log(`    Archive Root:  ${config.archive.root.path}`);
    console.log(`    Sync Root:     ${config.sync.root.path}`);
    console.log(`    Workspace:     ${config.workspace.processing.path}`);
    console.log('');
  }

  /**
   * Confirm before saving
   */
  private async confirmSave(): Promise<boolean> {
    const answer = await this.rl.question(
      'Save this configuration? (y/n) [y]: '
    );
    const response = answer.trim().toLowerCase() || 'y';
    return response === 'y' || response === 'yes';
  }

  /**
   * Print next steps after successful setup
   */
  private printNextSteps(): void {
    console.log('🚀 Next Steps:\n');
    console.log('  1. Ingest your first ROM:');
    console.log('     npx tsx examples/ingest-rom.ts /path/to/your/game.nes\n');
    console.log('  2. Try the demo ROMs:');
    console.log('     npm run demo:nes\n');
    console.log('  3. View your configuration:');
    console.log('     cat user-config.json\n');
    console.log('  4. Edit configuration manually if needed (JSON file)\n');
  }
}

/**
 * CLI entry point
 */
export async function runWizard(): Promise<void> {
  const wizard = new ConfigWizard();
  await wizard.run();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWizard().catch((error: Error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

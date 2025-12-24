/**
 * Pipeline Orchestrator
 * Orchestrates the entire ROM ingestion pipeline
 * Following DIP (Dependency Inversion Principle) - depends on abstractions
 */

import type {
  IClassifier,
  IValidator,
  INormalizer,
  IArchiver,
  IPromoter,
  ROMFile,
} from '../interfaces/pipeline.interface.js';
import type { PlatformConfig } from '../interfaces/platform-config.interface.js';
import type { UserConfig } from '../interfaces/user-config.interface.js';
import { join } from 'node:path';

export interface PipelineResult {
  success: boolean;
  rom?: ROMFile;
  errors: string[];
  phase?: string;
}

/**
 * Converts UserConfig to PlatformConfig directory structure
 * Bridges user configuration to pipeline requirements
 */
function userConfigToDirectoryStructure(
  config: UserConfig
): PlatformConfig['directories'] {
  return {
    archive: {
      root: config.archive.root.path,
      bios: config.archive.bios.path,
      manifests: config.archive.manifests.path,
      roms: config.archive.roms.path,
    },
    sync: {
      root: config.sync.root.path,
      content: {
        roms: join(config.sync.content.path, 'roms'),
        bios: join(config.sync.content.path, 'bios'),
        saves: join(config.sync.content.path, 'saves'),
        states: join(config.sync.content.path, 'states'),
      },
      playlists: config.sync.playlists.path,
      config: join(config.sync.root.path, 'config'),
    },
    thumbnails: {
      root: config.sync.thumbnails.path,
    },
    workspace: {
      root: config.workspace.processing.path,
      staging: join(config.workspace.processing.path, 'staging'),
      validation: join(config.workspace.processing.path, 'validation'),
      rejected: join(config.workspace.processing.path, 'rejected'),
      tools: join(config.workspace.processing.path, 'tools'),
    },
  };
}

/**
 * Pipeline orchestrator that runs all phases in sequence
 */
export class PipelineOrchestrator {
  private readonly config: PlatformConfig;
  private readonly classifier: IClassifier;
  private readonly validator: IValidator;
  private readonly normalizer: INormalizer;
  private readonly archiver: IArchiver;
  private readonly promoter: IPromoter;

  /**
   * Creates a new PipelineOrchestrator
   * @param config - Platform configuration with directories
   * @param classifier - Classifier implementation
   * @param validator - Validator implementation
   * @param normalizer - Normalizer implementation
   * @param archiver - Archiver implementation
   * @param promoter - Promoter implementation
   */
  constructor(
    config: PlatformConfig,
    classifier: IClassifier,
    validator: IValidator,
    normalizer: INormalizer,
    archiver: IArchiver,
    promoter: IPromoter
  ) {
    this.config = config;
    this.classifier = classifier;
    this.validator = validator;
    this.normalizer = normalizer;
    this.archiver = archiver;
    this.promoter = promoter;
  }

  /**
   * Creates a new PipelineOrchestrator from UserConfig
   * This is the recommended way to create an orchestrator
   * @param userConfig - User configuration
   * @param classifier - Classifier implementation
   * @param validator - Validator implementation
   * @param normalizer - Normalizer implementation
   * @param archiver - Archiver implementation
   * @param promoter - Promoter implementation
   */
  static fromUserConfig(
    userConfig: UserConfig,
    classifier: IClassifier,
    validator: IValidator,
    normalizer: INormalizer,
    archiver: IArchiver,
    promoter: IPromoter
  ): PipelineOrchestrator {
    // Convert UserConfig to PlatformConfig
    const platformConfig: PlatformConfig = {
      version: userConfig.version,
      directories: userConfigToDirectoryStructure(userConfig),
      pipeline: {
        enableClassifier: true,
        enableValidator: true,
        enableNormalizer: true,
        enableArchiver: true,
        enablePromoter: true,
        enableCHDConversion: false,
        enableThumbnails: false,
        enableMetadata: false,
      },
      platforms: [], // Will be populated from platform definitions
      plugins: {
        enabled: false,
      },
    };

    return new PipelineOrchestrator(
      platformConfig,
      classifier,
      validator,
      normalizer,
      archiver,
      promoter
    );
  }

  /**
   * Runs the complete pipeline for a file
   */
  async process(filePath: string): Promise<PipelineResult> {
    // Phase 1: Classification
    if (!this.config.pipeline.enableClassifier) {
      return {
        success: false,
        errors: ['Classifier phase is disabled'],
        phase: 'classifier',
      };
    }

    const classifyResult = await this.classifier.classify(filePath);
    if (!classifyResult.success || !classifyResult.data) {
      return {
        success: false,
        errors: [classifyResult.error ?? 'Classification failed'],
        phase: 'classifier',
      };
    }

    let rom = classifyResult.data;

    // Phase 2: Validation
    if (this.config.pipeline.enableValidator) {
      const validationResults = await this.runValidationPhase(rom);
      if (!validationResults.success) {
        return {
          success: false,
          rom,
          errors: validationResults.errors,
          phase: 'validator',
        };
      }
      rom = validationResults.rom;
    }

    // Phase 3: Normalization
    if (this.config.pipeline.enableNormalizer) {
      const normalizationResult = await this.runNormalizationPhase(rom);
      if (!normalizationResult.success) {
        return {
          success: false,
          rom,
          errors: normalizationResult.errors,
          phase: 'normalizer',
        };
      }
      rom = normalizationResult.rom;
    }

    // Phase 4: Archival
    if (this.config.pipeline.enableArchiver) {
      const archivalResult = await this.runArchivalPhase(rom);
      if (!archivalResult.success) {
        return {
          success: false,
          rom,
          errors: archivalResult.errors,
          phase: 'archiver',
        };
      }
    }

    // Phase 5: Promotion
    if (this.config.pipeline.enablePromoter) {
      const promotionResult = await this.runPromotionPhase(rom);
      if (!promotionResult.success) {
        return {
          success: false,
          rom,
          errors: promotionResult.errors,
          phase: 'promoter',
        };
      }
    }

    return {
      success: true,
      rom,
      errors: [],
    };
  }

  /**
   * Runs the validation phase
   */
  private async runValidationPhase(
    rom: ROMFile
  ): Promise<{ success: boolean; rom: ROMFile; errors: string[] }> {
    const errors: string[] = [];

    // Validate integrity
    const integrityResult = await this.validator.validateIntegrity(rom);
    if (!integrityResult.success) {
      errors.push(integrityResult.error ?? 'Integrity validation failed');
    }

    // Generate hash
    const hashResult = await this.validator.generateHash(rom);
    if (hashResult.success && hashResult.data !== undefined) {
      rom.hash = hashResult.data;
    } else {
      errors.push(hashResult.error ?? 'Hash generation failed');
    }

    // Check for duplicates
    if (rom.hash !== undefined && rom.hash !== '') {
      const duplicateResult = await this.validator.checkDuplicate(rom.hash);
      if (duplicateResult.data === true) {
        errors.push('Duplicate ROM detected');
      }
    }

    // Validate BIOS dependencies
    const biosResult = await this.validator.validateBIOSDependencies(rom);
    if (!biosResult.success) {
      errors.push(biosResult.error ?? 'BIOS validation failed');
    }

    return {
      success: errors.length === 0,
      rom,
      errors,
    };
  }

  /**
   * Runs the normalization phase
   */
  private async runNormalizationPhase(
    rom: ROMFile
  ): Promise<{ success: boolean; rom: ROMFile; errors: string[] }> {
    const errors: string[] = [];

    // Apply naming pattern
    const namingResult = await this.normalizer.applyNamingPattern(rom);
    if (namingResult.success && namingResult.data) {
      rom = namingResult.data;
    } else {
      errors.push(namingResult.error ?? 'Naming pattern failed');
    }

    // Generate metadata
    const metadataResult = await this.normalizer.generateMetadata(rom);
    if (metadataResult.success && metadataResult.data) {
      rom.metadata = {
        ...rom.metadata,
        ...metadataResult.data,
      };
    }

    return {
      success: errors.length === 0,
      rom,
      errors,
    };
  }

  /**
   * Runs the archival phase
   */
  private async runArchivalPhase(
    rom: ROMFile
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Archive ROM
    const archiveResult = await this.archiver.archiveROM(rom);
    if (!archiveResult.success) {
      errors.push(archiveResult.error ?? 'ROM archival failed');
    }

    // Store metadata
    const metadataResult = await this.archiver.storeMetadata(rom);
    if (!metadataResult.success) {
      errors.push(metadataResult.error ?? 'Metadata storage failed');
    }

    // Write manifest entry
    const manifestEntry = {
      id: rom.id,
      filename: rom.filename,
      platform: rom.platform ?? 'unknown',
      hash: rom.hash ?? '',
      size: rom.size,
      extension: rom.extension,
      archivedAt: new Date().toISOString(),
      metadata: rom.metadata ?? {},
    };
    const manifestResult = await this.archiver.writeManifest(manifestEntry);
    if (!manifestResult.success) {
      errors.push(manifestResult.error ?? 'Manifest write failed');
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Runs the promotion phase
   */
  private async runPromotionPhase(
    rom: ROMFile
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Promote ROM
    const promoteResult = await this.promoter.promoteROM(rom);
    if (!promoteResult.success) {
      errors.push(promoteResult.error ?? 'ROM promotion failed');
    }

    // Update playlist
    const playlistResult = await this.promoter.updatePlaylist(rom);
    if (!playlistResult.success) {
      errors.push(playlistResult.error ?? 'Playlist update failed');
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }
}

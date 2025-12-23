/**
 * Pipeline Phase Interfaces
 * Defines the contracts for each phase of the ROM ingestion pipeline
 * Following ISP (Interface Segregation Principle) - small, focused interfaces
 */

/**
 * Result of a pipeline phase operation
 */
export interface PhaseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * ROM file information
 */
export interface ROMFile {
  id: string;
  filename: string;
  path: string;
  platform?: string;
  extension: string;
  hash?: string;
  size: number;
  metadata?: Record<string, unknown>;
}

/**
 * Phase 1: Classifier Interface
 * Accepts raw ROMs and classifies them by extension
 */
export interface IClassifier {
  /**
   * Classifies a file by extension and determines platform
   */
  classify(filePath: string): Promise<PhaseResult<ROMFile>>;

  /**
   * Moves classified files to validation phase
   */
  moveToValidation(rom: ROMFile): PhaseResult<string>;
}

/**
 * Phase 2: Validator Interface
 * Validates file integrity and dependencies
 */
export interface IValidator {
  /**
   * Validates file integrity
   */
  validateIntegrity(rom: ROMFile): Promise<PhaseResult<boolean>>;

  /**
   * Checks for companion files (cue sheets, etc.)
   */
  checkCompanionFiles(rom: ROMFile): Promise<PhaseResult<string[]>>;

  /**
   * Generates hash for file
   */
  generateHash(rom: ROMFile): Promise<PhaseResult<string>>;

  /**
   * Checks for duplicates
   */
  checkDuplicate(hash: string): Promise<PhaseResult<boolean>>;

  /**
   * Validates BIOS dependencies
   */
  validateBIOSDependencies(rom: ROMFile): Promise<PhaseResult<boolean>>;

  /**
   * Validates naming correctness
   */
  validateNaming(rom: ROMFile): Promise<PhaseResult<boolean>>;
}

/**
 * Phase 3: Normalizer Interface
 * Normalizes and prepares files for archival
 */
export interface INormalizer {
  /**
   * Applies naming patterns to ROM
   */
  applyNamingPattern(rom: ROMFile): Promise<PhaseResult<ROMFile>>;

  /**
   * Converts to CHD format (optional)
   */
  convertToCHD(rom: ROMFile): Promise<PhaseResult<ROMFile>>;

  /**
   * Generates metadata for ROM
   */
  generateMetadata(rom: ROMFile): Promise<PhaseResult<Record<string, unknown>>>;
}

/**
 * Manifest entry for archived ROM
 */
export interface ManifestEntry {
  id: string;
  filename: string;
  platform: string;
  hash: string;
  size: number;
  extension: string;
  archivedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Phase 4: Archiver Interface
 * Archives normalized ROMs
 */
export interface IArchiver {
  /**
   * Copies normalized ROM to archive
   */
  archiveROM(rom: ROMFile): Promise<PhaseResult<string>>;

  /**
   * Writes manifest entry
   */
  writeManifest(entry: ManifestEntry): Promise<PhaseResult<boolean>>;

  /**
   * Stores hash and metadata
   */
  storeMetadata(rom: ROMFile): Promise<PhaseResult<boolean>>;
}

/**
 * Playlist entry for RetroArch
 */
export interface PlaylistEntry {
  path: string;
  label: string;
  core_path: string;
  core_name: string;
  crc32: string;
  db_name: string;
}

/**
 * Phase 5: Promoter Interface
 * Promotes ROMs to RetroArch runtime
 */
export interface IPromoter {
  /**
   * Moves ROM to RetroArch-Sync directory
   */
  promoteROM(rom: ROMFile): Promise<PhaseResult<string>>;

  /**
   * Updates RetroArch playlists
   */
  updatePlaylist(rom: ROMFile): Promise<PhaseResult<PlaylistEntry>>;

  /**
   * Syncs thumbnails (optional)
   */
  syncThumbnails(rom: ROMFile): Promise<PhaseResult<boolean>>;
}

# ROM Ingestion Pipeline

Five-phase pipeline for processing, validating, and archiving ROM files.

## Architecture

```
Input ROM → Classifier → Validator → Normalizer → Archiver → Promoter → Output
```

## Phases

### 1. Classifier

Identifies platform from file extension.

```typescript
const result = await classifier.classify('/path/to/game.nes');
// result.data.platform = 'nes'
```

### 2. Validator

Generates SHA-256 hash, validates integrity, detects companion files (.cue/.bin).

```typescript
const result = await validator.validate(rom);
// result.data.hash = 'sha256:...'
```

### 3. Normalizer

Applies naming patterns, enriches metadata (placeholder for now).

### 4. Archiver

Copies ROM to archive, generates JSON manifest.

```typescript
const result = await archiver.archiveROM(rom);
// Copies to: Archive/ROMs/{platform}/{filename}
// Manifest: Archive/Manifests/{platform}.json
```

### 5. Promoter

Promotes ROM to sync directory, generates RetroArch playlist.

```typescript
const result = await promoter.promote(rom);
// Copies to: Sync/content/roms/{platform}/{filename}
// Playlist: Sync/playlists/{platform}.lpl
```

## Orchestration

```typescript
import { PipelineOrchestrator } from './pipeline-orchestrator.js';

// From user config (recommended)
const orchestrator = PipelineOrchestrator.fromUserConfig(
  userConfig,
  classifier,
  validator,
  normalizer,
  archiver,
  promoter
);

// Process ROM
const result = await orchestrator.process('/path/to/game.nes');
```

## Dependencies

All components follow **Dependency Inversion Principle** (SOLID):

- Depend on `I*` interfaces, not concrete implementations
- Injected via constructor

## Configuration

Pipeline respects user-configured directory paths via `UserConfig`:

- `config.archive.*` - Archive destinations
- `config.sync.*` - Sync destinations
- `config.workspace.*` - Temporary processing

See `src/config/README.md` for configuration details.

## Files

- `pipeline-orchestrator.ts` - Runs all phases in sequence
- `classifier.ts` - Phase 1 (platform detection)
- `validator.ts` - Phase 2 (SHA-256 hashing, integrity)
- `normalizer.ts` - Phase 3 (naming, metadata)
- `archiver.ts` - Phase 4 (archival, manifests)
- `promoter.ts` - Phase 5 (sync, playlists)

# Configuration System

User-customizable directory structure for RetroArch ROM ingestion pipeline.

## Quick Start

```bash
# Interactive setup wizard
npm run setup

# Or use defaults (current directory)
npx tsx examples/ingest-rom.ts game.nes
```

## Templates

### Co-Located (Recommended)

All directories under a single base path.

```
/home/user/RetroArch/
├── Archive/      # Source of truth
├── Sync/         # RetroArch-ready
└── Workspace/    # Temporary
```

### Distributed

Archive local, Sync on network, Workspace temporary.

```
/home/user/Archive/         # Local SSD
/mnt/nas/Sync/              # Network share
/tmp/workspace/             # Temp processing
```

### Minimal

Bare minimum for testing.

## Configuration File

Location: `user-config.json` (root of project)

```json
{
  "version": "1.0.0",
  "name": "My RetroArch Config",
  "colocate": true,
  "basePath": "/home/user/RetroArch",
  "archive": {
    "root": { "path": "/home/user/RetroArch/Archive", ... }
  }
}
```

## Programmatic Usage

```typescript
import {
  ConfigLoader,
  PipelineOrchestrator,
} from '@techbybrewski/retroarch-pwa-configurator';

// Load config (uses defaults if missing)
const loader = new ConfigLoader();
const result = await loader.load();

// Use with pipeline
const orchestrator = PipelineOrchestrator.fromUserConfig(
  result.config,
  classifier,
  validator,
  normalizer,
  archiver,
  promoter
);
```

## Validation

- Required fields: `version`, `name`
- Path conflict detection (cross-directory)
- Co-location consistency checks
- Relative path warnings

## Files

- `config-templates.ts` - Template definitions
- `config-validator.ts` - Validation logic
- `config-loader.ts` - Load/save operations
- `config-wizard.ts` - Interactive CLI setup

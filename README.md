# RetroArch PWA Configurator

[![CI/CD Pipeline](https://github.com/brewski-beers/RetroArch/workflows/PR%20Verification/badge.svg)](https://github.com/brewski-beers/RetroArch/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **TechByBrewski** — A TypeScript-powered tool for managing RetroArch ROM collections with customizable directory structures and automated ingestion.

## Overview

**RetroArch PWA Configurator** is a high-performance batch processor for managing RetroArch ROM collections. It provides:

- ⚡ **Blazing-Fast Batch Processing** - Process 8,000+ ROM files in under a minute
- 🚀 **Parallel Processing** - Utilizes all CPU cores for maximum speed (200+ files/sec)
- 💾 **Zero Disk Space Duplication** - Uses hard links instead of copying files
- 🎮 **RetroArch-Native Output** - Direct integration with RetroArch directory structure
- 🔧 **Zero-Config Simplicity** - Single question setup, no complex configuration
- 🔄 **Syncthing Ready** - Perfect for multi-device synchronization

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup (One Question)

```bash
npm run setup
# → Where is your RetroArch folder? /home/user/RetroArch
```

### 3. Batch Ingest ROMs

```bash
npm run ingest /path/to/rom-collection/
# → Processing 8,247 files...
# → ████████████████████ 100% - 47s
# → ✅ 8,247 ROMs ready!
```

### 4. Syncthing Integration (Optional)

- Add `/home/user/RetroArch` to Syncthing
- Share with your devices
- Done! All devices stay in sync automatically

### 5. RetroArch Configuration

In RetroArch → Settings → Directory:
- Set **Base Directory** to `/home/user/RetroArch`
- RetroArch automatically finds everything!

## Performance

- **8,000 files in ~40 seconds**
- **200 files/sec processing speed**
- **Zero disk space duplication** (hard links)
- **Parallel processing** (uses all CPU cores)

## Features

### High-Performance Batch Processing

The new batch processor is designed for speed and efficiency:

- **Recursive directory scanning** - Automatically finds all ROMs in subdirectories
- **Parallel processing** - Uses p-limit to process 4x CPU cores simultaneously
- **Hard links** - Zero-copy file duplication saves disk space
- **Batch writes** - Manifests and playlists written once at the end
- **Progress tracking** - Real-time progress updates during processing
- **Error handling** - Continues processing even if individual files fail

### Configuration System

Two approaches available:

#### Simple Configuration (Recommended)
- **Single base path** - All files under one RetroArch directory
- **Zero complexity** - One question setup
- **RetroArch-native** - Matches RetroArch's expected structure

#### Advanced Configuration (Legacy)
- **Co-Located** - All directories under single base path
- **Distributed** - Archive local, Sync on network
- **Minimal** - Bare minimum for testing

See [`src/config/README.md`](src/config/README.md)

### ROM Ingestion Pipeline

Five-phase pipeline for processing ROMs:

1. **Classifier** - Platform detection
2. **Validator** - SHA-256 hashing, integrity checks
3. **Normalizer** - Naming patterns, metadata
4. **Archiver** - Permanent archival with JSON manifests
5. **Promoter** - RetroArch sync directory, playlist generation

See [`src/pipeline/README.md`](src/pipeline/README.md)

### Supported Platforms

The batch processor automatically detects and organizes ROMs for:

- **Nintendo - Nintendo Entertainment System** (.nes)
- **Nintendo - Super Nintendo Entertainment System** (.sfc, .smc)
- **Nintendo - Nintendo 64** (.n64, .z64, .v64)
- **Game Boy Advance** (.gba)
- **Sega - Mega Drive - Genesis** (.md, .gen, .bin)
- **Sony - PlayStation** (.cue, .bin, .chd)

Platform names match RetroArch's naming convention for seamless integration.

### RetroArch Directory Structure

The batch processor creates a RetroArch-native directory structure:

```
/home/user/RetroArch/
├── .archive/              # Hidden tracking (hard links, zero space)
│   ├── manifests/
│   └── {platform}/
├── downloads/             # ROMs organized by platform name
│   ├── Nintendo - Nintendo Entertainment System/
│   ├── Nintendo - Super Nintendo Entertainment System/
│   └── Sega - Mega Drive - Genesis/
├── playlists/             # RetroArch .lpl files
├── saves/                 # Save files
├── states/                # Save states
├── system/                # BIOS files
└── thumbnails/            # Artwork
```

### Policy-as-Code

Unified three-tier policy system:

- **Application Policies** (POL-\*) - TypeScript strict mode, test coverage, SOLID compliance
- **Testing Policies** (TEST-\*) - Factory usage, single responsibility, AAA pattern
- **E2E Policies** (E2E-\*) - Test ID selectors, page object pattern

## Usage Examples

### Batch Ingestion (Recommended)

Process an entire ROM collection:

```bash
# Basic usage
npm run ingest /path/to/rom-collection/

# Process USB drive
npm run ingest /mnt/usb/games/

# Process nested directories
npm run ingest ~/Downloads/ROMs/
```

### Single File Ingestion (Legacy)

For individual ROM files using the full pipeline:

```bash
# Single ROM
npx tsx examples/ingest-rom.ts /path/to/game.nes

# Demo ROMs
npm run demo:nes
npm run demo:snes
npm run demo:genesis
```

## Development

```bash
# Development mode (hot reload)
npm run dev:server

# Run tests
npm test
npm run test:watch
npm run test:e2e

# Full CI verification
npm run ci:verify
```

## Project Structure

```
src/
├── config/         # Configuration system (templates, validation, loading)
├── pipeline/       # ROM ingestion pipeline (5 phases)
├── interfaces/     # TypeScript interfaces
└── pages/          # Page generation (PWA UI - future)

examples/
├── ingest-rom.ts   # ROM ingestion CLI demo
└── roms/           # Demo ROM files

config/
├── platform.config.ts    # Platform definitions (NES, SNES, etc.)
├── policy.config.ts      # Application policies
└── unified-policy.config.ts  # Policy system aggregator
```

## Architecture

**SOLID Principles Throughout:**

- Single Responsibility - Each module has one clear purpose
- Open/Closed - Extend via config, not code modification
- Liskov Substitution - Interfaces honored by implementations
- Interface Segregation - Focused, minimal interfaces
- Dependency Inversion - Depend on abstractions, injected via constructor

**Policy-as-Code:**

- All architectural decisions reference policy rules by ID
- Automatic enforcement via policy checker
- Three-tier system (Application, Testing, E2E)

**Config-as-Infrastructure:**

- All behavior defined in configuration files
- No hardcoded values
- User data stays local (never committed)

## Documentation

- [Configuration System](src/config/README.md) - Setup wizard, templates, validation
- [ROM Pipeline](src/pipeline/README.md) - Five-phase ingestion architecture
- [Examples](examples/README.md) - ROM ingestion CLI demos
- [Policy Audit](POLICY_AUDIT.md) - Complete policy alignment matrix
- [Copilot Instructions](.github/copilot-instructions.md) - Development guidelines

## Testing

```bash
# Unit tests (Vitest)
npm test                  # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# E2E tests (Playwright)
npm run test:e2e          # Browser tests

# Policy validation
npm run policy:check      # After build
```

**Coverage:** 94 tests passing, 95%+ line coverage

## Contributing

This project follows strict quality standards:

- ✅ TypeScript strict mode (zero `any` types)
- ✅ ESLint + Prettier (pre-commit hooks)
- ✅ Test-driven development (TDD)
- ✅ SOLID principles enforcement
- ✅ Policy-as-code compliance

See [Copilot Instructions](.github/copilot-instructions.md) for full guidelines.

## License

MIT © TechByBrewski

---

**Note:** This is a configurator tool for RetroArch setups, not the RetroArch platform itself.

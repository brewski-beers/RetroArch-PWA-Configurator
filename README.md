# RetroArch PWA Configurator

[![CI/CD Pipeline](https://github.com/brewski-beers/RetroArch/workflows/PR%20Verification/badge.svg)](https://github.com/brewski-beers/RetroArch/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **TechByBrewski** — A TypeScript-powered tool for managing RetroArch ROM collections with customizable directory structures and automated ingestion.

## Overview

**RetroArch PWA Configurator** is a configuration and pipeline tool for RetroArch server setups. It provides:

- 🔧 **Customizable Directory Structure** - Choose where your ROMs, archives, and sync directories live
- 🎮 **ROM Ingestion Pipeline** - Automated classification, validation, archival, and playlist generation
- ✅ **Policy-Driven Validation** - Ensures configuration correctness and path integrity
- 📦 **Modular Architecture** - SOLID principles with dependency injection throughout
- 🧪 **Comprehensive Testing** - 94 tests with 95%+ coverage

## Quick Start

```bash
# Install dependencies
npm install

# Setup directory structure (interactive)
npm run setup

# Ingest a ROM file
npx tsx examples/ingest-rom.ts /path/to/game.nes

# Or try demo ROMs
npm run demo:nes
```

## Features

### Configuration System

User-customizable directory paths with three templates:

- **Co-Located** (recommended) - All directories under single base path
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

### Policy-as-Code

Unified three-tier policy system:

- **Application Policies** (POL-\*) - TypeScript strict mode, test coverage, SOLID compliance
- **Testing Policies** (TEST-\*) - Factory usage, single responsibility, AAA pattern
- **E2E Policies** (E2E-\*) - Test ID selectors, page object pattern

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

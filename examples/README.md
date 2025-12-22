# Examples

Executable demos for ROM ingestion pipeline.

## ROM Ingestion CLI

Interactive command-line tool for ingesting ROMs.

```bash
# Ingest a ROM file
npx tsx examples/ingest-rom.ts /path/to/game.nes

# Demo ROMs (included)
npm run demo:nes      # NES demo
npm run demo:snes     # SNES demo
npm run demo:genesis  # Genesis demo
npm run demo:all      # All demos
```

### Features

- Loads user configuration (or uses defaults)
- Colored terminal output (ANSI)
- Phase-by-phase progress
- Detailed results summary
- File location display

## Example ROM Files

Located in `examples/roms/`:

- `demo-game.nes` - Nintendo Entertainment System (154 bytes)
- `demo-game.sfc` - Super Nintendo (154 bytes)
- `demo-game.md` - Sega Genesis/Mega Drive (154 bytes)
- `demo-game.gba` - Game Boy Advance (154 bytes)
- `demo-game.n64` - Nintendo 64 (154 bytes)
- `demo-game.cue` + `.bin` - CD-ROM with companion files (154 bytes)

**Note**: Demo ROMs are minimal test files, not actual game data.

## Configuration Integration

The ingestion tool uses the configuration system:

1. Loads `user-config.json` via `ConfigLoader`
2. Falls back to default config if missing
3. Creates `PipelineOrchestrator` from config
4. Pipeline uses configured directory paths

See `src/config/README.md` for setup instructions.

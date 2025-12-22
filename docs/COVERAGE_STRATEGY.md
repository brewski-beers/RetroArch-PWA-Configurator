# Test Coverage Strategy

## Overview

This document defines our **per-module coverage targets** for the RetroArch PWA Configurator project. Coverage expectations are **segmented by module type** to balance code quality with practical testability constraints.

**Philosophy**: Quality over quantity - 100% coverage where it matters most (business logic), realistic targets elsewhere (infrastructure, CLI tools).

## Coverage Tiers

### Tier 1: Core Pipeline (100% Coverage) 🔴 CRITICAL

**Pattern**: `src/pipeline/**/*.ts`

**Modules**:

- `classifier.ts` - ROM classification logic
- `normalizer.ts` - File normalization
- `validator.ts` - Validation rules
- `archiver.ts` - Archive management
- `promoter.ts` - ROM promotion
- `pipeline-orchestrator.ts` - Orchestration logic

**Rationale**: Business-critical ROM ingestion logic. Must be 100% tested with no exceptions.

**Thresholds**:

- Lines: **100%**
- Functions: **100%**
- Branches: **95%** (edge cases acceptable)
- Statements: **100%**

**Enforcement**: ✅ **Enabled** (via POL-002)

---

### Tier 2: Configuration System (100% Coverage) 🔴 CRITICAL

**Pattern**: `src/config/config-{templates,validator,loader}.ts`

**Modules**:

- `config-templates.ts` - Configuration templates
- `config-validator.ts` - Configuration validation
- `config-loader.ts` - Configuration loading

**Rationale**: Core configuration logic with no I/O dependencies. Fully testable, no excuses.

**Thresholds**:

- Lines: **100%**
- Functions: **100%**
- Branches: **95%**
- Statements: **100%**

**Enforcement**: ✅ **Enabled** (via POL-002)

---

### Tier 3: UI Layer (95% Coverage) 🟡 HIGH PRIORITY

**Pattern**: `src/ui/**/*.ts` (future PWA implementation)

**Modules**:

- Page generators
- Component builders
- State management

**Rationale**: DOM manipulation can have edge cases. 95%+ acceptable for UI logic.

**Thresholds**:

- Lines: **95%**
- Functions: **100%**
- Branches: **90%**
- Statements: **95%**

**Enforcement**: ⏸️ **Not Yet Implemented** (Future Phase)

---

### Tier 4: Infrastructure (85% Coverage) 🟢 MEDIUM PRIORITY

**Pattern**: `src/server.ts`

**Modules**:

- Express server setup
- Route registration
- Signal handlers (SIGINT, SIGTERM)
- Error handling middleware

**Rationale**: Server startup and signal handlers are hard to test in unit tests. 85%+ acceptable with integration testing.

**Thresholds**:

- Lines: **85%**
- Functions: **90%**
- Branches: **80%**
- Statements: **85%**

**Enforcement**: ✅ **Enabled** (via POL-002)

---

### Tier 5: Interactive CLI Tools (60% Coverage) 🟢 LOW PRIORITY

**Pattern**: `src/config/config-wizard.ts`

**Modules**:

- Interactive prompts (readline)
- User input handling
- Terminal output

**Rationale**: Readline interfaces are not easily testable. Logic extraction required. 60%+ acceptable.

**Thresholds**:

- Lines: **60%**
- Functions: **70%**
- Branches: **50%**
- Statements: **60%**

**Enforcement**: ✅ **Enabled** (via POL-002)

---

### Tier 6: Entry Points (0% Coverage) ⚪ EXCLUDED

**Pattern**: `src/**/index.ts`, `config/**/*.config.ts`

**Modules**:

- Barrel files (`index.ts`)
- Configuration files (`*.config.ts`)

**Rationale**: Just exports, no logic. Schema validated by TypeScript. 0% coverage acceptable.

**Thresholds**:

- Lines: **0%**
- Functions: **0%**
- Branches: **0%**
- Statements: **0%**

**Enforcement**: ❌ **Explicitly Excluded**

---

## Overall Project Targets (POL-002)

**Current (Phase B/C - Temporary)**:

- Lines: **70%** ⚠️
- Functions: **80%** ⚠️
- Branches: **70%** ⚠️
- Statements: **70%** ⚠️

**Target (Phase D - After Full Implementation)**:

- Lines: **95%** ✅
- Functions: **100%** ✅
- Branches: **85%** ✅
- Statements: **95%** ✅

---

## Implementation Status

### Phase B/C (Current - TEMPORARY)

**Status**: ⚠️ **Thresholds Lowered**

**Rationale**: Phase B & C implemented interfaces and pipeline skeleton without full business logic. Lowered to 70%/80% to allow PR merge.

**Next Steps**: Restore to 95%/100% after Phase D implementation.

### Phase D (Target - FULL IMPLEMENTATION)

**Status**: 🎯 **Planned**

**Goal**: Implement full pipeline business logic with TDD approach.

**Expected Result**:

- Tier 1 (Pipeline): 100% coverage
- Tier 2 (Config): 100% coverage
- Overall: 95%+ lines, 100% functions

---

## Per-Module Enforcement (Future)

Currently, overall thresholds are enforced globally. In the future, we will enable **per-file thresholds** in `vitest.config.ts`:

```typescript
// vitest.config.ts (Future - Phase D)
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        // Per-file thresholds
        'src/pipeline/**/*.ts': {
          lines: 100,
          functions: 100,
          branches: 95,
          statements: 100,
        },
        'src/config/config-{templates,validator,loader}.ts': {
          lines: 100,
          functions: 100,
          branches: 95,
          statements: 100,
        },
        'src/server.ts': {
          lines: 85,
          functions: 90,
          branches: 80,
          statements: 85,
        },
        // ... etc
      },
    },
  },
});
```

**Reference**: Vitest supports `perFile: true` and individual file thresholds via glob patterns.

---

## Coverage Philosophy

### Why 100% for Core Logic?

- **Business-critical code** must be bulletproof
- **Zero tolerance** for untested code paths in pipeline
- **TDD approach** makes 100% achievable without friction

### Why Not 100% Everywhere?

- **Infrastructure code** (server startup, signal handlers) is hard to unit test
- **CLI interfaces** (readline) require integration tests, not unit tests
- **Diminishing returns** - 95% → 100% often tests trivial code (getters, setters)
- **Focus effort** where it matters most (business logic)

### Realistic vs. Aspirational

| Module Type  | Realistic | Aspirational | Reason                       |
| ------------ | --------- | ------------ | ---------------------------- |
| Pipeline     | 100%      | 100%         | Pure logic, no I/O           |
| Config       | 100%      | 100%         | Pure logic, no I/O           |
| Server       | 85%       | 90%          | Signal handlers hard to test |
| CLI Tools    | 60%       | 75%          | Readline interface           |
| Entry Points | 0%        | 0%           | No logic, just exports       |

---

## Testing Strategy

### TDD (Test-Driven Development)

**Approach**: Red → Green → Refactor

1. **Red**: Write failing test first
2. **Green**: Implement minimum code to pass
3. **Refactor**: Clean up with tests as safety net

**Policy**: POL-009 - TDD Approach (high severity)

### Test Factories (DRY Principle)

**Use factories** for all test data creation:

```typescript
import { PageConfigFactory, ComponentFactory } from '../factories/';

// ✅ Good - Use factory
const config = PageConfigFactory.create()
  .withHeader('Test Header')
  .build();

// ❌ Bad - Magic values
const config = { id: 'test', name: 'Test', ... };
```

**Policy**: TEST-001 - Factory Usage (high severity)

---

## Validation & Enforcement

### Current Enforcement

1. **Overall Thresholds**: Vitest enforces 70%/80% globally (temporary)
2. **Policy Checker**: Validates coverage meets POL-002 requirements
3. **CI/CD Pipeline**: Blocks PRs if coverage drops below threshold
4. **Pre-Commit Hooks**: Fast-fail architecture (format → lint → type → build)

### Future Enforcement (Phase D)

1. **Per-Module Thresholds**: Vitest enforces tier-specific targets
2. **Module Coverage Report**: Policy checker shows per-tier compliance
3. **Coverage Ratcheting**: Increase thresholds as modules mature
4. **Branch Protection**: GitHub Actions enforces all checks

---

## References

- **POL-002**: Test Coverage Thresholds (high severity)
- **TEST-001**: Factory Usage (high severity)
- **POL-009**: TDD Approach (high severity)
- **vitest.config.ts**: Coverage configuration
- **src/policy-checker.ts**: Policy enforcement implementation
- **config/policy.config.ts**: Module coverage targets definition

---

## Maintenance

**Last Updated**: 2024 (Policy Expansion - Phase 1)

**Review Cadence**: After each major phase (D, E, F)

**Threshold Adjustments**: Require team discussion and PR with rationale

**Questions?**: See `.github/copilot-instructions.md` or open issue

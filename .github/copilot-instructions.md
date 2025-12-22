# GitHub Copilot Instructions for RetroArch PWA Configurator

## Project Overview

**This is NOT the RetroArch platform**. This is a **Progressive Web App** that helps users configure and manage RetroArch server setups.

- **Project Name**: RetroArch PWA Configurator
- **Brand**: TechByBrewski
- **Purpose**: Web-based configuration tool for RetroArch servers
- **Tech Stack**: TypeScript 5.3, Vitest 1.0, Playwright 1.40, Node.js 20.x

## Architecture Principles

### SOLID Principles (MANDATORY)

Every piece of code MUST follow SOLID principles:

1. **Single Responsibility Principle (SRP)**
   - Each class/module/function has ONE clear purpose
   - Example: `PageGenerator` only generates HTML from config
   - Example: `PolicyChecker` only validates policy compliance

2. **Open/Closed Principle (OCP)**
   - Code is open for extension, closed for modification
   - Use configuration files to add behavior without changing code
   - Example: Add new pages via `pages.config.ts`, not by modifying generator

3. **Liskov Substitution Principle (LSP)**
   - Subtypes must be substitutable for base types
   - Interface implementations must honor contracts

4. **Interface Segregation Principle (ISP)**
   - Keep interfaces small and focused
   - Don't force clients to depend on methods they don't use

5. **Dependency Inversion Principle (DIP)**
   - Depend on abstractions, not concretions
   - Use interfaces and dependency injection

### Config-as-Infrastructure

ALL behavior is defined in configuration files:

- **Pages**: Defined in `config/pages.config.ts`
- **Policies**: Defined in `config/policy.config.ts`
- **Tests**: Auto-generated from configurations

**Never hardcode**:

- Page structures (use `pages.config.ts`)
- Policy rules (use `policy.config.ts`)
- Test cases (generate from config)

### Policy-as-Code (CRITICAL)

**This project uses a UNIFIED three-tier policy system following SOLID principles.**

#### Policy Architecture

```
base-policy.config.ts (DIP: Dependency Inversion Principle)
├── policy.config.ts (Application Policies: POL-001 to POL-013)
├── tests/config/test-policy.config.ts (Testing Policies: TEST-001 to TEST-006)
└── e2e/config/e2e-policy.config.ts (E2E Policies: E2E-001 to E2E-006)
    └── unified-policy.config.ts (SRP: Policy Aggregator)
```

**ALL architectural decisions MUST reference a policy rule by ID.**

#### Application Policies (POL-\*)

Enforced in `config/policy.config.ts`:

- **POL-001**: TypeScript Strict Mode (critical) - All TypeScript files must use strict mode
- **POL-002**: Test Coverage Thresholds (high) - Overall project coverage: 95% lines, 100% functions, 85% branches, 95% statement...
- **POL-003**: SOLID Principles (high) - Code must follow SOLID design principles
- **POL-004**: Test ID Attributes (high) - All UI components must have data-testid attributes for Vitest and Playwright tes...
- **POL-005**: ESLint Code Quality (high) - All code must pass ESLint with zero errors
- **POL-006**: Prettier Code Formatting (high) - All code must be formatted with Prettier
- **POL-007**: Pre-Commit Hooks (medium) - All commits must pass format and lint checks via Git hooks (husky)
- **POL-008**: Git Workflow (medium) - Conventional commit messages, branch naming conventions, and PR requirements enf...
- **POL-009**: TDD Approach (high) - Test-Driven Development required for all new features
- **POL-010**: Secrets Management (critical) - No hardcoded secrets, API keys, or credentials in code
- **POL-011**: Dependency Security Audit (high) - All dependencies must pass npm audit with zero high/critical vulnerabilities
- **POL-012**: CORS Configuration (medium) - CORS must be explicitly configured with allowlist, not wildcard (\*)
- **POL-013**: Input Validation (high) - All user inputs must be validated and sanitized

#### Testing Policies (TEST-\*)

Enforced in `tests/config/test-policy.config.ts`:

- **TEST-001**: Test Factory Usage (high) - All tests must use factories for test data creation (DRY principle)
- **TEST-002**: Single Responsibility (high) - Each test must test one specific behavior (SRP)
- **TEST-003**: Type Safety (critical) - All test data must be properly typed (no any types)
- **TEST-004**: Arrange-Act-Assert (medium) - Tests must follow AAA pattern for clarity
- **TEST-005**: No Magic Values (high) - Use factory methods instead of inline test data
- **TEST-006**: Descriptive Test Names (medium) - Test names must clearly describe the behavior being tested

#### E2E Policies (E2E-\*)

Enforced in `e2e/config/e2e-policy.config.ts`:

- **E2E-001**: Use Test IDs (critical) - Prefer data-testid for component testing
- **E2E-002**: Page Object Pattern (medium) - Use page objects for complex interactions (SRP)
- **E2E-003**: Auto-Generated Tests (high) - Generate smoke tests from configuration (DRY)
- **E2E-004**: Semantic HTML Validation (medium) - Verify proper HTML5 semantic structure
- **E2E-005**: Accessibility Compliance (high) - Test for basic accessibility requirements
- **E2E-006**: Configuration-Driven (high) - E2E tests must derive from application configuration

#### Using the Unified Policy System

```typescript
import { UnifiedPolicySystem } from './config/unified-policy.config.js';

// Query all policies
const allRules = UnifiedPolicySystem.getAllRules(); // 25 rules total

// Get critical rules only
const critical = UnifiedPolicySystem.getCriticalRules();

// Get rules by category
const testingRules = UnifiedPolicySystem.getRulesByCategory('testing');

// Validate system integrity
const validation = UnifiedPolicySystem.validateAllRules();
if (!validation.isValid) {
  console.error('Policy violations:', validation.errors);
}
```

#### Adding a New Policy Rule

1. **Choose the correct policy file**:
   - Application behavior → `config/policy.config.ts`
   - Unit testing standards → `tests/config/test-policy.config.ts`
   - E2E testing standards → `e2e/config/e2e-policy.config.ts`

2. **Follow the base interface** (from `base-policy.config.ts`):

```typescript
{
  id: 'POL-010',  // POL-* | TEST-* | E2E-*
  name: 'Clear Rule Name',
  description: 'Detailed explanation of what this rule enforces',
  enabled: true,
  severity: 'high',  // critical | high | medium | low
  category: 'application'  // application | testing | e2e
}
```

3. **Implement enforcement** in the appropriate checker/validator

4. **Regenerate documentation**: `npm run policy:docs`

5. **Verify with audit**: `npm run policy:check` or review `POLICY_AUDIT.md`

**NEVER**:

- Add redundant rules across policy files
- Change base interface without updating all three policy files
- Create policies without implementation enforcement
- Skip severity classification
- Manually edit policy documentation (use generator!)

**See `POLICY_AUDIT.md` for complete alignment matrix and SOLID compliance details.**

## TypeScript Strict Mode (MANDATORY)

**ALL code MUST pass TypeScript strict mode with ZERO errors.**

Required compiler options (already configured):

```typescript
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "allowUnusedLabels": false,
  "allowUnreachableCode": false,
  "exactOptionalPropertyTypes": true
}
```

### Type Safety Rules

1. **No `any` types** - Use proper types or `unknown`
2. **No type assertions** unless absolutely necessary (prefer type guards)
3. **Explicit return types** for all public functions
4. **Strict null checks** - Handle `undefined` and `null` explicitly
5. **Array access** - Always check bounds (enabled via `noUncheckedIndexedAccess`)
6. **Object access** - Use bracket notation for dynamic keys (enabled via `noPropertyAccessFromIndexSignature`)

## ESLint Code Quality (MANDATORY)

**ALL code MUST pass ESLint with ZERO errors.**

### ESLint Configuration

The project uses ESLint with TypeScript support to enforce:

- **Type Safety**: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/strict-boolean-expressions`
- **Naming Conventions**: camelCase for functions/variables, PascalCase for classes/types
- **Magic Numbers**: Constants required (except 0, 1, -1, 200, 404, 3000)
- **Code Quality**: `no-console` (warnings), `prefer-const`, `eqeqeq`, `curly`

### Running ESLint

```bash
# Check for linting errors
npm run lint

# Auto-fix issues where possible
npm run lint:fix

# Integrated into CI pipeline
npm run ci:verify  # Runs lint first
```

### ESLint Rules Relaxed for Tests

Test files (`**/*.test.ts`, `**/*.spec.ts`) have relaxed rules:

- Magic numbers allowed
- `any` types allowed (warnings only)
- Unsafe operations allowed (for mocking)

### ESLint Rules Relaxed for Configs

Config files (`**/*.config.ts`) have relaxed rules:

- Naming conventions not enforced
- Magic numbers allowed
- Boolean expressions relaxed

**NEVER**:

- Disable ESLint rules without justification
- Use `// eslint-disable` without corresponding `// eslint-enable`
- Ignore ESLint errors - fix them or get approval first

## Prettier Code Formatting (MANDATORY)

**ALL code MUST be formatted with Prettier for consistent style across all systems.**

### Prettier Configuration

The project uses Prettier integrated with ESLint to enforce:

- **Semicolons**: Required (`;`)
- **Quotes**: Single quotes (`'`)
- **Line Width**: 80 characters
- **Indentation**: 2 spaces (no tabs)
- **Trailing Commas**: ES5-compatible
- **Line Endings**: LF (Unix-style)
- **Arrow Parens**: Always wrap parameters

### Running Prettier

```bash
# Format all code
npm run format

# Check formatting without changes
npm run format:check

# Integrated into CI pipeline
npm run ci:verify  # Runs format:check first
```

### Prettier Integration with ESLint

Prettier runs as an ESLint plugin (`eslint-plugin-prettier`):

- Formatting violations appear as ESLint errors
- `npm run lint:fix` auto-formats code
- `eslint-config-prettier` disables conflicting ESLint rules

### Files Formatted by Prettier

- TypeScript: `**/*.ts`
- JSON: `**/*.json`
- Markdown: `**/*.md`

**NEVER**:

- Commit unformatted code
- Disable Prettier for entire files (use `// prettier-ignore` for specific lines only)
- Override Prettier config without team discussion

## Code Style Guidelines

### Naming Conventions

```typescript
// Classes: PascalCase
class PageGenerator {}
class PolicyChecker {}

// Interfaces: PascalCase with descriptive names
interface PageConfig {}
interface PolicyRule {}

// Functions/Methods: camelCase with verb prefixes
function generatePage() {}
function checkPolicy() {}

// Constants: camelCase for config objects, UPPER_SNAKE_CASE for primitives
export const pagesConfig = [...];
export const MAX_RETRIES = 3;

// Files: kebab-case
// page-generator.ts, policy-checker.ts, pages.config.ts
```

### File Organization

```
src/
  ├── [feature]/          # Group by feature/domain
  │   ├── [feature].ts    # Main implementation
  │   └── [feature].test.ts # Co-located tests
  └── index.ts            # Public API exports

config/
  ├── [domain].config.ts  # Configuration files

e2e/tests/
  ├── smoke.spec.ts       # Auto-generated smoke tests
  └── acceptance.spec.ts  # Happy path tests
```

### Comments and Documentation

```typescript
/**
 * Multi-line JSDoc for public APIs
 * Explain what, not how
 * Include @param and @returns tags
 */
export function publicFunction(param: string): void {
  // Single-line comments for complex logic
  const result = complexOperation();

  // Explain WHY, not WHAT
  // We cache here because API calls are expensive
}
```

## Testing Requirements

### Development Workflow (CRITICAL)

**TL;DR - Quick Start for Development:**

```bash
# Start development with hot reload (recommended)
npm run dev:server

# Make changes to TypeScript files - server restarts automatically
# Refresh browser to see changes instantly!

# Before committing, run full verification
npm run ci:verify
```

### Development Mode Options

**Option 1: `npm run dev:server` (RECOMMENDED for active development)**

- Uses `tsx watch` to run TypeScript directly
- Fastest iteration cycle (~instant restart)
- No compilation step
- Perfect for rapid prototyping
- **Use this for daily development work**

**Option 2: `npm run dev` (for type-safe development)**

- Runs `tsc --watch` + `nodemon`
- Catches type errors during development
- Slightly slower but provides compile-time safety
- Watches `dist/` and restarts on changes
- **Use this when you want continuous type checking**

**Option 3: `npm run serve` (production mode)**

- Requires manual `npm run build` first
- No hot reload, no watch mode
- **Only use for testing production builds**

### Recommended Terminal Setup

**Terminal 1: Dev Server**

```bash
npm run dev:server          # Keep this running
```

**Terminal 2: Unit Tests (Optional)**

```bash
npm run test:watch          # Watch mode for tests
```

**Terminal 3: Commands**

```bash
# Use for git, npm, one-off commands
npm run ci:verify           # Before committing
```

### Test Execution Order (CRITICAL)

**ALWAYS run in this order**:

1. `npm run format:check` - Code formatting validation (fast fail ~5s)
2. `npm run lint` - ESLint validation (fast fail ~10s)
3. `npm run type-check` - Type validation (fast fail ~10s)
4. `npm run build` - Compilation (fast fail ~15s)
5. `npm run policy:check` - Policy compliance (requires build!)
6. `npm run test:coverage` - Unit tests with coverage (~10s)
7. `npm run test:e2e` - E2E tests (~30-60s)

**NEVER run `policy:check` before `build`** - it requires compiled JS files!

### Test Coverage Expectations

- **Unit Tests**: Vitest for all business logic
  - **Coverage Thresholds**: 95% lines, 100% functions, 85% branches, 95% statements (POL-002)
  - **Test Factories**: MUST use factories from `tests/factories/` (TEST-001)
  - **Factory Pattern**: PageConfigFactory, ComponentFactory for all test fixtures
  - **No Magic Values**: Use factories and constants (TEST-005)
- **E2E Tests**: Playwright for user flows
  - **Test ID Selectors**: Always use `getByTestId()`, never CSS selectors (E2E-001)
  - **Page Object Pattern**: Encapsulate page interactions (E2E-002)
- **Auto-Generated Tests**: From configuration files (E2E-003)
- **Minimum Coverage**: 95%+ lines, 100% functions per POL-002

### Test Factory Pattern (TEST-001)

**ALWAYS use test factories for test data creation.**

```typescript
// ✅ CORRECT - Use factory
import {
  PageConfigFactory,
  ComponentFactory,
} from '../factories/page-config.factory.js';

describe('PageGenerator', () => {
  it('should generate header with testId', () => {
    // Arrange
    const config = PageConfigFactory.create().withHeader('Test Header').build();

    // Act
    const html = generator.generatePage(config);

    // Assert
    expect(html).toContain('data-testid="test-page-header"');
  });
});

// ❌ WRONG - Magic values
describe('PageGenerator', () => {
  it('should generate header', () => {
    const config = {
      id: 'test', // Magic value
      name: 'Test',
      route: '/test',
      title: 'Test',
      description: 'Test',
      components: [{ type: 'header', id: 'h1', content: 'Test' }], // Magic object
    };
    // ...
  });
});
```

**Available Factories**:

- `PageConfigFactory.create()` - Creates PageConfig with defaults
- `ComponentFactory.createHeader()` - Creates header component
- `ComponentFactory.createContent()` - Creates content component
- `ComponentFactory.createFooter()` - Creates footer component

**Factory Benefits**:

- DRY: Single source of truth for test data
- Type Safety: Full TypeScript inference
- Consistency: All tests use same structure
- Maintainability: Change once, update all tests

### Test File Naming

- Unit tests: `*.test.ts` (in `tests/` directory)
- E2E tests: `*.spec.ts` (in `e2e/tests/` directory)
- Separation prevents Vitest/Playwright global API conflicts

## Git Workflow

### Pre-Commit Hooks (MANDATORY)

**All commits are automatically validated with Git hooks (husky):**

```bash
# When you commit, pre-commit hook automatically runs:
git add .
git commit -m "feat: your changes"

# Hook executes:
# 1. npm run format:check (Prettier - ~3-5s)
# 2. npm run lint (ESLint - ~5-10s)
#
# If either fails, commit is BLOCKED with error message

# To bypass (ONLY for emergencies):
git commit --no-verify -m "emergency fix"  # NOT RECOMMENDED
```

**Benefits of Pre-Commit Hooks**:

- ✅ **Fast Fail**: Catches issues in seconds, not minutes waiting for CI
- ✅ **Quality Gate**: Prevents unformatted/linted code from entering repo
- ✅ **CI Efficiency**: Reduces CI failures from trivial issues by ~80%
- ✅ **Developer Experience**: Immediate feedback loop

**Manual Commands**:

```bash
# Auto-fix before committing
npm run format        # Fix Prettier formatting
npm run lint:fix      # Fix ESLint issues

# Check without fixing
npm run format:check  # Check Prettier
npm run lint          # Check ESLint
```

### Commit Messages

```bash
# Format: <type>: <subject>

feat: Add new page configuration system
fix: Resolve policy checker import path
docs: Update README with new branding
test: Add acceptance tests for landing page
refactor: Extract page generation logic
chore: Update dependencies
```

### Branch Naming

```bash
feature/page-generator
fix/policy-check-order
docs/readme-update
test/acceptance-suite
```

### Pull Request Requirements

**ALL PRs MUST**:

1. Pass format check (Prettier)
2. Pass lint check (ESLint)
3. Pass type check
4. Build successfully
5. Pass policy compliance
6. Pass unit tests
7. Pass E2E tests

Branch protection enforces these checks automatically via GitHub Actions.

**CI Pipeline Order** (fast-fail architecture):

```
format-and-lint (3 min)
    ↓
type-check-and-build (5 min)
    ↓
┌────────────────┬───────────────┬──────────────┐
│  unit-tests    │  policy-check │  e2e-tests   │
│  (5 min)       │  (3 min)      │  (10 min)    │
└────────────────┴───────────────┴──────────────┘
    ↓
all-checks-passed ✅
```

## CI/CD Optimizations

### Fast-Fail Architecture

The CI pipeline is optimized for **fast failure** to save time and resources:

**Stage 1: Format & Lint (3 min)** - Runs FIRST, fails fast

- Prettier format check
- ESLint code quality
- No build required
- Fastest feedback loop

**Stage 2: Type Check & Build (5 min)** - Only if Stage 1 passes

- TypeScript type checking
- Compilation
- Artifact upload

**Stage 3: Parallel Tests (10 min)** - Only if Stage 2 passes

- Unit tests (5 min)
- Policy compliance (3 min)
- E2E tests (10 min)

**Why This Matters**: If formatting is wrong, we fail in 3 minutes instead of waiting 15+ minutes for full pipeline.

### Path Filtering

Workflow only runs on changes to:

- `src/**`
- `config/**`
- `e2e/**`
- `tests/**`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `*.config.ts`
- `.github/workflows/**`

**Documentation-only changes DO NOT trigger CI**.

### Caching Strategy

The pipeline caches:

- `node_modules` (saves ~30-60s)
- TypeScript build output (saves ~15-30s)
- Playwright browsers (saves ~60-120s)

**Expected performance**:

- Cold cache: ~3-5 minutes
- Warm cache: ~1-2 minutes

## Common Patterns

### Test ID (data-testid) Enforcement (CRITICAL)

**All UI components MUST have `data-testid` attributes for Vitest and Playwright testing.**

**Policy**: POL-004 - Test ID Attributes

- **Severity**: High
- **Enforcement**: Automatic via policy checker
- **Purpose**: Enables reliable test selectors using `getByTestId()`

**Naming Convention for testId**:

```typescript
// Pattern: <page-id>-<component-type>
testId: 'landing-header'; // ✅ Good
testId: 'landing-content'; // ✅ Good
testId: 'settings-footer'; // ✅ Good

testId: 'header'; // ❌ Bad - not unique across pages
testId: 'main-header'; // ⚠️  Okay - but page context is better
```

**Usage in Tests**:

**Playwright (E2E)**:

```typescript
// ✅ ALWAYS use getByTestId
const header = page.getByTestId('landing-header');
await expect(header).toBeVisible();

// ❌ NEVER use CSS selectors for component testing
const header = page.locator('header h1'); // Fragile!
```

**Vitest (Unit)**:

```typescript
import { render, screen } from '@testing-library/react';

// ✅ ALWAYS use getByTestId
const header = screen.getByTestId('landing-header');
expect(header).toBeInTheDocument();
```

**Why This Matters**:

- ✅ Tests don't break when CSS/structure changes
- ✅ Clear test intent (testing behavior, not implementation)
- ✅ Faster test execution (direct DOM queries)
- ✅ Better maintainability (consistent selector strategy)
- ✅ Policy-enforced (POL-004 catches missing testIds)

### Adding a New Page

1. Update `config/pages.config.ts`:

```typescript
export const pagesConfig: PageConfig[] = [
  // ... existing pages
  {
    id: 'new-page',
    name: 'New Page Name',
    route: '/new-route',
    title: 'Page Title | TechByBrewski',
    description: 'Page description',
    components: [
      {
        type: 'header',
        id: 'header-id',
        testId: 'new-page-header', // REQUIRED: data-testid for testing
        content: 'Header Text',
      },
      {
        type: 'content',
        id: 'content-id',
        testId: 'new-page-content', // REQUIRED: data-testid for testing
        content: 'Content Text',
      },
      {
        type: 'footer',
        id: 'footer-id',
        testId: 'new-page-footer', // REQUIRED: data-testid for testing
        content: '© 2024 TechByBrewski',
      },
    ],
  },
];
```

2. Tests are **automatically generated** from config
3. Page is **automatically served** at the specified route
4. **POL-004** automatically validates all components have `testId` attributes

### Adding a New Policy Rule

1. **Choose the correct policy file**:
   - Application behavior → `config/policy.config.ts` (POL-\*)
   - Unit testing standards → `tests/config/test-policy.config.ts` (TEST-\*)
   - E2E testing standards → `e2e/config/e2e-policy.config.ts` (E2E-\*)

2. **Add rule following base interface**:

```typescript
{
  id: 'POL-005',  // Use POL-*, TEST-*, or E2E-* prefix
  name: 'New Policy Rule',
  description: 'Description of the policy',
  enabled: true,
  severity: 'high',  // critical | high | medium | low
  category: 'application'  // application | testing | e2e
}
```

3. **Implement check in appropriate validator**:

- Application policies → `src/policy-checker.ts`
- Testing policies → Test configuration enforcement
- E2E policies → Playwright test setup

```typescript
// Example for application policy
checkNewPolicy(): { passed: boolean; message: string } {
  // Implementation
}

async runAllChecks(): Promise<...> {
  // Add new check to results
  const newPolicyCheck = this.checkNewPolicy();
  results.push({
    rule: 'POL-004: New Policy Rule',
    ...newPolicyCheck
  });
}
```

### Creating a New Module

```typescript
/**
 * Module Name
 * Single responsibility description
 * Follows SRP - one clear purpose
 */

import { RequiredTypes } from './types.js';

export class ModuleName {
  // Private members for encapsulation
  private readonly dependency: DependencyType;

  constructor(dependency: DependencyType) {
    this.dependency = dependency;
  }

  /**
   * Public method with clear purpose
   */
  publicMethod(input: InputType): OutputType {
    // Implementation
    return result;
  }

  /**
   * Private helper method
   */
  private helperMethod(): void {
    // Implementation
  }
}
```

## Troubleshooting

### Build Fails

```bash
# Check TypeScript errors first
npm run type-check

# Clear cache and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### Policy Check Fails

```bash
# Ensure build ran first!
npm run build
npm run policy:check

# Check specific policy violations in output
```

### E2E Tests Fail

```bash
# Reinstall Playwright browsers
npx playwright install chromium --with-deps

# Run tests with UI for debugging
npx playwright test --ui

# Check if server is running
npm run serve &
curl http://localhost:3000
```

### CI/CD Pipeline Slow

- Check if caches are working (look for "cache hit" in logs)
- Verify path filtering is excluding unnecessary files
- Confirm concurrency settings are canceling old runs

## Anti-Patterns to Avoid

❌ **DO NOT**:

- Use `any` type (violates TEST-003)
- Hardcode page structures in generator code
- Skip type checking before committing
- Run `policy:check` before `build`
- Modify generated files directly
- Add business logic to config files
- Create god classes (violates SRP)
- Use global state
- Bypass strict mode rules with type assertions
- Commit without running `npm run ci:verify`
- Use magic values in tests (violates TEST-005)
- Use CSS selectors in E2E tests (violates E2E-001)
- Create test data inline (violates TEST-001)

✅ **DO**:

- Use proper TypeScript types
- Define pages in `pages.config.ts`
- Run full CI pipeline locally before pushing
- Follow the correct test execution order
- Keep classes focused (SRP)
- Use dependency injection
- Write tests for new features
- Cache aggressively in CI/CD
- Document complex logic
- Follow SOLID principles
- Use test factories from `tests/factories/` (TEST-001)
- Use `getByTestId()` in all tests (POL-004, E2E-001)
- Reference policy rules by ID in decisions

## Questions or Issues?

1. Check this file first
2. Review the main README.md
3. Look at existing code for patterns
4. Run `npm run ci:verify` to catch issues locally
5. Open an issue with clear description and reproduction steps

---

## 🎯 Quick Reference for Copilot

### Daily Development Commands

```bash
# TL;DR - Start here every time
npm run dev:server              # Fast dev with hot reload (RECOMMENDED)

# Alternative dev modes
npm run dev                     # Type-safe dev (tsc watch + nodemon)
npm run test:watch              # Unit tests in watch mode

# Before committing
npm run ci:verify               # Full pipeline validation
```

### Development Workflow Cheat Sheet

**For Active Development:**

1. `npm run dev:server` → Keep running
2. Edit `src/**/*.ts` → Auto-restart
3. Refresh browser → See changes
4. `npm run ci:verify` → Before commit

**For Type-Safe Development:**

1. `npm run dev` → Keep running
2. Edit TypeScript → Compiles + restarts
3. Fix type errors as they appear
4. `npm run ci:verify` → Before commit

**For Production Testing:**

1. `npm run build` → Compile once
2. `npm run serve` → Start server
3. Test manually
4. `npm run ci:verify` → Before commit

### All Available Commands

| Command                | Description                   | When to Use        |
| ---------------------- | ----------------------------- | ------------------ |
| `npm run dev:server`   | Fast dev (tsx watch)          | 🚀 Daily work      |
| `npm run dev`          | Type-safe dev (tsc + nodemon) | 🛡️ Type checking   |
| `npm run build`        | Compile TypeScript            | 📦 Production/CI   |
| `npm run serve`        | Production server             | 🌐 Testing build   |
| `npm run format`       | Format all code               | ✨ Fix formatting  |
| `npm run format:check` | Check formatting              | ✅ CI validation   |
| `npm run lint`         | Check code quality            | 🔍 Linting         |
| `npm run lint:fix`     | Auto-fix lint issues          | 🔧 Quick fixes     |
| `npm run type-check`   | Validate types                | ✅ Quick check     |
| `npm run policy:check` | Policy compliance             | 🔒 After build     |
| `npm test`             | Unit tests once               | 🧪 CI              |
| `npm run test:watch`   | Unit tests watch              | 🔄 Development     |
| `npm run test:e2e`     | E2E tests                     | 🌐 Browser testing |
| `npm run ci:verify`    | Full pipeline                 | ✅ Pre-commit      |

### Common Scenarios

**Starting a New Feature:**

```bash
git checkout -b feature/new-feature
npm run dev:server                # Start dev mode
# Make changes...
npm run ci:verify                 # Validate before commit
git commit -m "feat: new feature"
```

**Fixing a Bug:**

```bash
npm run dev:server                # Start dev mode
# Make fix...
npm run test:watch                # Ensure tests pass
npm run ci:verify                 # Full validation
```

**Adding a New Page:**

```bash
# 1. Edit config/pages.config.ts (add page definition)
# 2. Tests auto-generate from config
# 3. Verify with: npm run ci:verify
```

**Adding a Policy Rule:**

```bash
# 1. Choose correct file: config/policy.config.ts, tests/config/test-policy.config.ts, or e2e/config/e2e-policy.config.ts
# 2. Add rule following BasePolicyRule interface
# 3. Implement enforcement in appropriate checker
# 4. Build: npm run build
# 5. Verify: npm run policy:check
```

### Troubleshooting Quick Fixes

**Module errors on start:**

```bash
npm run build                     # Must build first for production
npm run serve                     # Then start
```

**Type errors:**

```bash
npm run type-check                # See all errors
# Fix errors in TypeScript files
```

**Tests failing:**

```bash
npm run test:watch                # Debug unit tests
npm run test:e2e                  # Debug E2E tests
```

**CI failing:**

```bash
npm run ci:verify                 # Run locally to reproduce
```

---

**Remember**: This is a configuration tool for RetroArch servers, NOT the RetroArch platform itself. Always clarify this in user-facing documentation and UI.

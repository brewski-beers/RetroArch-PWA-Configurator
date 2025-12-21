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

### Policy-as-Code

Compliance rules live in version control:

- All validation rules in `config/policy.config.ts`
- Auditable, reviewable, enforceable
- Run policy check after build: `npm run build && npm run policy:check`

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

### Test Execution Order (CRITICAL)

**ALWAYS run in this order**:

1. `npm run type-check` - Type validation (fast fail ~10s)
2. `npm run build` - Compilation (fast fail ~15s)
3. `npm run policy:check` - Policy compliance (requires build!)
4. `npm test` - Unit tests (~10s)
5. `npm run test:e2e` - E2E tests (~30-60s)

**NEVER run `policy:check` before `build`** - it requires compiled JS files!

### Test Coverage Expectations

- **Unit Tests**: Vitest for all business logic
- **E2E Tests**: Playwright for user flows
- **Auto-Generated Tests**: From configuration files
- **Minimum Coverage**: Not enforced yet, but write tests for new code

### Test File Naming

- Unit tests: `*.test.ts` (in `tests/` directory)
- E2E tests: `*.spec.ts` (in `e2e/tests/` directory)
- Separation prevents Vitest/Playwright global API conflicts

## Git Workflow

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
1. Pass type check
2. Build successfully
3. Pass policy compliance
4. Pass unit tests
5. Pass E2E tests

Branch protection enforces these checks automatically.

## CI/CD Optimizations

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
      { type: 'header', id: 'header-id', content: 'Header Text' },
      { type: 'content', id: 'content-id', content: 'Content Text' },
      { type: 'footer', id: 'footer-id', content: '© 2024 TechByBrewski' }
    ]
  }
];
```

2. Tests are **automatically generated** from config
3. Page is **automatically served** at the specified route

### Adding a New Policy Rule

1. Update `config/policy.config.ts`:
```typescript
rules: [
  // ... existing rules
  {
    id: 'POL-004',
    name: 'New Policy Rule',
    description: 'Description of the policy',
    enabled: true,
    severity: 'high' // 'critical' | 'high' | 'medium' | 'low'
  }
]
```

2. Implement check in `src/policy-checker.ts`:
```typescript
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
- Use `any` type
- Hardcode page structures in generator code
- Skip type checking before committing
- Run `policy:check` before `build`
- Modify generated files directly
- Add business logic to config files
- Create god classes (violates SRP)
- Use global state
- Bypass strict mode rules with type assertions
- Commit without running `npm run ci:verify`

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

## Questions or Issues?

1. Check this file first
2. Review the main README.md
3. Look at existing code for patterns
4. Run `npm run ci:verify` to catch issues locally
5. Open an issue with clear description and reproduction steps

---

**Remember**: This is a configuration tool for RetroArch servers, NOT the RetroArch platform itself. Always clarify this in user-facing documentation and UI.

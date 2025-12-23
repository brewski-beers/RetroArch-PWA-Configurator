# GitHub Copilot Instructions - RetroArch PWA Configurator

> **Project**: PWA configuration tool for RetroArch servers (NOT the RetroArch platform)  
> **Stack**: TypeScript 5.3, Vitest 1.0, Playwright 1.40, Node.js 20.x  
> **Brand**: TechByBrewski

## 🎯 Core Principles

**Principle Hierarchy** (Priority Order):

1. **YAGNI/KISS**: Don't build what you don't need. Simple solutions beat complex ones.
2. **Config-First**: Extend via `config/*.config.ts`, not new code. Direct imports > servers/APIs.
3. **Policy-as-Code**: All decisions reference a policy ID (POL-\*, TEST-\*, E2E-\*)
4. **SOLID**: Apply when building new modules (SRP, OCP, LSP, ISP, DIP)

**When principles conflict, follow the hierarchy above.**

Examples:

- ✅ Direct import from `config/unified-policy.config.ts` (Config-First)
- ❌ Build MCP server to expose same data (violates YAGNI + Config-First)
- ✅ Add new rule to existing config file (OCP + Config-First)
- ❌ Create new service layer when config export works (violates KISS)

## 📋 Policy System (32 Rules)

**Query full details**: Check `config/unified-policy.config.ts` (source of truth)

### Critical Rules (Evaluated in Priority Order)

1. **POL-000**: Policy Enforcement Integrity - Meta-policy ensuring all policies validated 🏛️
2. **POL-018**: YAGNI Principle - Build only what's needed NOW (blocks commit) 🚨
3. **POL-020**: Policy Test Coverage - Every policy must have tests (blocks CI/CD) 📊
4. **POL-001**: TypeScript Strict Mode - Zero `any`, explicit types, strict null checks
5. **POL-003**: Config-First - Extend via config, not code (see YAGNI)
6. **POL-010**: Secrets Management - No hardcoded credentials
7. **POL-017**: Supply Chain Security - npm ci, audit signatures
8. **TEST-003**: Type Safety - Properly typed test data only
9. **E2E-001**: Use Test IDs - `data-testid` attributes required

### Before Adding ANY New Code

**YAGNI Checklist** (POL-018):

```typescript
/**
 * YAGNI Justification: (REQUIRED for new abstractions)
 *
 * 1. Current Problem: [What you're solving NOW, not hypothetically]
 * 2. Why Not Simpler: [Why can't a function/direct-import work?]
 * 3. Rule of Three: [Is this duplicated in 3+ places?]
 * 4. Config-First Tried: [Why can't this be config?]
 */
```

**Examples**:

✅ **YAGNI-Compliant**:

```typescript
// Direct usage (no abstraction)
import { UnifiedPolicySystem } from './config/unified-policy.config.js';
const rules = UnifiedPolicySystem.getAllRules();
```

❌ **YAGNI Violation**:

```typescript
// Unnecessary wrapper (MCP server pattern - DON'T REPLICATE)
export class PolicyService {
  getAllRules() {
    return UnifiedPolicySystem.getAllRules(); // Just forwarding!
  }
}
```

### High Priority Rules

<details>
<summary>Application Policies (POL-000 to POL-020)</summary>

- **POL-000**: Policy Enforcement Integrity - All policies must be enforced
- **POL-001**: TypeScript Strict Mode - Zero `any`, explicit types
- **POL-002**: Test Coverage - 95% lines, 100% functions, 85% branches
- **POL-003**: SOLID Principles - Follow SRP, OCP, LSP, ISP, DIP (after YAGNI!)
- **POL-004**: Test ID Attributes - All components need `data-testid="page-component"`
- **POL-005**: ESLint - Zero errors required
- **POL-006**: Prettier - Enforced formatting
- **POL-007**: Pre-Commit Hooks - YAGNI + format + lint before commit
- **POL-008**: Git Workflow - Conventional commits, branch naming
- **POL-009**: TDD Approach - Tests first for new features
- **POL-011**: Dependency Security - Zero high/critical vulnerabilities
- **POL-018**: YAGNI Principle - Build only what's needed (priority 1)
- **POL-019**: KISS Principle - Simple over complex (priority 2)
- **POL-012**: CORS Config - Explicit allowlist, no wildcards
- **POL-013**: Input Validation - Sanitize all user inputs

</details>

<details>
<summary>Testing Policies (TEST-001 to TEST-006)</summary>

- **TEST-001**: Test Factory Usage - Use `tests/factories/` (DRY)
- **TEST-002**: Single Responsibility - One test, one behavior
- **TEST-004**: Arrange-Act-Assert - Follow AAA pattern
- **TEST-005**: No Magic Values - Use factories/constants
- **TEST-006**: Descriptive Names - Clear behavior descriptions

</details>

<details>
<summary>E2E Policies (E2E-002 to E2E-006)</summary>

- **E2E-002**: Page Object Pattern - Encapsulate complex interactions
- **E2E-003**: Auto-Generated Tests - Derive from config
- **E2E-004**: Semantic HTML - Validate HTML5 structure
- **E2E-005**: Accessibility - Basic a11y compliance
- **E2E-006**: Configuration-Driven - Tests from app config

</details>

### Using the Policy System

```typescript
// Query policies programmatically
import { UnifiedPolicySystem } from './config/unified-policy.config.js';

const allRules = UnifiedPolicySystem.getAllRules(); // 31 rules
const critical = UnifiedPolicySystem.getCriticalRules(); // 5 rules
const testingRules = UnifiedPolicySystem.getRulesByCategory('testing');
```

### Adding a New Policy

<details>
<summary>TypeScript & ESLint & Prettier (Click to expand)</summary>

## TypeScript Strict Mode

- Zero `any` types, explicit return types
- Strict null checks, array bounds checking
- `npm run type-check` before committing

## ESLint

- Zero errors required
- camelCase functions, PascalCase classes
- `npm run lint` or `npm run lint:fix`

## Prettier

- Single quotes, 2 spaces, 80 chars
- `npm run format` or `npm run format:check`
- Auto-runs in pre-commit hooks

</details>

<details>
<summary>Testing Patterns (Click to expand)</summary>

## Test Factory Usage (TEST-001)

```typescript
// ✅ Use factories
import { PageConfigFactory } from '../factories/page-config.factory.js';
const config = PageConfigFactory.create().withHeader('Test').build();

// ❌ No magic values
const config = { id: 'test', name: 'Test' }; // WRONG
```

## Test ID Selectors (POL-004, E2E-001)

```typescript
// ✅ Use data-testid
page.getByTestId('landing-header');

// ❌ No CSS selectors
page.locator('header h1'); // WRONG
```

## Coverage Thresholds (POL-002)

- 95% lines, 100% functions, 85% branches

</details>

<details>
<summary>Git Workflow & CI/CD (Click to expand)</summary>

## Pre-Commit Hooks

- Auto-runs: `format:check` + `lint`
- Blocks commit if fails
- Bypass: `--no-verify` (emergencies only)

## Commit Messages

- `feat:` `fix:` `docs:` `test:` `refactor:` `chore:`

## Branch Naming

- `feature/name` `fix/name` `docs/name`

## Pull Request Requirements

- All CI checks must pass
- Conventional commit format required
- Code review approval needed

## CI Pipeline Order (Fast-Fail)

1. Format & Lint (3 min)
2. Type Check & Build (5 min)
3. Unit + Policy + E2E (parallel, 10 min)

</details>

<details>
<summary>Common Development Tasks (Click to expand)</summary>

## Adding a New Page

1. Edit `config/pages.config.ts`
2. Add components with `testId` attributes
3. Tests auto-generate from config
4. Run `npm run ci:verify`

## Adding a Policy Rule

1. Choose file: `config/policy.config.ts` (POL-\*), `tests/config/test-policy.config.ts` (TEST-\*), `e2e/config/e2e-policy.config.ts` (E2E-\*)
2. Follow `BasePolicyRule` interface
3. Implement enforcement in checker
4. Run `npm run policy:check`

## Creating a Module

- One class = one responsibility (SRP)
- Use interfaces (DIP)
- Dependency injection in constructor
- JSDoc for public APIs

</details>

<details>
<summary>Troubleshooting (Click to expand)</summary>

**Build fails**: `npm run type-check`  
**Policy check fails**: `npm run build` first (requires compiled JS)  
**E2E fails**: `npx playwright install chromium --with-deps`  
**CI slow**: Check cache hit in logs

</details>

---

## 🚀 Quick Start

```bash
# Daily dev
npm run dev:server              # Hot reload (recommended)

# Before commit
npm run ci:verify               # Full validation

# Adding features
git checkout -b feature/name
# Edit config files, not generators
npm run ci:verify
git commit -m "feat: description"
```

## 🎯 Key Principles

1. **Config-First**: Extend via `config/*.config.ts`, not code
2. **Policy-Aware**: Reference policy IDs (POL-\*, TEST-\*, E2E-\*)
3. **Factory-Based**: Use `tests/factories/` for test data (TEST-001)
4. **Test ID Driven**: Always use `getByTestId()` (E2E-001)
5. **Type-Safe**: Zero `any`, strict mode (POL-001)

---

**Need more details?** Use the MCP server or expand sections above.

**Remember**: This is a RetroArch **server configurator**, NOT the RetroArch platform.

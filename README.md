# RetroArch PWA Configurator

[![CI/CD Pipeline](https://github.com/brewski-beers/RetroArch/workflows/PR%20Verification/badge.svg)](https://github.com/brewski-beers/RetroArch/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **TechByBrewski** presents: A TypeScript-powered Progressive Web App for configuring and managing RetroArch server setups with policy-driven validation.

## 🎯 What Is This?

This is **NOT** the RetroArch platform itself. This is a **web-based configuration tool** that helps you generate, validate, and manage RetroArch server configurations with ease.

**RetroArch PWA Configurator** provides:

- 🔧 Interactive UI for generating RetroArch server configurations
- ✅ Policy-driven validation to ensure configuration compliance
- 📦 Modular plugin architecture for extensibility
- 🧪 Comprehensive test coverage with auto-generated acceptance tests
- 🚀 Production-ready build pipeline with LeftShift testing
- ⚡ Lightning-fast CI/CD with intelligent caching (1-2 min iterations)

## 🌟 Key Features

### Policy-as-Code

- **Automated Compliance**: Every configuration is validated against defined policy rules
- **TypeScript Strict Mode**: All code enforces type safety at compile time
- **SOLID Principles**: Clean architecture following industry best practices
- **Unified Policy System**: Application (POL-_), Testing (TEST-_), and E2E (E2E-\*) policies follow consistent base interface

### Policy-Driven Decision Making

All development decisions are guided by our three-tier policy system:

1. **Application Policies (POL-)**: Code quality, type safety, architecture
   - POL-001: TypeScript Strict Mode
   - POL-002: Test Coverage
   - POL-003: SOLID Principles
   - POL-004: Test ID Attributes

2. **Testing Policies (TEST-)**: Unit test standards and best practices
   - TEST-001: Test Factory Usage (DRY)
   - TEST-002: Single Responsibility per test
   - TEST-003: Type Safety in tests
   - TEST-004: Arrange-Act-Assert pattern
   - TEST-005: No Magic Values
   - TEST-006: Descriptive Test Names

3. **E2E Policies (E2E-)**: Browser testing and user flow standards
   - E2E-001: Use Test IDs (getByTestId)
   - E2E-002: Page Object Pattern
   - E2E-003: Auto-Generated Tests
   - E2E-004: Semantic HTML Validation
   - E2E-005: Accessibility Compliance
   - E2E-006: Configuration-Driven

See [`POLICY_AUDIT.md`](POLICY_AUDIT.md) for complete policy alignment matrix.

### Auto-Generated Pages

- **Config-as-Infrastructure**: Pages are generated from TypeScript configuration files
- **Single Responsibility**: Each component has one clear purpose
- **Scalable Architecture**: Easy to add new pages and features

### Comprehensive Testing

- **15+ E2E Tests**: Auto-generated smoke and acceptance tests
- **Unit Test Coverage**: Vitest for fast, isolated testing
- **Playwright Integration**: Browser automation for real-world testing
- **Optimized CI/CD**: Intelligent caching for lightning-fast feedback

## 🚀 Quick Start

### TL;DR - Get Started in 30 Seconds

```bash
# Clone and install
git clone https://github.com/brewski-beers/RetroArch.git && cd RetroArch && npm install

# Start development with hot reload
npm run dev:server

# Visit http://localhost:3000 - make changes, see results instantly!
```

**That's it!** The dev server watches for changes and auto-restarts. Edit TypeScript files and refresh your browser.

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/brewski-beers/RetroArch.git
cd RetroArch

# Install dependencies
npm install
```

### Development Workflow

**Option 1: Fast Development Mode (Recommended)**

```bash
# Start dev server with hot reload - fastest iteration
npm run dev:server

# Make changes to src/**/*.ts - server restarts automatically
# Refresh browser to see changes
```

**Option 2: Type-Safe Development Mode**

```bash
# Watch TypeScript compilation + auto-restart
npm run dev

# Catches type errors during development
# Slightly slower but safer
```

**Before Committing:**

The project uses **Git pre-commit hooks** (via husky) to automatically enforce code quality:

```bash
# Pre-commit hook runs automatically when you commit:
# 1. npm run format:check (Prettier formatting)
# 2. npm run lint (ESLint code quality)
#
# If checks fail, the commit is blocked with helpful error messages

git add .
git commit -m "feat: your changes"
# ↑ Automatically runs format:check and lint

# Manual formatting and linting:
npm run format          # Auto-fix formatting issues
npm run format:check    # Check formatting without changes
npm run lint            # Check code quality
npm run lint:fix        # Auto-fix linting issues

# Run full verification pipeline (CI simulation):
npm run ci:verify
# This runs: format:check → lint → type-check → build → policy:check → test:coverage → test:e2e
```

**Why Pre-Commit Hooks?**

- ✅ **Fast Fail**: Catches formatting/lint issues in ~5-10 seconds before expensive builds
- ✅ **Consistent Code**: Ensures all commits meet quality standards
- ✅ **CI Efficiency**: Reduces CI failures from trivial formatting issues
- ✅ **Developer Experience**: Immediate feedback, no waiting for CI

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run serve

# Visit http://localhost:3000
```

### Testing

```bash
# Run unit tests (watch mode for development)
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run all tests once
npm test
```

## 📁 Project Structure

```
.
├── config/                    # Configuration-as-Infrastructure
│   ├── base-policy.config.ts  # Base policy interface (SOLID: DIP)
│   ├── policy.config.ts       # Application policy rules (POL-*)
│   ├── unified-policy.config.ts # Policy aggregator (SOLID: SRP)
│   └── pages.config.ts        # Page structure definitions
├── src/                       # Source code
│   ├── pages/                 # Page generation
│   │   └── page-generator.ts  # Auto-generates HTML from config
│   ├── policy-checker.ts      # Policy validation tool
│   ├── server.ts              # HTTP server
│   └── index.ts               # Main entry point
├── e2e/                       # End-to-end tests
│   ├── config/
│   │   └── e2e-policy.config.ts # E2E policy rules (E2E-*)
│   └── tests/
│       ├── smoke.spec.ts      # Auto-generated smoke tests
│       └── acceptance.spec.ts # Happy path acceptance tests
├── tests/                     # Unit tests
│   ├── config/
│   │   └── test-policy.config.ts # Unit test policy rules (TEST-*)
│   ├── factories/             # Test data factories (DRY)
│   │   └── page-config.factory.ts # Page config test factory
│   ├── page-generator.test.ts
│   ├── policy-checker.test.ts
│   └── server.test.ts
├── .github/
│   ├── workflows/             # CI/CD pipeline
│   │   └── verify.yml         # Optimized PR verification workflow
│   └── copilot-instructions.md # AI pair programming guidelines
├── POLICY_AUDIT.md            # Policy system audit report
└── package.json               # Project dependencies and scripts
```

## 🔧 Configuration

### Adding New Pages

Edit `config/pages.config.ts`:

```typescript
export const pagesConfig: PageConfig[] = [
  {
    id: 'new-page',
    name: 'New Page',
    route: '/new',
    title: 'New Page Title',
    description: 'Page description',
    components: [
      {
        type: 'header',
        id: 'page-header',
        testId: 'new-page-header', // Required for testing
        content: 'Page Header',
      },
      // Add more components...
    ],
  },
];
```

**Key Requirements**:

- ✅ Every component MUST have a `testId` attribute (enforced by POL-004)
- ✅ Use pattern: `<page-id>-<component-type>` (e.g., `landing-header`)
- ✅ Tests are auto-generated from configuration
- ✅ Pages are automatically served at the specified route

**Test ID (data-testid) Usage**:

```typescript
// Playwright E2E tests
const header = page.getByTestId('landing-header');
await expect(header).toBeVisible();

// Vitest unit tests
const header = screen.getByTestId('landing-header');
expect(header).toBeInTheDocument();
```

Pages are automatically:

- Generated as HTML with `data-testid` attributes
- Included in smoke tests
- Validated for structure and content
- Checked for test ID compliance (POL-004)

### Policy Configuration

The project uses a unified policy system that follows SOLID principles.

**Policy Architecture**:

```
base-policy.config.ts (Base Interface)
├── policy.config.ts (Application: POL-*)
├── test-policy.config.ts (Testing: TEST-*)
└── e2e-policy.config.ts (E2E: E2E-*)
    └── unified-policy.config.ts (Aggregator)
```

**Adding a New Policy Rule**:

1. Edit the appropriate policy file:
   - Application rules → `config/policy.config.ts`
   - Testing rules → `tests/config/test-policy.config.ts`
   - E2E rules → `e2e/config/e2e-policy.config.ts`

2. Follow the base interface:

```typescript
{
  id: 'POL-005',  // Use POL-*, TEST-*, or E2E-* prefix
  name: 'Rule Name',
  description: 'Clear description of the rule',
  enabled: true,
  severity: 'high',  // critical | high | medium | low
  category: 'application'  // application | testing | e2e
}
```

3. Implement enforcement in appropriate checker/validator

**Querying Policies**:

```typescript
import { UnifiedPolicySystem } from './config/unified-policy.config.js';

// Get all enabled rules
const enabled = UnifiedPolicySystem.getAllEnabledRules();

// Get critical rules
const critical = UnifiedPolicySystem.getCriticalRules();

// Get rules by category
const testRules = UnifiedPolicySystem.getRulesByCategory('testing');

// Validate consistency
const validation = UnifiedPolicySystem.validateAllRules();
```

```typescript
export const policyConfig: PolicyConfig = {
  version: '1.0.0',
  rules: [
    {
      id: 'POL-001',
      name: 'TypeScript Strict Mode',
      description: 'All TypeScript files must use strict mode',
      enabled: true,
      severity: 'critical',
    },
    // Add more policy rules...
  ],
};
```

## 🧪 Testing Philosophy

### Testing Order (Critical!)

The correct order for running tests is:

1. **Type Check**: `npm run type-check` - Validates TypeScript types
2. **Build**: `npm run build` - Compiles TypeScript to JavaScript
3. **Policy Check**: `npm run policy:check` - Validates compliance (requires build)
4. **Unit Tests**: `npm test` - Runs Vitest tests
5. **E2E Tests**: `npm run test:e2e` - Runs Playwright browser tests

> ⚠️ **Important**: Always run `npm run build` before `npm run policy:check` as the policy checker requires compiled JavaScript files.

### Auto-Generated Tests

Tests are automatically generated from configuration:

- Page structure tests from `pages.config.ts`
- Policy compliance tests from `policy.config.ts`
- Placeholders for future features (auth, middleware, plugins, paywalls)

## 📚 Available Scripts

| Command                | Description                                 | Use Case                       |
| ---------------------- | ------------------------------------------- | ------------------------------ |
| `npm run dev:server`   | **Fast dev mode** with hot reload (tsx)     | 🚀 Daily development           |
| `npm run dev`          | Type-safe dev mode (tsc watch + nodemon)    | 🛡️ When you want type checking |
| `npm run build`        | Compile TypeScript to JavaScript            | 📦 Production build            |
| `npm run serve`        | Start production server                     | 🌐 Test production build       |
| `npm run type-check`   | Type check without compilation              | ✅ Quick validation            |
| `npm run policy:check` | Validate policy compliance (requires build) | 🔒 Compliance check            |
| `npm test`             | Run unit tests once                         | 🧪 CI/Quick check              |
| `npm run test:watch`   | Run unit tests in watch mode                | 🔄 Active development          |
| `npm run test:e2e`     | Run end-to-end tests                        | 🌐 Browser testing             |
| `npm run ci:verify`    | Run full CI pipeline locally                | ✅ Pre-commit validation       |

## 🔒 CI/CD Pipeline

### Workflow Optimizations

Our GitHub Actions workflow is optimized for **lightning-fast iterations**:

- **Path Filtering**: Only runs on relevant file changes (skips README-only commits)
- **Concurrency Control**: Cancels outdated runs automatically
- **Intelligent Caching**:
  - `node_modules` cached (saves ~30-60s)
  - TypeScript build cached (saves ~15-30s)
  - Playwright browsers cached (saves ~60-120s)
- **Fast Fail**: Type check runs first for immediate feedback
- **Conditional Uploads**: Playwright reports only on failure

### Pipeline Steps

1. ✅ **Type Check** (~10-20s) - Validates TypeScript types
2. ✅ **Build** (~15-30s) - Compiles production build
3. ✅ **Policy Check** (~5-10s) - Ensures configuration compliance
4. ✅ **Unit Tests** (~10-15s) - Runs Vitest tests
5. ✅ **E2E Tests** (~30-60s) - Runs Playwright browser tests

**Total Time**:

- First run (cold cache): ~3-5 minutes
- Subsequent runs (warm cache): ~1-2 minutes

### Branch Protection

Required status checks before merging to `main`:

- ✅ verify / Run Type Check
- ✅ verify / Build application
- ✅ verify / Run Policy Check
- ✅ verify / Run Unit Tests
- ✅ verify / Run E2E Tests

## 🎨 Tech Stack

- **TypeScript 5.3** - Type-safe development
- **Vitest 1.0** - Fast unit testing
- **Playwright 1.40** - Browser automation
- **Node.js 20.x** - Runtime environment
- **GitHub Actions** - Optimized CI/CD pipeline

## 🏗️ Architecture Principles

### SOLID Principles

- **S**ingle Responsibility: Each class/module has one purpose
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes are substitutable for base types
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Depend on abstractions, not concretions

### Config-as-Infrastructure

All behavior is defined in configuration files:

- Pages are generated from `pages.config.ts`
- Policies are enforced from `policy.config.ts`
- Tests are auto-generated from configurations

### Policy-as-Code

Compliance rules live in version control:

- Auditable: All changes are tracked
- Reviewable: Team can review policy changes
- Enforceable: Automated validation on every commit

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the guidelines in `.github/copilot-instructions.md`
4. Run tests: `npm run ci:verify`
5. Commit with clear messages
6. Push and open a Pull Request

All PRs must pass the required status checks before merging.

## 📝 License

MIT © TechByBrewski

## 🔗 Links

- **Repository**: https://github.com/brewski-beers/RetroArch
- **Issues**: https://github.com/brewski-beers/RetroArch/issues
- **RetroArch Official**: https://www.retroarch.com/

---

**Built with ❤️ by TechByBrewski** | This is a configuration tool for RetroArch servers, not the RetroArch platform itself.

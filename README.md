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

# Run type checking
npm run type-check

# Build the application
npm run build
```

### Development

```bash
# Start the development server
npm run serve

# Visit http://localhost:3000 in your browser
```

### Testing

```bash
# Run type check first
npm run type-check

# Build the application (required before policy check)
npm run build

# Run policy compliance check
npm run policy:check

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run full CI verification pipeline
npm run ci:verify
```

## 📁 Project Structure

```
.
├── config/                    # Configuration-as-Infrastructure
│   ├── policy.config.ts      # Policy rules and compliance definitions
│   └── pages.config.ts       # Page structure definitions
├── src/                       # Source code
│   ├── pages/                # Page generation
│   │   └── page-generator.ts # Auto-generates HTML from config
│   ├── policy-checker.ts     # Policy validation tool
│   ├── server.ts             # HTTP server
│   └── index.ts              # Main entry point
├── e2e/tests/                # End-to-end tests
│   ├── smoke.spec.ts         # Auto-generated smoke tests
│   └── acceptance.spec.ts    # Happy path acceptance tests
├── tests/                     # Unit tests
│   └── example.test.ts       # Vitest unit tests
├── .github/
│   ├── workflows/            # CI/CD pipeline
│   │   └── verify.yml        # Optimized PR verification workflow
│   └── copilot-instructions.md  # AI pair programming guidelines
└── package.json              # Project dependencies and scripts
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
        content: 'Page Header'
      },
      // Add more components...
    ]
  }
];
```

Pages are automatically:
- Generated as HTML
- Included in smoke tests
- Validated for structure and content

### Policy Configuration

Edit `config/policy.config.ts` to define compliance rules:

```typescript
export const policyConfig: PolicyConfig = {
  version: '1.0.0',
  rules: [
    {
      id: 'POL-001',
      name: 'TypeScript Strict Mode',
      description: 'All TypeScript files must use strict mode',
      enabled: true,
      severity: 'critical'
    },
    // Add more policy rules...
  ]
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

| Command | Description |
|---------|-------------|
| `npm run type-check` | Type check without compilation (run first) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run policy:check` | Validate policy compliance (requires build) |
| `npm run serve` | Start HTTP server (http://localhost:3000) |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run ci:verify` | Run full CI pipeline locally |

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

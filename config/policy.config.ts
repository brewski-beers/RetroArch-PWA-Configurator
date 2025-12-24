/**
 * Application Policy Configuration
 * Defines the policy rules and compliance requirements for the application
 * Following config-as-infrastructure and policy-as-code principles
 * Extends BasePolicyConfig to maintain consistency (OCP - Open/Closed Principle)
 */

import type { BasePolicyConfig, BasePolicyRule } from './base-policy.config.js';

export interface ApplicationPolicyRule extends BasePolicyRule {
  category: 'application';
}

/**
 * Module-Specific Coverage Targets (POL-002)
 * Defines granular coverage expectations based on module type
 */
export interface ModuleCoverageTarget {
  /** Module path pattern (glob) */
  pattern: string;
  /** Module description */
  description: string;
  /** Why this coverage target */
  rationale: string;
  /** Coverage thresholds */
  thresholds: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  /** Whether this is currently enforced */
  enforced: boolean;
}

export const moduleCoverageTargets: ModuleCoverageTarget[] = [
  {
    pattern: 'src/pipeline/**/*.ts',
    description: 'Core Pipeline (Business Logic)',
    rationale: 'Critical ROM ingestion logic - must be 100% tested',
    thresholds: {
      lines: 100,
      functions: 100,
      branches: 95,
      statements: 100,
    },
    enforced: true,
  },
  {
    pattern: 'src/config/config-{templates,validator,loader}.ts',
    description: 'Configuration System',
    rationale: 'Core config logic - fully testable, no I/O dependencies',
    thresholds: {
      lines: 100,
      functions: 100,
      branches: 95,
      statements: 100,
    },
    enforced: true,
  },
  {
    pattern: 'src/ui/**/*.ts',
    description: 'UI Layer (Future PWA)',
    rationale: 'DOM manipulation can have edge cases, 95%+ acceptable',
    thresholds: {
      lines: 95,
      functions: 100,
      branches: 90,
      statements: 95,
    },
    enforced: false, // Not yet implemented
  },
  {
    pattern: 'src/server.ts',
    description: 'Express Server Infrastructure',
    rationale:
      'Server startup and signal handlers hard to test, 85%+ acceptable',
    thresholds: {
      lines: 85,
      functions: 90,
      branches: 80,
      statements: 85,
    },
    enforced: true,
  },
  {
    pattern: 'src/config/config-wizard.ts',
    description: 'Interactive CLI Tool',
    rationale:
      'Readline interface not easily testable, logic extraction required',
    thresholds: {
      lines: 60,
      functions: 70,
      branches: 50,
      statements: 60,
    },
    enforced: true,
  },
  {
    pattern: 'src/**/index.ts',
    description: 'Entry Points (Barrel Files)',
    rationale: 'Just exports, no logic - 0% coverage acceptable',
    thresholds: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    },
    enforced: false, // Explicitly excluded
  },
  {
    pattern: 'config/**/*.config.ts',
    description: 'Configuration Files',
    rationale: 'Schema validated by TypeScript, no runtime logic',
    thresholds: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    },
    enforced: false, // Schema validation only
  },
];

export interface PolicyConfig extends BasePolicyConfig {
  category: 'application';
  rules: ApplicationPolicyRule[];
  compliance: {
    requireAuth: boolean;
    requireMiddleware: boolean;
    requirePlugins: boolean;
    requirePaywalls: boolean;
  };
}

export const policyConfig: PolicyConfig = {
  version: '1.2.0',
  category: 'application',
  rules: [
    {
      id: 'POL-000',
      name: 'Policy Enforcement Integrity',
      description:
        'Meta-policy ensuring all defined policies are actually enforced. ' +
        'Validates: (1) PolicyChecker has methods for all policies. ' +
        '(2) runAllChecks() calls all policy methods. ' +
        '(3) Tests cover all policy checks. ' +
        '(4) No policies exist without enforcement mechanism. ' +
        'Prevents policy drift where rules are documented but never validated. ' +
        'Enforcement: Pre-deployment check verifies policy coverage.',
      enabled: true,
      severity: 'critical',
      category: 'application',
      priority: 0,
      enforcement: {
        automated: true,
        manual: false,
        blocking: true,
      },
    },
    {
      id: 'POL-001',
      name: 'TypeScript Strict Mode',
      description: 'All TypeScript files must use strict mode',
      enabled: true,
      severity: 'critical',
      category: 'application',
    },
    {
      id: 'POL-002',
      name: 'Test Coverage Thresholds',
      description:
        'Overall project coverage: 95% lines, 100% functions, 85% branches, 95% statements. ' +
        'Per-module targets defined in moduleCoverageTargets array.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-003',
      name: 'SOLID Principles',
      description: 'Code must follow SOLID design principles',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-004',
      name: 'Test ID Attributes',
      description:
        'All UI components must have data-testid attributes for Vitest and Playwright testing',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-005',
      name: 'ESLint Code Quality',
      description:
        'All code must pass ESLint with zero errors. Enforces type safety, naming conventions, ' +
        'and code quality standards.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-006',
      name: 'Prettier Code Formatting',
      description:
        'All code must be formatted with Prettier. Enforces consistent style: single quotes, ' +
        'semicolons, 80-char lines, 2-space indentation.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-007',
      name: 'Pre-Commit Hooks',
      description:
        'All commits must pass format and lint checks via Git hooks (husky). ' +
        'Fast-fail architecture prevents unformatted code from entering repo.',
      enabled: true,
      severity: 'medium',
      category: 'application',
    },
    {
      id: 'POL-008',
      name: 'Git Workflow',
      description:
        'Conventional commit messages, branch naming conventions, and PR requirements enforced. ' +
        'Format: <type>: <subject> (feat, fix, docs, test, refactor, chore).',
      enabled: true,
      severity: 'medium',
      category: 'application',
    },
    {
      id: 'POL-009',
      name: 'TDD Approach',
      description:
        'Test-Driven Development required for all new features. Write tests FIRST, then implementation. ' +
        'Red → Green → Refactor cycle enforced.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-010',
      name: 'Secrets Management',
      description:
        'No hardcoded secrets, API keys, or credentials in code. Use environment variables or secret managers. ' +
        'Scans for patterns: API_KEY, SECRET, PASSWORD, TOKEN, AWS keys, GitHub tokens.',
      enabled: true,
      severity: 'critical',
      category: 'application',
    },
    {
      id: 'POL-011',
      name: 'Dependency Security Audit',
      description:
        'All dependencies must pass npm audit with zero high/critical vulnerabilities. ' +
        'Weekly npm outdated check. Dependabot enabled for automated security updates.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-012',
      name: 'CORS Configuration',
      description:
        'CORS must be explicitly configured with allowlist, not wildcard (*). ' +
        'Prevents CSRF attacks by requiring explicit origin configuration in production.',
      enabled: true,
      severity: 'medium',
      category: 'application',
    },
    {
      id: 'POL-013',
      name: 'Input Validation',
      description:
        'All user inputs must be validated and sanitized. Use Zod schemas for API endpoints. ' +
        'Validate file uploads (size, type, content) to prevent injection attacks.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-014',
      name: 'Automated Dependency Updates',
      description:
        'Dependabot configured for automated security updates. Auto-merge minor/patch updates. ' +
        'Weekly dependency review. Renovate or Dependabot PR auto-labeling enabled.',
      enabled: true,
      severity: 'high',
      category: 'application',
    },
    {
      id: 'POL-015',
      name: 'Version Compatibility Policy',
      description:
        'Use caret (^) for patch/minor updates, exact versions for critical dependencies. ' +
        'Major version updates require manual review. Lock production dependencies strictly.',
      enabled: true,
      severity: 'medium',
      category: 'application',
    },
    {
      id: 'POL-016',
      name: 'License Compliance',
      description:
        'All dependencies must use OSI-approved licenses compatible with MIT. ' +
        'Forbidden: GPL, AGPL (copyleft). Allowed: MIT, Apache-2.0, BSD, ISC. Check with license-checker.',
      enabled: true,
      severity: 'medium',
      category: 'application',
    },
    {
      id: 'POL-017',
      name: 'Supply Chain Security',
      description:
        'Verify package-lock.json integrity on every install. Use npm ci in CI/CD (not npm install). ' +
        'Enable npm audit signatures. Verify package provenance when available.',
      enabled: true,
      severity: 'critical',
      category: 'application',
    },
    {
      id: 'POL-018',
      name: "YAGNI Principle (You Ain't Gonna Need It)",
      description:
        'Build only what is needed NOW. Prevent over-engineering by requiring justification for: ' +
        '(1) New abstractions - services, handlers, managers, factories. ' +
        '(2) New dependencies - verify standard library cannot handle it. ' +
        '(3) Complex patterns - prefer simple solutions. ' +
        'Rule of Three: Only create abstractions when duplicated in 3+ places. ' +
        'Future-proofing is banned - build for today, refactor when tomorrow comes. ' +
        'Config-First: Try config export before writing code. ' +
        'Enforcement: Pre-commit hook checks new abstractions require YAGNI justification comment.',
      enabled: true,
      severity: 'critical',
      category: 'application',
      priority: 1,
      enforcement: {
        automated: true,
        manual: false,
        blocking: true,
      },
    },
    {
      id: 'POL-019',
      name: 'KISS Principle (Keep It Simple, Stupid)',
      description:
        'Prefer simple solutions over complex ones. Complexity is a last resort. ' +
        'Metrics: (1) Cyclomatic complexity max 10 per function. ' +
        '(2) Dependency depth max 3 levels. (3) Abstraction layers max 2. ' +
        'Explicit over clever - readable beats concise. ' +
        'Standard library first - use built-ins before adding dependencies. ' +
        'One-liner check: If solvable in 1 line, do it. ' +
        'Enforcement: Code review (subjective evaluation).',
      enabled: true,
      severity: 'high',
      category: 'application',
      priority: 2,
      enforcement: {
        automated: false,
        manual: true,
        blocking: false,
      },
    },
    {
      id: 'POL-020',
      name: 'Policy Test Coverage',
      description:
        'Every policy must have automated test coverage. Meta-policy ensuring policy enforcement is testable. ' +
        'Requirements: (1) Each POL-* policy must have corresponding test in policy-checker.test.ts. ' +
        '(2) PolicyChecker.runAllChecks() must validate all enabled policies. ' +
        '(3) Programmatic check detects missing policy tests. ' +
        '(4) TEST-* and E2E-* policies tested in their respective test suites. ' +
        'Prevents "untested enforcers" - policies that exist but are never validated. ' +
        'Enforcement: CI/CD runs policy coverage check before deployment.',
      enabled: true,
      severity: 'critical',
      category: 'application',
      priority: 0,
      enforcement: {
        automated: true,
        manual: false,
        blocking: true,
      },
    },
    {
      id: 'POL-021',
      name: 'Rate Limiting',
      description:
        'All API endpoints must have rate limiting to prevent DoS attacks and abuse. ' +
        'Requirements: (1) Global rate limit for all API endpoints (max 100 req/15min per IP). ' +
        '(2) Stricter limits for write operations POST/PUT/PATCH (max 20 req/15min per IP). ' +
        '(3) Use express-rate-limit middleware with standardStore for distributed systems. ' +
        '(4) Return 429 status with Retry-After header when limit exceeded. ' +
        'Prevents brute force attacks, API abuse, and resource exhaustion. ' +
        'Enforcement: Automated tests verify rate limiting is applied to all routes.',
      enabled: true,
      severity: 'critical',
      category: 'application',
      priority: 3,
      enforcement: {
        automated: true,
        manual: false,
        blocking: true,
      },
    },
  ],
  compliance: {
    requireAuth: false, // Not yet implemented
    requireMiddleware: false, // Not yet implemented
    requirePlugins: false, // Not yet implemented
    requirePaywalls: false, // Not yet implemented
  },
};

// POL-022: Batch Upload Configuration
// Exposed as typed config for validator/processor to satisfy POL-005 (ESLint type safety)
export const batchUploadConfig = {
  maxBatchSize: 100,
  maxFileSize: 50 * 1024 * 1024,
  processingStrategy: 'serial' as const,
  errorHandling: 'continueOnError' as const,
  allowedExtensions: [
    '.zip',
    '.nes',
    '.snes',
    '.sfc',
    '.gba',
    '.gb',
    '.gbc',
    '.n64',
    '.md',
    '.gen',
    '.sms',
    '.gg',
    '.pce',
  ],
  rateLimitPerMinute: 10,
};

export type BatchUploadConfig = typeof batchUploadConfig;

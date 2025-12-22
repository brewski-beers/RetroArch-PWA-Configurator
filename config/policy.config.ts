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
  version: '1.0.0',
  category: 'application',
  rules: [
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
  ],
  compliance: {
    requireAuth: false, // Not yet implemented
    requireMiddleware: false, // Not yet implemented
    requirePlugins: false, // Not yet implemented
    requirePaywalls: false, // Not yet implemented
  },
};

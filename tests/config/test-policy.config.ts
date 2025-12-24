/**
 * Test Policy Configuration
 * Defines testing standards and requirements
 * Following policy-as-code principles for testing
 * Extends BasePolicyConfig to maintain consistency (OCP - Open/Closed Principle)
 */

import type {
  BasePolicyConfig,
  BasePolicyRule,
} from '../../config/base-policy.config.js';

export interface TestPolicyRule extends BasePolicyRule {
  category: 'testing';
}

export interface TestPolicyConfig extends BasePolicyConfig {
  category: 'testing';
  rules: TestPolicyRule[];
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  standards: {
    requireFactories: boolean;
    requireTypeChecking: boolean;
    requireSRP: boolean;
    requireDRY: boolean;
  };
}

export const testPolicyConfig: TestPolicyConfig = {
  version: '1.0.0',
  category: 'testing',
  rules: [
    {
      id: 'TEST-000',
      name: 'Testing Policy Enforcement Integrity',
      description:
        'Meta-policy ensuring testing policies are defined, enabled, and enforced across the codebase.',
      enabled: true,
      severity: 'critical',
      category: 'testing',
    },
    {
      id: 'TEST-001',
      name: 'Test Factory Usage',
      description:
        'All tests must use factories for test data creation (DRY principle)',
      enabled: true,
      severity: 'high',
      category: 'testing',
    },
    {
      id: 'TEST-002',
      name: 'Single Responsibility',
      description: 'Each test must test one specific behavior (SRP)',
      enabled: true,
      severity: 'high',
      category: 'testing',
    },
    {
      id: 'TEST-003',
      name: 'Type Safety',
      description: 'All test data must be properly typed (no any types)',
      enabled: true,
      severity: 'critical',
      category: 'testing',
    },
    {
      id: 'TEST-004',
      name: 'Arrange-Act-Assert',
      description: 'Tests must follow AAA pattern for clarity',
      enabled: true,
      severity: 'medium',
      category: 'testing',
    },
    {
      id: 'TEST-005',
      name: 'No Magic Values',
      description: 'Use factory methods instead of inline test data',
      enabled: true,
      severity: 'high',
      category: 'testing',
    },
    {
      id: 'TEST-006',
      name: 'Descriptive Test Names',
      description: 'Test names must clearly describe the behavior being tested',
      enabled: true,
      severity: 'medium',
      category: 'testing',
    },
    {
      id: 'TEST-007',
      name: 'Pragmatic Coverage Policy',
      description:
        'Test all realistic code paths. Defensive error handling for non-standard exceptions (e.g., `error instanceof Error` false branches) may be excluded when mocking complexity outweighs value. Requires justification comment in code.',
      enabled: true,
      severity: 'high',
      category: 'testing',
      metadata: {
        targets: {
          lines: '100%',
          functions: '100%',
          branches: '85%+ (realistic paths)',
        },
        exemptions: [
          'error instanceof Error false branches (non-Error exceptions)',
          'TypeScript exhaustive checks (never branches)',
          'Unreachable defensive assertions',
        ],
        requirements: [
          'All realistic user/system scenarios must be tested',
          'Happy path coverage is mandatory',
          'Error paths must be tested when achievable without complex mocks',
          'Untested branches require inline justification comment',
          'TDD approach prevents backfilling coverage debt',
        ],
        examples: {
          acceptable: [
            '// Coverage: Skip - defensive check for non-Error exception (requires complex mock)',
            'catch (error) { return error instanceof Error ? error.message : "fallback" }',
          ],
          unacceptable: [
            'Missing tests for file I/O errors',
            'Missing tests for validation failures',
            'Untested business logic branches',
          ],
        },
      },
    },
  ],
  coverage: {
    lines: 95,
    functions: 100,
    branches: 85,
    statements: 95,
  },
  standards: {
    requireFactories: true,
    requireTypeChecking: true,
    requireSRP: true,
    requireDRY: true,
  },
};

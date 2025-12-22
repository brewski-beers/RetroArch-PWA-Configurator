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
      id: 'TEST-001',
      name: 'Test Factory Usage',
      description:
        'All tests must use factories for test data creation (DRY principle)',
      enabled: true,
      severity: 'high',
      category: 'testing',
      enforcer: 'TestPolicyValidator',
    },
    {
      id: 'TEST-002',
      name: 'Single Responsibility',
      description: 'Each test must test one specific behavior (SRP)',
      enabled: true,
      severity: 'high',
      category: 'testing',
      enforcer: 'TestPolicyValidator',
    },
    {
      id: 'TEST-003',
      name: 'Type Safety',
      description: 'All test data must be properly typed (no any types)',
      enabled: true,
      severity: 'critical',
      category: 'testing',
      enforcer: 'TestPolicyValidator',
    },
    {
      id: 'TEST-004',
      name: 'Arrange-Act-Assert',
      description: 'Tests must follow AAA pattern for clarity',
      enabled: true,
      severity: 'medium',
      category: 'testing',
      enforcer: 'TestPolicyValidator',
    },
    {
      id: 'TEST-005',
      name: 'No Magic Values',
      description: 'Use factory methods instead of inline test data',
      enabled: true,
      severity: 'high',
      category: 'testing',
      enforcer: 'TestPolicyValidator',
    },
    {
      id: 'TEST-006',
      name: 'Descriptive Test Names',
      description: 'Test names must clearly describe the behavior being tested',
      enabled: true,
      severity: 'medium',
      category: 'testing',
      enforcer: 'TestPolicyValidator',
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

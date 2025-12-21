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
      name: 'Test Coverage',
      description: 'All modules must have unit tests',
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
  ],
  compliance: {
    requireAuth: false, // Not yet implemented
    requireMiddleware: false, // Not yet implemented
    requirePlugins: false, // Not yet implemented
    requirePaywalls: false, // Not yet implemented
  },
};

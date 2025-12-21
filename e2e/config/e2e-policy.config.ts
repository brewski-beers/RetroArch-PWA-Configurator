/**
 * E2E Policy Configuration
 * Defines end-to-end testing standards and requirements
 * Following policy-as-code principles for E2E testing
 * Extends BasePolicyConfig to maintain consistency (OCP - Open/Closed Principle)
 */

import type {
  BasePolicyConfig,
  BasePolicyRule,
} from '../../config/base-policy.config.js';

export interface E2EPolicyRule extends BasePolicyRule {
  category: 'e2e';
}

export interface E2EPolicyConfig extends BasePolicyConfig {
  category: 'e2e';
  rules: E2EPolicyRule[];
  browsers: {
    requireChromium: boolean;
    requireFirefox: boolean;
    requireWebkit: boolean;
  };
  accessibility: {
    requireAriaLabels: boolean;
    requireKeyboardNavigation: boolean;
    requireScreenReaderSupport: boolean;
  };
}

export const e2ePolicyConfig: E2EPolicyConfig = {
  version: '1.0.0',
  category: 'e2e',
  rules: [
    {
      id: 'E2E-001',
      name: 'Use Test IDs',
      description:
        'Prefer data-testid for component testing. Use semantic selectors (getByRole, getByLabel) for accessibility verification and structural HTML (body, meta tags).',
      enabled: true,
      severity: 'critical',
      category: 'e2e',
    },
    {
      id: 'E2E-002',
      name: 'Page Object Pattern',
      description: 'Use page objects for complex interactions (SRP)',
      enabled: true,
      severity: 'medium',
      category: 'e2e',
    },
    {
      id: 'E2E-003',
      name: 'Auto-Generated Tests',
      description: 'Generate smoke tests from configuration (DRY)',
      enabled: true,
      severity: 'high',
      category: 'e2e',
    },
    {
      id: 'E2E-004',
      name: 'Semantic HTML Validation',
      description: 'Verify proper HTML5 semantic structure',
      enabled: true,
      severity: 'medium',
      category: 'e2e',
    },
    {
      id: 'E2E-005',
      name: 'Accessibility Compliance',
      description: 'Test for basic accessibility requirements',
      enabled: true,
      severity: 'high',
      category: 'e2e',
    },
    {
      id: 'E2E-006',
      name: 'Configuration-Driven',
      description: 'E2E tests must derive from application configuration',
      enabled: true,
      severity: 'high',
      category: 'e2e',
    },
  ],
  browsers: {
    requireChromium: true,
    requireFirefox: false, // Optional
    requireWebkit: false, // Optional
  },
  accessibility: {
    requireAriaLabels: false, // Future implementation
    requireKeyboardNavigation: false, // Future implementation
    requireScreenReaderSupport: false, // Future implementation
  },
};

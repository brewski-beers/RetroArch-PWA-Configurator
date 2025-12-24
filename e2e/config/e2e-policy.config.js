export const e2ePolicyConfig = {
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
    requireFirefox: false,
    requireWebkit: false,
  },
  accessibility: {
    requireAriaLabels: false,
    requireKeyboardNavigation: false,
    requireScreenReaderSupport: false,
  },
};
//# sourceMappingURL=e2e-policy.config.js.map

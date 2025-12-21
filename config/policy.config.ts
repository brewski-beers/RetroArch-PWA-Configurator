/**
 * Policy Configuration
 * Defines the policy rules and compliance requirements for the application
 * Following config-as-infrastructure and policy-as-code principles
 */

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PolicyConfig {
  version: string;
  rules: PolicyRule[];
  compliance: {
    requireAuth: boolean;
    requireMiddleware: boolean;
    requirePlugins: boolean;
    requirePaywalls: boolean;
  };
}

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
    {
      id: 'POL-002',
      name: 'Test Coverage',
      description: 'All modules must have unit tests',
      enabled: true,
      severity: 'high'
    },
    {
      id: 'POL-003',
      name: 'SOLID Principles',
      description: 'Code must follow SOLID design principles',
      enabled: true,
      severity: 'high'
    }
  ],
  compliance: {
    requireAuth: false,      // Not yet implemented
    requireMiddleware: false, // Not yet implemented
    requirePlugins: false,    // Not yet implemented
    requirePaywalls: false    // Not yet implemented
  }
};

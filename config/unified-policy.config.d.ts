import { policyConfig } from './policy.config.js';
import { testPolicyConfig } from '../tests/config/test-policy.config.js';
import { e2ePolicyConfig } from '../e2e/config/e2e-policy.config.js';
import type { BasePolicyRule } from './base-policy.config.js';
export declare class UnifiedPolicySystem {
  static getAllPolicies(): {
    application: typeof policyConfig;
    testing: typeof testPolicyConfig;
    e2e: typeof e2ePolicyConfig;
  };
  static getAllRules(): BasePolicyRule[];
  static getAllEnabledRules(): BasePolicyRule[];
  static getRulesBySeverity(
    severity: BasePolicyRule['severity']
  ): BasePolicyRule[];
  static getRulesByCategory(
    category: BasePolicyRule['category']
  ): BasePolicyRule[];
  static getRuleById(id: string): BasePolicyRule | undefined;
  static isRuleEnabled(id: string): boolean;
  static getCriticalRules(): BasePolicyRule[];
  static validateAllRules(): {
    isValid: boolean;
    errors: string[];
    summary: ReturnType<typeof UnifiedPolicySystem.getSummary>;
  };
  static getSummary(): {
    total: number;
    enabled: number;
    disabled: number;
    byCategory: {
      application: number;
      testing: number;
      e2e: number;
    };
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}
//# sourceMappingURL=unified-policy.config.d.ts.map

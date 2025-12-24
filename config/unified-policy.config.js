import { policyConfig } from './policy.config.js';
import { testPolicyConfig } from '../tests/config/test-policy.config.js';
import { e2ePolicyConfig } from '../e2e/config/e2e-policy.config.js';
import {
  getEnabledRules,
  getRulesBySeverity,
  getRulesByCategory,
} from './base-policy.config.js';
export class UnifiedPolicySystem {
  static getAllPolicies() {
    return {
      application: policyConfig,
      testing: testPolicyConfig,
      e2e: e2ePolicyConfig,
    };
  }
  static getAllRules() {
    return [
      ...policyConfig.rules,
      ...testPolicyConfig.rules,
      ...e2ePolicyConfig.rules,
    ];
  }
  static getAllEnabledRules() {
    return getEnabledRules(this.getAllRules());
  }
  static getRulesBySeverity(severity) {
    return getRulesBySeverity(this.getAllRules(), severity);
  }
  static getRulesByCategory(category) {
    return getRulesByCategory(this.getAllRules(), category);
  }
  static getRuleById(id) {
    return this.getAllRules().find((rule) => rule.id === id);
  }
  static isRuleEnabled(id) {
    const rule = this.getRuleById(id);
    return rule?.enabled ?? false;
  }
  static getCriticalRules() {
    return this.getRulesBySeverity('critical');
  }
  static validateAllRules() {
    const errors = [];
    const allRules = this.getAllRules();
    for (const rule of allRules) {
      if (!rule.id || typeof rule.id !== 'string') {
        errors.push(`Rule missing or invalid ID: ${JSON.stringify(rule)}`);
      }
      if (
        !rule.category ||
        !['application', 'testing', 'e2e'].includes(rule.category)
      ) {
        errors.push(`Rule ${rule.id} has invalid category: ${rule.category}`);
      }
      if (
        !rule.severity ||
        !['critical', 'high', 'medium', 'low'].includes(rule.severity)
      ) {
        errors.push(`Rule ${rule.id} has invalid severity: ${rule.severity}`);
      }
    }
    const ids = allRules.map((r) => r.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate rule IDs found: ${duplicates.join(', ')}`);
    }
    return {
      isValid: errors.length === 0,
      errors,
      summary: this.getSummary(),
    };
  }
  static getSummary() {
    const allRules = this.getAllRules();
    const enabledRules = this.getAllEnabledRules();
    return {
      total: allRules.length,
      enabled: enabledRules.length,
      disabled: allRules.length - enabledRules.length,
      byCategory: {
        application: policyConfig.rules.length,
        testing: testPolicyConfig.rules.length,
        e2e: e2ePolicyConfig.rules.length,
      },
      bySeverity: {
        critical: this.getRulesBySeverity('critical').length,
        high: this.getRulesBySeverity('high').length,
        medium: this.getRulesBySeverity('medium').length,
        low: this.getRulesBySeverity('low').length,
      },
    };
  }
}
//# sourceMappingURL=unified-policy.config.js.map

/**
 * Unified Policy System
 * Aggregates all policy configurations following SRP
 * Single Responsibility: Provide unified access to all policies
 */

import { policyConfig } from './policy.config.js';
import { testPolicyConfig } from '../tests/config/test-policy.config.js';
import { e2ePolicyConfig } from '../e2e/config/e2e-policy.config.js';
import type { BasePolicyRule } from './base-policy.config.js';
import {
  getEnabledRules,
  getRulesBySeverity,
  getRulesByCategory,
} from './base-policy.config.js';

/**
 * Unified policy system that aggregates all policy types
 * Follows OCP - open for extension (new policy types) closed for modification
 */
export class UnifiedPolicySystem {
  /**
   * Get all policies from all categories
   */
  static getAllPolicies(): {
    application: typeof policyConfig;
    testing: typeof testPolicyConfig;
    e2e: typeof e2ePolicyConfig;
  } {
    return {
      application: policyConfig,
      testing: testPolicyConfig,
      e2e: e2ePolicyConfig,
    };
  }

  /**
   * Get all rules across all policy categories
   */
  static getAllRules(): BasePolicyRule[] {
    return [
      ...policyConfig.rules,
      ...testPolicyConfig.rules,
      ...e2ePolicyConfig.rules,
    ];
  }

  /**
   * Get all enabled rules across all categories
   */
  static getAllEnabledRules(): BasePolicyRule[] {
    return getEnabledRules(this.getAllRules());
  }

  /**
   * Get rules by severity across all categories
   */
  static getRulesBySeverity(
    severity: BasePolicyRule['severity']
  ): BasePolicyRule[] {
    return getRulesBySeverity(this.getAllRules(), severity);
  }

  /**
   * Get rules by category
   */
  static getRulesByCategory(
    category: BasePolicyRule['category']
  ): BasePolicyRule[] {
    return getRulesByCategory(this.getAllRules(), category);
  }

  /**
   * Get a specific rule by ID
   */
  static getRuleById(id: string): BasePolicyRule | undefined {
    return this.getAllRules().find((rule) => rule.id === id);
  }

  /**
   * Check if a specific rule is enabled
   */
  static isRuleEnabled(id: string): boolean {
    const rule = this.getRuleById(id);
    return rule?.enabled ?? false;
  }

  /**
   * Get critical rules (highest priority)
   */
  static getCriticalRules(): BasePolicyRule[] {
    return this.getRulesBySeverity('critical');
  }

  /**
   * Validate that all rules follow the base policy structure
   */
  static validateAllRules(): {
    isValid: boolean;
    errors: string[];
    summary: ReturnType<typeof UnifiedPolicySystem.getSummary>;
  } {
    const errors: string[] = [];
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

    // Check for duplicate IDs
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

  /**
   * Get policy summary for reporting
   */
  static getSummary(): {
    total: number;
    enabled: number;
    disabled: number;
    byCategory: { application: number; testing: number; e2e: number };
    bySeverity: { critical: number; high: number; medium: number; low: number };
  } {
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

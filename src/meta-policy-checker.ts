/**
 * Meta Policy Checker
 * POL-000: Validates that all enabled policies are actually enforced in code
 * Follows SRP: Single responsibility to validate policy enforcement integrity
 */

import type { BasePolicyRule } from '../config/base-policy.config.js';
import { UnifiedPolicySystem } from '../config/unified-policy.config.js';

/**
 * Result of policy enforcement validation
 */
export interface PolicyEnforcementResult {
  passed: boolean;
  message: string;
  unenforced: BasePolicyRule[];
  totalEnabled: number;
  totalEnforced: number;
}

/**
 * Registry of known policy enforcers
 * Maps enforcer names to their existence status
 */
export interface EnforcerRegistry {
  [enforcerName: string]: {
    exists: boolean;
    policies: string[];
  };
}

/**
 * MetaPolicyChecker validates that all enabled policies have enforcement mechanisms
 * This prevents "policy as documentation" without actual code enforcement
 */
export class MetaPolicyChecker {
  private readonly knownEnforcers: Set<string>;

  constructor() {
    // Registry of known enforcer classes/modules
    // Add new enforcers here when creating new enforcement mechanisms
    this.knownEnforcers = new Set([
      'PolicyChecker', // Enforces POL-001 through POL-018
      'MetaPolicyChecker', // Enforces POL-000 (self-referential)
      'TestPolicyValidator', // Enforces TEST-001 through TEST-006
      'E2EPolicyValidator', // Enforces E2E-001 through E2E-006
      'TypeScriptCompiler', // Enforces POL-001 (TypeScript Strict Mode)
      'Vitest', // Enforces POL-002 (Test Coverage Thresholds)
      'ESLint', // Enforces POL-005 (ESLint Code Quality)
      'Prettier', // Enforces POL-006 (Prettier Code Formatting)
      'Husky', // Enforces POL-007 (Pre-Commit Hooks)
      'CommentClassifier', // Enforces POL-018 (Code Housekeeping)
    ]);
  }

  /**
   * Check if all enabled policies have enforcement mechanisms
   * POL-000: Enabled policies MUST specify an enforcer and that enforcer MUST exist
   */
  checkPolicyEnforcementIntegrity(): PolicyEnforcementResult {
    const allRules = UnifiedPolicySystem.getAllRules();
    const enabledRules = allRules.filter((rule) => rule.enabled);

    const unenforced: BasePolicyRule[] = [];

    for (const rule of enabledRules) {
      // Check if policy has an enforcer specified
      if (
        rule.enforcer === undefined ||
        rule.enforcer === null ||
        rule.enforcer.trim() === ''
      ) {
        unenforced.push(rule);
        continue;
      }

      // Check if the enforcer is known/registered
      if (!this.knownEnforcers.has(rule.enforcer)) {
        unenforced.push(rule);
      }
    }

    const totalEnabled = enabledRules.length;
    const totalEnforced = totalEnabled - unenforced.length;
    const passed = unenforced.length === 0;

    const message = passed
      ? `All ${totalEnabled} enabled policies have enforcement mechanisms`
      : `${unenforced.length} enabled policy(ies) lack enforcement: ${unenforced.map((r) => r.id).join(', ')}`;

    return {
      passed,
      message,
      unenforced,
      totalEnabled,
      totalEnforced,
    };
  }

  /**
   * Build a registry of enforcers showing which policies they enforce
   * Useful for auditing and documentation
   */
  buildEnforcerRegistry(): EnforcerRegistry {
    const allRules = UnifiedPolicySystem.getAllRules();
    const enabledRules = allRules.filter((rule) => rule.enabled);

    const registry: EnforcerRegistry = {};

    for (const rule of enabledRules) {
      if (
        rule.enforcer === undefined ||
        rule.enforcer === null ||
        rule.enforcer.trim() === ''
      ) {
        continue;
      }

      const enforcerName = rule.enforcer;

      if (registry[enforcerName] === undefined) {
        registry[enforcerName] = {
          exists: this.knownEnforcers.has(enforcerName),
          policies: [],
        };
      }

      registry[enforcerName]?.policies.push(rule.id);
    }

    return registry;
  }

  /**
   * Get list of all registered enforcers
   */
  getKnownEnforcers(): string[] {
    return Array.from(this.knownEnforcers).sort();
  }

  /**
   * Register a new enforcer (for testing or dynamic registration)
   */
  registerEnforcer(enforcerName: string): void {
    this.knownEnforcers.add(enforcerName);
  }

  /**
   * Check if an enforcer is registered
   */
  isEnforcerRegistered(enforcerName: string): boolean {
    return this.knownEnforcers.has(enforcerName);
  }
}

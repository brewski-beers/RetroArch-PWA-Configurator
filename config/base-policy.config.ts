/**
 * Base Policy Configuration
 * Defines common policy interface following DIP (Dependency Inversion Principle)
 * All specific policies must extend this base to ensure consistency
 */

/**
 * Base policy rule interface
 * All policy types must implement this interface (LSP - Liskov Substitution Principle)
 */
export interface BasePolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'application' | 'testing' | 'e2e' | 'meta';
  enforcer?: string; // POL-000: Name of the class/module that enforces this policy
}

/**
 * Base policy configuration interface
 * Ensures all policy configs have consistent structure (ISP - Interface Segregation)
 */
export interface BasePolicyConfig {
  version: string;
  category: 'application' | 'testing' | 'e2e' | 'meta';
  rules: BasePolicyRule[];
}

/**
 * Policy severity levels with numeric weights for prioritization
 */
export const PolicySeverity = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

/**
 * Utility function to validate policy rule structure
 */
export function isValidPolicyRule(rule: unknown): rule is BasePolicyRule {
  const r = rule as BasePolicyRule;
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.description === 'string' &&
    typeof r.enabled === 'boolean' &&
    ['critical', 'high', 'medium', 'low'].includes(r.severity) &&
    ['application', 'testing', 'e2e', 'meta'].includes(r.category)
  );
}

/**
 * Utility function to filter enabled rules
 */
export function getEnabledRules(rules: BasePolicyRule[]): BasePolicyRule[] {
  return rules.filter((rule) => rule.enabled);
}

/**
 * Utility function to get rules by severity
 */
export function getRulesBySeverity(
  rules: BasePolicyRule[],
  severity: BasePolicyRule['severity']
): BasePolicyRule[] {
  return rules.filter((rule) => rule.severity === severity);
}

/**
 * Utility function to get rules by category
 */
export function getRulesByCategory(
  rules: BasePolicyRule[],
  category: BasePolicyRule['category']
): BasePolicyRule[] {
  return rules.filter((rule) => rule.category === category);
}

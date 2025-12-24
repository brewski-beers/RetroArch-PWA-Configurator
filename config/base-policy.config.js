export const PolicySeverity = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
export function isValidPolicyRule(rule) {
  const r = rule;
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.description === 'string' &&
    typeof r.enabled === 'boolean' &&
    ['critical', 'high', 'medium', 'low'].includes(r.severity) &&
    ['application', 'testing', 'e2e'].includes(r.category)
  );
}
export function getEnabledRules(rules) {
  return rules.filter((rule) => rule.enabled);
}
export function getRulesBySeverity(rules, severity) {
  return rules.filter((rule) => rule.severity === severity);
}
export function getRulesByCategory(rules, category) {
  return rules.filter((rule) => rule.category === category);
}
//# sourceMappingURL=base-policy.config.js.map

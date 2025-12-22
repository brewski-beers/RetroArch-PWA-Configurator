export interface BasePolicyRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'application' | 'testing' | 'e2e';
}
export interface BasePolicyConfig {
    version: string;
    category: 'application' | 'testing' | 'e2e';
    rules: BasePolicyRule[];
}
export declare const PolicySeverity: {
    readonly critical: 4;
    readonly high: 3;
    readonly medium: 2;
    readonly low: 1;
};
export declare function isValidPolicyRule(rule: unknown): rule is BasePolicyRule;
export declare function getEnabledRules(rules: BasePolicyRule[]): BasePolicyRule[];
export declare function getRulesBySeverity(rules: BasePolicyRule[], severity: BasePolicyRule['severity']): BasePolicyRule[];
export declare function getRulesByCategory(rules: BasePolicyRule[], category: BasePolicyRule['category']): BasePolicyRule[];
//# sourceMappingURL=base-policy.config.d.ts.map
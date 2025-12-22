import type { BasePolicyConfig, BasePolicyRule } from './base-policy.config.js';
export interface ApplicationPolicyRule extends BasePolicyRule {
    category: 'application';
}
export interface ModuleCoverageTarget {
    pattern: string;
    description: string;
    rationale: string;
    thresholds: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
    enforced: boolean;
}
export declare const moduleCoverageTargets: ModuleCoverageTarget[];
export interface PolicyConfig extends BasePolicyConfig {
    category: 'application';
    rules: ApplicationPolicyRule[];
    compliance: {
        requireAuth: boolean;
        requireMiddleware: boolean;
        requirePlugins: boolean;
        requirePaywalls: boolean;
    };
}
export declare const policyConfig: PolicyConfig;
//# sourceMappingURL=policy.config.d.ts.map
import type { BasePolicyConfig, BasePolicyRule } from '../../config/base-policy.config.js';
export interface TestPolicyRule extends BasePolicyRule {
    category: 'testing';
}
export interface TestPolicyConfig extends BasePolicyConfig {
    category: 'testing';
    rules: TestPolicyRule[];
    coverage: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
    standards: {
        requireFactories: boolean;
        requireTypeChecking: boolean;
        requireSRP: boolean;
        requireDRY: boolean;
    };
}
export declare const testPolicyConfig: TestPolicyConfig;
//# sourceMappingURL=test-policy.config.d.ts.map
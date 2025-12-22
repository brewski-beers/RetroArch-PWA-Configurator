import type { BasePolicyConfig, BasePolicyRule } from '../../config/base-policy.config.js';
export interface E2EPolicyRule extends BasePolicyRule {
    category: 'e2e';
}
export interface E2EPolicyConfig extends BasePolicyConfig {
    category: 'e2e';
    rules: E2EPolicyRule[];
    browsers: {
        requireChromium: boolean;
        requireFirefox: boolean;
        requireWebkit: boolean;
    };
    accessibility: {
        requireAriaLabels: boolean;
        requireKeyboardNavigation: boolean;
        requireScreenReaderSupport: boolean;
    };
}
export declare const e2ePolicyConfig: E2EPolicyConfig;
//# sourceMappingURL=e2e-policy.config.d.ts.map
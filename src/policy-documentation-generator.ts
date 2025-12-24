/**
 * Policy Documentation Generator
 * Automatically generates policy documentation from unified policy system
 * Eliminates manual updates to copilot-instructions.md
 * Follows SRP: Single responsibility to generate policy docs
 */

import fs from 'node:fs';
import path from 'node:path';

import { UnifiedPolicySystem } from '../config/unified-policy.config.js';
import type { BasePolicyRule } from '../config/base-policy.config.js';

export class PolicyDocumentationGenerator {
  /**
   * Generate markdown documentation for all policies
   */
  generatePolicyDocumentation(): string {
    const allRules = UnifiedPolicySystem.getAllRules();
    const polRules = allRules.filter((r) => r.id.startsWith('POL-'));
    const testRules = allRules.filter((r) => r.id.startsWith('TEST-'));
    const e2eRules = allRules.filter((r) => r.id.startsWith('E2E-'));

    const sections = [
      this.generateHeader(),
      this.generateArchitectureDiagram(polRules, testRules, e2eRules),
      this.generateApplicationPolicies(polRules),
      this.generateTestingPolicies(testRules),
      this.generateE2EPolicies(e2eRules),
      this.generateUsageExample(),
      this.generateAddPolicyInstructions(),
    ];

    return sections.join('\n\n');
  }

  /**
   * Generate header section
   */
  private generateHeader(): string {
    return `### Policy-as-Code (CRITICAL)

**This project uses a UNIFIED three-tier policy system following SOLID principles.**`;
  }

  /**
   * Generate architecture diagram
   */
  private generateArchitectureDiagram(
    polRules: BasePolicyRule[],
    testRules: BasePolicyRule[],
    e2eRules: BasePolicyRule[]
  ): string {
    const polCount = polRules.length;
    const testCount = testRules.length;
    const e2eCount = e2eRules.length;

    return `#### Policy Architecture

\`\`\`
base-policy.config.ts (DIP: Dependency Inversion Principle)
├── policy.config.ts (Application Policies: POL-001 to POL-${String(polCount).padStart(3, '0')})
├── tests/config/test-policy.config.ts (Testing Policies: TEST-001 to TEST-${String(testCount).padStart(3, '0')})
└── e2e/config/e2e-policy.config.ts (E2E Policies: E2E-001 to E2E-${String(e2eCount).padStart(3, '0')})
    └── unified-policy.config.ts (SRP: Policy Aggregator)
\`\`\`

**ALL architectural decisions MUST reference a policy rule by ID.**`;
  }

  /**
   * Generate application policies section
   */
  private generateApplicationPolicies(rules: BasePolicyRule[]): string {
    const rulesList = rules
      .map(
        (r) =>
          `- **${r.id}**: ${r.name} (${r.severity}) - ${this.summarizeDescription(r.description)}`
      )
      .join('\n');

    return `#### Application Policies (POL-\\*)

Enforced in \`config/policy.config.ts\`:

${rulesList}`;
  }

  /**
   * Generate testing policies section
   */
  private generateTestingPolicies(rules: BasePolicyRule[]): string {
    const rulesList = rules
      .map(
        (r) =>
          `- **${r.id}**: ${r.name} (${r.severity}) - ${this.summarizeDescription(r.description)}`
      )
      .join('\n');

    return `#### Testing Policies (TEST-\\*)

Enforced in \`tests/config/test-policy.config.ts\`:

${rulesList}`;
  }

  /**
   * Generate E2E policies section
   */
  private generateE2EPolicies(rules: BasePolicyRule[]): string {
    const rulesList = rules
      .map(
        (r) =>
          `- **${r.id}**: ${r.name} (${r.severity}) - ${this.summarizeDescription(r.description)}`
      )
      .join('\n');

    return `#### E2E Policies (E2E-\\*)

Enforced in \`e2e/config/e2e-policy.config.ts\`:

${rulesList}`;
  }

  /**
   * Generate usage example
   */
  private generateUsageExample(): string {
    const totalRules = UnifiedPolicySystem.getAllRules().length;

    return `#### Using the Unified Policy System

\`\`\`typescript
import { UnifiedPolicySystem } from './config/unified-policy.config.js';

// Query all policies
const allRules = UnifiedPolicySystem.getAllRules(); // ${totalRules} rules total

// Get critical rules only
const critical = UnifiedPolicySystem.getCriticalRules();

// Get rules by category
const testingRules = UnifiedPolicySystem.getRulesByCategory('testing');

// Validate system integrity
const validation = UnifiedPolicySystem.validateAllRules();
if (!validation.isValid) {
  console.error('Policy violations:', validation.errors);
}
\`\`\``;
  }

  /**
   * Generate "Adding a New Policy Rule" instructions
   */
  private generateAddPolicyInstructions(): string {
    return `#### Adding a New Policy Rule

1. **Choose the correct policy file**:
   - Application behavior → \`config/policy.config.ts\`
   - Unit testing standards → \`tests/config/test-policy.config.ts\`
   - E2E testing standards → \`e2e/config/e2e-policy.config.ts\`

2. **Follow the base interface** (from \`base-policy.config.ts\`):

\`\`\`typescript
{
  id: 'POL-010',  // POL-* | TEST-* | E2E-*
  name: 'Clear Rule Name',
  description: 'Detailed explanation of what this rule enforces',
  enabled: true,
  severity: 'high',  // critical | high | medium | low
  category: 'application'  // application | testing | e2e
}
\`\`\`

3. **Implement enforcement** in the appropriate checker/validator

4. **Regenerate documentation**: \`npm run policy:docs\`

5. **Verify with audit**: \`npm run policy:check\` or review \`POLICY_AUDIT.md\`

**NEVER**:

- Add redundant rules across policy files
- Change base interface without updating all three policy files
- Create policies without implementation enforcement
- Skip severity classification
- Manually edit policy documentation (use generator!)

**See \`POLICY_AUDIT.md\` for complete alignment matrix and SOLID compliance details.**`;
  }

  /**
   * Summarize long descriptions for compact display
   */
  private summarizeDescription(description: string): string {
    const MAX_LENGTH = 80;

    // Take first sentence or first 80 characters
    const firstSentence = description.split('.')[0];
    if (
      firstSentence !== undefined &&
      firstSentence.length > 0 &&
      firstSentence.length <= MAX_LENGTH
    ) {
      return firstSentence;
    }
    return description.substring(0, MAX_LENGTH) + '...';
  }

  /**
   * Update copilot-instructions.md with generated policy documentation
   */
  updateCopilotInstructions(): {
    success: boolean;
    message: string;
  } {
    try {
      const instructionsPath = path.join(
        process.cwd(),
        '.github',
        'copilot-instructions.md'
      );

      if (!fs.existsSync(instructionsPath)) {
        return {
          success: false,
          message: 'copilot-instructions.md not found',
        };
      }

      const content = fs.readFileSync(instructionsPath, 'utf-8');
      const policyDocs = this.generatePolicyDocumentation();

      // Find and replace policy section
      const startMarker = '### Policy-as-Code (CRITICAL)';
      const endMarker = '## TypeScript Strict Mode (MANDATORY)';

      const startIndex = content.indexOf(startMarker);
      const endIndex = content.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        return {
          success: false,
          message:
            'Policy section markers not found in copilot-instructions.md',
        };
      }

      const before = content.substring(0, startIndex);
      const after = content.substring(endIndex);
      const updated = `${before}${policyDocs}\n\n${after}`;

      fs.writeFileSync(instructionsPath, updated, 'utf-8');

      return {
        success: true,
        message: `Updated copilot-instructions.md with ${String(UnifiedPolicySystem.getAllRules().length)} policies`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Error updating copilot-instructions.md: ${errorMessage}`,
      };
    }
  }

  /**
   * Generate policy summary for quick reference
   */
  generatePolicySummary(): string {
    const allRules = UnifiedPolicySystem.getAllRules();
    const criticalCount = UnifiedPolicySystem.getCriticalRules().length;
    const enabledCount = UnifiedPolicySystem.getAllEnabledRules().length;

    const polCount = allRules.filter((r) => r.id.startsWith('POL-')).length;
    const testCount = allRules.filter((r) => r.id.startsWith('TEST-')).length;
    const e2eCount = allRules.filter((r) => r.id.startsWith('E2E-')).length;

    const summary = [
      `📋 **Policy Summary**`,
      ``,
      `- Total Rules: ${String(allRules.length)}`,
      `- Enabled: ${String(enabledCount)}`,
      `- Critical: ${String(criticalCount)}`,
      ``,
      `**By Category:**`,
      `- Application (POL-*): ${String(polCount)}`,
      `- Testing (TEST-*): ${String(testCount)}`,
      `- E2E (E2E-*): ${String(e2eCount)}`,
    ];

    return summary.join('\n');
  }
}

/* v8 ignore next 20 */
// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new PolicyDocumentationGenerator();

  console.log('\n=== Policy Documentation Generator ===\n');

  // Generate summary
  console.log(generator.generatePolicySummary());
  console.log('\n');

  // Update copilot instructions
  const result = generator.updateCopilotInstructions();

  if (result.success) {
    console.log(`✓ ${result.message}\n`);
    process.exit(0);
  } else {
    console.error(`✗ ${result.message}\n`);
    process.exit(1);
  }
}

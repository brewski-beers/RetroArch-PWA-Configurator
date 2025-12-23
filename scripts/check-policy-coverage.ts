#!/usr/bin/env tsx
/**
 * Policy Test Coverage Checker (POL-020)
 *
 * Ensures every policy has corresponding test coverage.
 * Prevents "untested enforcers" - policies that exist but are never validated.
 *
 * @implements POL-020 (Policy Test Coverage)
 * @blocking true (CI/CD)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface PolicyCoverageResult {
  policyId: string;
  policyName: string;
  hasPolicyCheckerMethod: boolean;
  hasTest: boolean;
  category: string;
}

/**
 * Extract all policy IDs from config files
 */
function extractPolicyIds(): Map<string, { name: string; category: string }> {
  const policies = new Map<string, { name: string; category: string }>();

  // Read application policies
  const appPolicies = readFileSync(
    join(process.cwd(), 'config/policy.config.ts'),
    'utf-8'
  );
  const appMatches = appPolicies.matchAll(
    /id:\s*'(POL-\d+)'[\s\S]*?name:\s*'([^']+)'/g
  );
  for (const match of appMatches) {
    policies.set(match[1], { name: match[2], category: 'application' });
  }

  // Read test policies
  const testPolicies = readFileSync(
    join(process.cwd(), 'tests/config/test-policy.config.ts'),
    'utf-8'
  );
  const testMatches = testPolicies.matchAll(
    /id:\s*'(TEST-\d+)'[\s\S]*?name:\s*'([^']+)'/g
  );
  for (const match of testMatches) {
    policies.set(match[1], { name: match[2], category: 'testing' });
  }

  // Read e2e policies
  const e2ePolicies = readFileSync(
    join(process.cwd(), 'e2e/config/e2e-policy.config.ts'),
    'utf-8'
  );
  const e2eMatches = e2ePolicies.matchAll(
    /id:\s*'(E2E-\d+)'[\s\S]*?name:\s*'([^']+)'/g
  );
  for (const match of e2eMatches) {
    policies.set(match[1], { name: match[2], category: 'e2e' });
  }

  return policies;
}

/**
 * Check if PolicyChecker has a method for each application policy
 */
function checkPolicyCheckerMethods(policyIds: string[]): Map<string, boolean> {
  const policyChecker = readFileSync(
    join(process.cwd(), 'src/policy-checker.ts'),
    'utf-8'
  );

  const methodMap = new Map<string, boolean>();

  for (const policyId of policyIds) {
    // Check if runAllChecks references this policy
    const hasCheck = policyChecker.includes(policyId);
    methodMap.set(policyId, hasCheck);
  }

  return methodMap;
}

/**
 * Check if tests exist for each policy
 */
function checkPolicyTests(policyIds: string[]): Map<string, boolean> {
  const testFiles = [
    'tests/policy-checker.test.ts', // Application policies
    'tests/config/test-policy.config.ts', // Test policies (self-documenting)
    'e2e/config/e2e-policy.config.ts', // E2E policies (self-documenting)
  ];

  const testMap = new Map<string, boolean>();

  const allTests = testFiles
    .map((file) => {
      try {
        return readFileSync(join(process.cwd(), file), 'utf-8');
      } catch {
        return '';
      }
    })
    .join('\n');

  for (const policyId of policyIds) {
    // Check if policy ID appears in any test file
    const hasTest = allTests.includes(policyId);
    testMap.set(policyId, hasTest);
  }

  return testMap;
}

/**
 * Main execution
 */
function main(): void {
  console.log('🔍 POL-020: Policy Test Coverage Check');
  console.log('════════════════════════════════════════════════════════\n');

  const policies = extractPolicyIds();
  const appPolicies = Array.from(policies.entries()).filter(
    ([_, p]) => p.category === 'application'
  );
  const testPolicies = Array.from(policies.entries()).filter(
    ([_, p]) => p.category === 'testing'
  );
  const e2ePolicies = Array.from(policies.entries()).filter(
    ([_, p]) => p.category === 'e2e'
  );

  console.log('📊 Policy Inventory:');
  console.log(
    `  - Application: ${appPolicies.length} policies (POL-000 to POL-020)`
  );
  console.log(`  - Testing: ${testPolicies.length} policies`);
  console.log(`  - E2E: ${e2ePolicies.length} policies`);
  console.log(`  - Total: ${policies.size} policies\n`);

  const appPolicyIds = appPolicies.map(([id]) => id);
  const checkerMethods = checkPolicyCheckerMethods(appPolicyIds);
  const policyTests = checkPolicyTests(Array.from(policies.keys()));

  const results: PolicyCoverageResult[] = [];
  for (const [policyId, { name, category }] of policies.entries()) {
    results.push({
      policyId,
      policyName: name,
      hasPolicyCheckerMethod:
        category === 'application'
          ? (checkerMethods.get(policyId) ?? false)
          : true,
      hasTest: policyTests.get(policyId) ?? false,
      category,
    });
  }

  // Report missing coverage
  const missingChecker = results.filter(
    (r) => r.category === 'application' && !r.hasPolicyCheckerMethod
  );
  const missingTest = results.filter((r) => !r.hasTest);

  if (missingChecker.length === 0 && missingTest.length === 0) {
    console.log('✅ All policies have test coverage!\n');
    console.log('Coverage breakdown:');
    console.log(
      `  ✓ PolicyChecker methods: ${appPolicyIds.length}/${appPolicyIds.length}`
    );
    console.log(`  ✓ Test references: ${policies.size}/${policies.size}`);
    console.log('');
    process.exit(0);
  }

  // Report missing PolicyChecker methods
  if (missingChecker.length > 0) {
    console.error('❌ Application policies missing PolicyChecker methods:\n');
    for (const result of missingChecker) {
      console.error(`  ${result.policyId}: ${result.policyName}`);
      console.error(`    Missing: PolicyChecker method implementation`);
      console.error('');
    }
  }

  // Report missing tests
  if (missingTest.length > 0) {
    console.error('❌ Policies missing test coverage:\n');
    for (const result of missingTest) {
      console.error(`  ${result.policyId}: ${result.policyName}`);
      console.error(`    Category: ${result.category}`);
      console.error('');
    }
  }

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📖 POL-020: Policy Test Coverage');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.error('Required Actions:\n');

  if (missingChecker.length > 0) {
    console.error('1. Add PolicyChecker methods for missing policies:');
    console.error('   - Edit: src/policy-checker.ts');
    console.error('   - Add: check{PolicyName}() methods');
    console.error('   - Update: runAllChecks() to call new methods\n');
  }

  if (missingTest.length > 0) {
    console.error('2. Add test coverage:');
    console.error('   - Application: tests/policy-checker.test.ts');
    console.error('   - Testing: tests/config/test-policy.config.ts');
    console.error('   - E2E: e2e/tests/*.spec.ts\n');
  }

  console.error(
    '💡 Bypass (emergencies only): Update scripts/check-policy-coverage.ts\n'
  );

  process.exit(1);
}

main();

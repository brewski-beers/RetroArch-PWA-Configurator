#!/usr/bin/env tsx
/**
 * YAGNI Policy Enforcement (POL-018)
 *
 * Runs in pre-commit hook to detect over-engineering.
 * Blocks commits with new abstractions lacking justification.
 *
 * @implements POL-018 (YAGNI Principle)
 * @blocking true (pre-commit)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

interface YAGNIViolation {
  file: string;
  line: number;
  pattern: string;
  suggestion: string;
}

/**
 * Patterns that indicate potential over-engineering
 */
const ABSTRACTION_PATTERNS = [
  {
    regex: /abstract\s+class/,
    name: 'abstract class',
    suggestion: 'Use concrete class until second implementation needed',
  },
  {
    regex: /interface\s+\w*Factory/,
    name: 'Factory interface',
    suggestion: 'Direct construction simpler until multiple implementations',
  },
  {
    regex: /class\s+\w*(Service|Manager|Handler|Provider|Adapter)\s/,
    name: 'Service/Manager/Handler class',
    suggestion: 'Why not a simple function or direct usage?',
  },
  {
    regex: /export\s+class\s+\w*Wrapper/,
    name: 'Wrapper class',
    suggestion: 'Direct usage simpler - only wrap for actual abstraction need',
  },
];

/**
 * Check if file has YAGNI justification comment
 */
function hasYAGNIJustification(content: string): boolean {
  const justificationPatterns = [
    /YAGNI Justification:/,
    /Rule of Three:/,
    /Duplicated in \d+ places/,
    /Why not simpler:/,
    /Current problem:/,
  ];

  return justificationPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check if this is a test file or config (exempted from YAGNI checks)
 */
function isExemptFile(file: string): boolean {
  return (
    file.endsWith('.test.ts') ||
    file.endsWith('.spec.ts') ||
    file.includes('.config.ts') ||
    file.includes('/tests/') ||
    file.includes('/e2e/') ||
    file.includes('/examples/') ||
    file.includes('/docs/')
  );
}

/**
 * Detect potential YAGNI violations in staged files
 */
function checkYAGNIViolations(): YAGNIViolation[] {
  const violations: YAGNIViolation[] = [];

  try {
    // Get staged TypeScript files (newly added only)
    const stagedOutput = execSync(
      'git diff --cached --name-only --diff-filter=A',
      {
        encoding: 'utf-8',
      }
    );

    const stagedFiles = stagedOutput
      .split('\n')
      .filter((f) => f.endsWith('.ts') && !isExemptFile(f));

    if (stagedFiles.length === 0) {
      return violations;
    }

    console.log(
      `🔍 Checking ${stagedFiles.length} new TypeScript file(s) for YAGNI violations...`
    );

    for (const file of stagedFiles) {
      if (!file || !existsSync(file)) {
        continue;
      }

      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        // Check for YAGNI justification at file level
        const hasJustification = hasYAGNIJustification(content);

        lines.forEach((line, index) => {
          for (const pattern of ABSTRACTION_PATTERNS) {
            if (pattern.regex.test(line) && !hasJustification) {
              violations.push({
                file,
                line: index + 1,
                pattern: pattern.name,
                suggestion: pattern.suggestion,
              });
            }
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          console.error(`⚠️  Could not read ${file}:`, error.message);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('⚠️  Git command failed:', error.message);
    }
    // If git command fails (e.g., not in a git repo), allow commit
    return violations;
  }

  return violations;
}

/**
 * Main execution
 */
function main(): void {
  console.log('🎯 POL-018: YAGNI Policy Check');
  console.log('================================\n');

  const violations = checkYAGNIViolations();

  if (violations.length === 0) {
    console.log('✅ No YAGNI violations detected');
    console.log('   All new abstractions are justified\n');
    process.exit(0);
  }

  console.error('❌ YAGNI violations detected:\n');

  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Pattern: ${v.pattern}`);
    console.error(`    Suggestion: ${v.suggestion}`);
    console.error('');
  });

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error("📖 POL-018: YAGNI Principle (You Ain't Gonna Need It)");
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.error('Required: Add YAGNI justification comment at file top:\n');
  console.error('/**');
  console.error(' * YAGNI Justification:');
  console.error(" * - Current problem: [What you're solving NOW]");
  console.error(
    " * - Why not simpler: [Why function/direct-import won't work]"
  );
  console.error(' * - Rule of Three: [Duplicated in X places]');
  console.error(' * - Config-First tried: [Why config export insufficient]');
  console.error(' */\n');
  console.error('💡 To bypass (emergencies only): git commit --no-verify');
  console.error('📚 Learn more: docs/archive/mcp-server-experiment/\n');

  process.exit(1);
}

main();

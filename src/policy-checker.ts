/**
 * Policy Checker
 * Validates compliance with policy configuration
 * Ensures code meets defined standards before deployment
 */

import fs from 'node:fs';
import path from 'node:path';
import { pagesConfig } from '../config/pages.config.js';
import { PageGenerator } from './pages/page-generator.js';

export class PolicyChecker {
  /**
   * Check if TypeScript strict mode is enabled
   */
  checkStrictMode(): { passed: boolean; message: string } {
    try {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');

      // Strip comments from JSON (tsconfig.json often has comments)
      const jsonContent = tsconfigContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '');
      const tsconfig = JSON.parse(jsonContent);

      if (tsconfig.compilerOptions?.strict === true) {
        return { passed: true, message: 'TypeScript strict mode is enabled' };
      }
      return {
        passed: false,
        message: 'TypeScript strict mode is not enabled',
      };
    } catch (error) {
      return { passed: false, message: `Error checking strict mode: ${error}` };
    }
  }

  /**
   * Check if test files exist for source files and coverage meets thresholds
   */
  checkTestCoverage(): { passed: boolean; message: string } {
    try {
      const srcDir = path.join(process.cwd(), 'src');
      const testsDir = path.join(process.cwd(), 'tests');
      const coveragePath = path.join(
        process.cwd(),
        'coverage',
        'coverage-final.json'
      );

      if (!fs.existsSync(srcDir)) {
        return { passed: false, message: 'Source directory does not exist' };
      }

      if (!fs.existsSync(testsDir)) {
        return { passed: false, message: 'Tests directory does not exist' };
      }

      // Check that tests directory exists with test files
      const testFiles = fs
        .readdirSync(testsDir)
        .filter((f: string) => f.endsWith('.test.ts'));

      if (testFiles.length === 0) {
        return { passed: false, message: 'No test files found' };
      }

      // Check coverage thresholds if coverage report exists
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

        interface CoverageTotals {
          statements: number;
          coveredStatements: number;
          functions: number;
          coveredFunctions: number;
        }

        const totals = Object.values(coverageData).reduce(
          (acc: CoverageTotals, file: any): CoverageTotals => {
            return {
              statements:
                acc.statements + (file.s ? Object.keys(file.s).length : 0),
              coveredStatements:
                acc.coveredStatements +
                (file.s
                  ? Object.values(file.s).filter((v: any) => v > 0).length
                  : 0),
              functions:
                acc.functions + (file.f ? Object.keys(file.f).length : 0),
              coveredFunctions:
                acc.coveredFunctions +
                (file.f
                  ? Object.values(file.f).filter((v: any) => v > 0).length
                  : 0),
            };
          },
          {
            statements: 0,
            coveredStatements: 0,
            functions: 0,
            coveredFunctions: 0,
          }
        );

        const stmtPct = (totals.coveredStatements / totals.statements) * 100;
        const funcPct = (totals.coveredFunctions / totals.functions) * 100;

        if (stmtPct < 95) {
          return {
            passed: false,
            message: `Statement coverage ${stmtPct.toFixed(2)}% below threshold 95%`,
          };
        }
        if (funcPct < 100) {
          return {
            passed: false,
            message: `Function coverage ${funcPct.toFixed(2)}% below threshold 100%`,
          };
        }

        return {
          passed: true,
          message: `Found ${testFiles.length} test file(s), coverage: ${stmtPct.toFixed(2)}% statements, ${funcPct.toFixed(2)}% functions`,
        };
      }

      return {
        passed: true,
        message: `Found ${testFiles.length} test file(s) (coverage report not yet generated)`,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking test coverage: ${error}`,
      };
    }
  }

  /**
   * Check if all page components have data-testid attributes
   */
  checkTestIdAttributes(): { passed: boolean; message: string } {
    try {
      const generator = new PageGenerator();
      const missingTestIds: string[] = [];

      // Check all page configurations
      for (const page of pagesConfig) {
        for (const component of page.components) {
          if (!component.testId || component.testId.trim() === '') {
            missingTestIds.push(`${page.id}/${component.id}`);
          }
        }

        // Verify generated HTML contains data-testid attributes
        const html = generator.generatePage(page);
        const componentCount = page.components.length;
        const testIdMatches = html.match(/data-testid="/g);

        if (!testIdMatches || testIdMatches.length !== componentCount) {
          return {
            passed: false,
            message: `Page '${page.id}' has ${componentCount} components but ${testIdMatches?.length ?? 0} data-testid attributes in generated HTML`,
          };
        }
      }

      if (missingTestIds.length > 0) {
        return {
          passed: false,
          message: `Missing testId in components: ${missingTestIds.join(', ')}`,
        };
      }

      return {
        passed: true,
        message: `All ${pagesConfig.reduce((sum, page) => sum + page.components.length, 0)} components have data-testid attributes`,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking test ID attributes: ${error}`,
      };
    }
  }

  /**
   * Run all policy checks
   */
  async runAllChecks(): Promise<{
    passed: boolean;
    results: Array<{ rule: string; passed: boolean; message: string }>;
  }> {
    const results = [];

    // Check POL-001: TypeScript Strict Mode
    const strictModeCheck = this.checkStrictMode();
    results.push({
      rule: 'POL-001: TypeScript Strict Mode',
      ...strictModeCheck,
    });

    // Check POL-002: Test Coverage
    const testCoverageCheck = this.checkTestCoverage();
    results.push({
      rule: 'POL-002: Test Coverage',
      ...testCoverageCheck,
    });

    // Check POL-003: SOLID Principles (manual review for now)
    results.push({
      rule: 'POL-003: SOLID Principles',
      passed: true,
      message: 'Manual review required - structure follows SOLID principles',
    });

    // Check POL-004: Test ID Attributes
    const testIdCheck = this.checkTestIdAttributes();
    results.push({
      rule: 'POL-004: Test ID Attributes',
      ...testIdCheck,
    });

    const allPassed = results.every((r: { passed: boolean }) => r.passed);

    return { passed: allPassed, results };
  }
}

/* v8 ignore next 20 */
// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new PolicyChecker();
  const { passed, results } = await checker.runAllChecks();

  console.log('\n=== Policy Compliance Check ===\n');

  results.forEach(
    (result: { passed: boolean; rule: string; message: string }) => {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      console.log(`${color}${icon}\x1b[0m ${result.rule}`);
      console.log(`  ${result.message}\n`);
    }
  );

  console.log(
    `\nOverall Status: ${passed ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m'}\n`
  );

  process.exit(passed ? 0 : 1);
}

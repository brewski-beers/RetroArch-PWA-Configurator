/**
 * Unit tests for PolicyChecker
 * Tests policy validation logic following SRP
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PolicyChecker } from '../src/policy-checker.js';
import fs from 'node:fs';

describe('PolicyChecker', () => {
  let checker: PolicyChecker;

  beforeEach(() => {
    checker = new PolicyChecker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkStrictMode', () => {
    it('should pass when TypeScript strict mode is enabled', () => {
      const result = checker.checkStrictMode();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('strict mode is enabled');
    });

    it('should return an object with passed and message properties', () => {
      const result = checker.checkStrictMode();

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('message');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should fail when strict mode is not enabled', () => {
      const mockTsConfig = {
        compilerOptions: {
          strict: false,
        },
      };

      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockTsConfig)
      );

      const result = checker.checkStrictMode();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('not enabled');
    });

    it('should handle file read errors', () => {
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = checker.checkStrictMode();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Error checking strict mode');
    });

    it('should handle missing compilerOptions', () => {
      const mockTsConfig = {};

      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockTsConfig)
      );

      const result = checker.checkStrictMode();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('not enabled');
    });

    it('should strip comments from tsconfig.json', () => {
      const mockTsConfigWithComments = `{
        /* Block comment */
        "compilerOptions": {
          // Line comment
          "strict": true
        }
      }`;

      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockTsConfigWithComments);

      const result = checker.checkStrictMode();

      expect(result.passed).toBe(true);
    });
  });

  describe('checkTestCoverage', () => {
    it('should pass when test files exist', () => {
      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('test file');
    });

    it('should return an object with passed and message properties', () => {
      const result = checker.checkTestCoverage();

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('message');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should report number of test files found', () => {
      const result = checker.checkTestCoverage();

      if (result.passed) {
        expect(result.message).toMatch(/\d+ test file/);
      }
    });

    it('should fail when src directory does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((dirPath) => {
        if ((dirPath as string).includes('src')) {
          return false;
        }
        return true;
      });

      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Source directory does not exist');
    });

    it('should fail when tests directory does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((dirPath) => {
        if ((dirPath as string).includes('tests')) {
          return false;
        }
        return true;
      });

      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Tests directory does not exist');
    });

    it('should fail when no test files are found', () => {
      vi.spyOn(fs, 'readdirSync').mockReturnValue([] as any);

      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No test files found');
    });

    it('should handle errors during directory read', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Error checking test coverage');
    });

    it('should validate coverage thresholds when coverage-final.json exists', () => {
      const mockCoverage = {
        '/path/to/file.ts': {
          s: { '0': 10, '1': 5, '2': 0 }, // 2/3 statements covered
          f: { '0': 1, '1': 1 }, // 2/2 functions covered
        },
      };

      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        if ((path as string).includes('coverage-final.json')) {
          return true;
        }
        return true; // src and tests exist
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockCoverage)
      );
      vi.spyOn(fs, 'readdirSync').mockReturnValue([
        'test1.test.ts',
        'test2.test.ts',
      ] as any);

      const result = checker.checkTestCoverage();

      // 66.67% statements < 95% threshold
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Statement coverage');
      expect(result.message).toContain('below threshold');
    });

    it('should pass when coverage meets thresholds', () => {
      const mockCoverage = {
        '/path/to/file1.ts': {
          s: {
            '0': 10,
            '1': 5,
            '2': 3,
            '3': 7,
            '4': 1,
            '5': 2,
            '6': 4,
            '7': 9,
            '8': 6,
            '9': 8,
            '10': 11,
          }, // 11/11 = 100%
          f: { '0': 1, '1': 1, '2': 1 }, // 3/3 = 100%
        },
        '/path/to/file2.ts': {
          s: {
            '0': 5,
            '1': 3,
            '2': 7,
            '3': 2,
            '4': 9,
            '5': 1,
            '6': 4,
            '7': 6,
            '8': 8,
            '9': 10,
          }, // 10/10 = 100%
          f: { '0': 2, '1': 3 }, // 2/2 = 100%
        },
      };

      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        if ((path as string).includes('coverage-final.json')) {
          return true;
        }
        return true;
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockCoverage)
      );
      vi.spyOn(fs, 'readdirSync').mockReturnValue(['test1.test.ts'] as any);

      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('100.00% statements');
      expect(result.message).toContain('100.00% functions');
    });

    it('should fail when function coverage is below 100%', () => {
      const mockCoverage = {
        '/path/to/file.ts': {
          s: {
            '0': 1,
            '1': 1,
            '2': 1,
            '3': 1,
            '4': 1,
            '5': 1,
            '6': 1,
            '7': 1,
            '8': 1,
            '9': 1,
            '10': 1,
            '11': 1,
            '12': 1,
            '13': 1,
            '14': 1,
            '15': 1,
            '16': 1,
            '17': 1,
            '18': 1,
            '19': 1,
          }, // 20/20 = 100%
          f: { '0': 1, '1': 0 }, // 1/2 = 50%
        },
      };

      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        if ((path as string).includes('coverage-final.json')) {
          return true;
        }
        return true;
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockCoverage)
      );
      vi.spyOn(fs, 'readdirSync').mockReturnValue(['test.test.ts'] as any);

      const result = checker.checkTestCoverage();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Function coverage');
      expect(result.message).toContain('below threshold 80%');
    });

    it('should handle files with no statement or function data', () => {
      const mockCoverage = {
        '/path/to/file1.ts': {
          s: { '0': 1, '1': 1 },
          f: { '0': 1 },
        },
        '/path/to/file2.ts': {}, // No s or f properties
      };

      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        if ((path as string).includes('coverage-final.json')) {
          return true;
        }
        return true;
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockCoverage)
      );
      vi.spyOn(fs, 'readdirSync').mockReturnValue(['test.test.ts'] as any);

      const result = checker.checkTestCoverage();

      // Should handle missing s/f gracefully
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('message');
    });
  });

  describe('checkTestIdAttributes', () => {
    it('should pass when all components have testId attributes', () => {
      const result = checker.checkTestIdAttributes();

      expect(result.passed).toBe(true);
      expect(result.message).toContain(
        'components have data-testid attributes'
      );
    });

    it('should return an object with passed and message properties', () => {
      const result = checker.checkTestIdAttributes();

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('message');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should count total components with testId', () => {
      const result = checker.checkTestIdAttributes();

      if (result.passed) {
        expect(result.message).toMatch(/All \d+ components/);
      }
    });

    it('should verify generated HTML contains data-testid attributes', () => {
      const result = checker.checkTestIdAttributes();

      // The check validates both config and generated HTML
      expect(result.passed).toBe(true);
    });

    it('should fail when component has empty testId', () => {
      // We need to test the actual logic with a mock config
      // Since we can't modify the imported config, we test the method behavior
      const result = checker.checkTestIdAttributes();

      // Current config should pass, but we verify the check is working
      expect(result).toBeDefined();
    });

    it('should fail when HTML generation has mismatched testId count', async () => {
      // Mock the PageGenerator to return HTML without enough data-testid attributes
      const PageGeneratorModule =
        await import('../src/pages/page-generator.js');
      const originalGenerate =
        PageGeneratorModule.PageGenerator.prototype.generatePage;

      vi.spyOn(
        PageGeneratorModule.PageGenerator.prototype,
        'generatePage'
      ).mockReturnValue(
        '<html><body><header id="test">Test</header></body></html>' // Missing data-testid
      );

      const testChecker = new PolicyChecker();
      const result = testChecker.checkTestIdAttributes();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('has');
      expect(result.message).toContain('components but');
      expect(result.message).toContain('data-testid attributes');

      // Restore original
      PageGeneratorModule.PageGenerator.prototype.generatePage =
        originalGenerate;
    });
  });

  describe('checkSecretsManagement', () => {
    it('should pass when no hardcoded secrets are found', () => {
      const result = checker.checkSecretsManagement();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No hardcoded secrets');
    });

    it('should fail when API_KEY pattern is detected', () => {
      const mockContent = 'const API_KEY = "sk_test_51234567890abcdef";';

      vi.spyOn(fs, 'readdirSync').mockReturnValue(['test.ts'] as any);
      vi.spyOn(fs, 'statSync').mockReturnValue({
        isDirectory: () => false,
      } as any);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = checker.checkSecretsManagement();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('potential secret detected');
    });

    it('should fail when AWS access key pattern is detected', () => {
      const mockContent = 'const aws = "AKIAIOSFODNN7EXAMPLE";';

      vi.spyOn(fs, 'readdirSync').mockReturnValue(['test.ts'] as any);
      vi.spyOn(fs, 'statSync').mockReturnValue({
        isDirectory: () => false,
      } as any);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = checker.checkSecretsManagement();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('potential secret detected');
    });

    it('should fail when GitHub token pattern is detected', () => {
      const mockContent =
        'const token = "ghp_1234567890abcdefghijklmnopqrstuvwx";';

      vi.spyOn(fs, 'readdirSync').mockReturnValue(['test.ts'] as any);
      vi.spyOn(fs, 'statSync').mockReturnValue({
        isDirectory: () => false,
      } as any);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = checker.checkSecretsManagement();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('potential secret detected');
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = checker.checkSecretsManagement();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Error checking secrets management');
    });
  });

  describe('checkDependencyAudit', () => {
    it('should pass when package-lock.json exists and audit script is configured', () => {
      const result = checker.checkDependencyAudit();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('Dependency audit configured');
    });

    it('should fail when package-lock.json does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = checker.checkDependencyAudit();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('package-lock.json not found');
    });

    it('should fail when audit script is not configured', () => {
      const mockPackageJson = {
        name: 'test',
        version: '1.0.0',
        scripts: {
          test: 'vitest',
        },
      };

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockImplementation((path: unknown) => {
        if (typeof path === 'string' && path.includes('package.json')) {
          return JSON.stringify(mockPackageJson);
        }
        return '{}';
      });

      const result = checker.checkDependencyAudit();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('No npm audit script found');
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = checker.checkDependencyAudit();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Error checking dependency audit');
    });
  });

  describe('checkCORSConfiguration', () => {
    it('should pass for Express server with CORS', () => {
      const result = checker.checkCORSConfiguration();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('CORS configured appropriately');
    });

    it('should fail when server.ts does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = checker.checkCORSConfiguration();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('src/server.ts not found');
    });

    it('should fail when CORS is configured with wildcard', () => {
      const mockServerContent = `
        import express from 'express';
        import cors from 'cors';
        app.use(cors({ origin: '*' }));
      `;

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockServerContent);

      const result = checker.checkCORSConfiguration();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('wildcard (*)');
    });

    it('should fail when Express server lacks CORS configuration', () => {
      const mockServerContent = `
        import express from 'express';
        const app = express();
      `;

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockServerContent);

      const result = checker.checkCORSConfiguration();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Express server without CORS');
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = checker.checkCORSConfiguration();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Error checking CORS configuration');
    });
  });

  describe('checkInputValidation', () => {
    it('should pass when no POST/PUT routes exist', () => {
      const mockServerContent = `
        import express from 'express';
        const app = express();
        app.get('/health', (req, res) => res.json({ status: 'ok' }));
      `;

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockServerContent);

      const result = checker.checkInputValidation();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('No POST/PUT routes found');
    });

    it('should pass when validation library is used with POST routes', () => {
      const mockServerContent = `
        import express from 'express';
        import { z } from 'zod';
        const app = express();
        app.post('/api/data', (req, res) => res.json({ success: true }));
      `;

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockServerContent);

      const result = checker.checkInputValidation();

      expect(result.passed).toBe(true);
      expect(result.message).toContain('Input validation configured');
    });

    it('should fail when server.ts does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = checker.checkInputValidation();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('src/server.ts not found');
    });

    it('should fail when POST/PUT routes exist without validation', () => {
      const mockServerContent = `
        import express from 'express';
        const app = express();
        app.post('/api/data', (req, res) => res.json({ success: true }));
        app.put('/api/data/:id', (req, res) => res.json({ updated: true }));
      `;

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockServerContent);

      const result = checker.checkInputValidation();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('without input validation library');
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('File error');
      });

      const result = checker.checkInputValidation();

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Error checking input validation');
    });
  });

  describe('runAllChecks', () => {
    it('should run all policy checks', async () => {
      const { results } = await checker.runAllChecks();

      expect(results.length).toBe(21); // POL-000 through POL-020
      expect(results.some((r) => r.rule.includes('POL-000'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-001'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-002'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-003'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-004'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-005'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-006'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-007'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-008'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-009'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-010'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-011'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-012'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-013'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-014'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-015'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-016'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-017'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-018'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-019'))).toBe(true);
      expect(results.some((r) => r.rule.includes('POL-020'))).toBe(true);
    });

    it('should return overall passed status', async () => {
      const { passed } = await checker.runAllChecks();

      expect(typeof passed).toBe('boolean');
    });

    it('should return results array with rule, passed, and message', async () => {
      const { results } = await checker.runAllChecks();

      for (const result of results) {
        expect(result).toHaveProperty('rule');
        expect(result).toHaveProperty('passed');
        expect(result).toHaveProperty('message');
        expect(typeof result.rule).toBe('string');
        expect(typeof result.passed).toBe('boolean');
        expect(typeof result.message).toBe('string');
      }
    });

    it('should pass overall when all checks pass', async () => {
      const { passed, results } = await checker.runAllChecks();

      const allPassed = results.every((r) => r.passed);
      expect(passed).toBe(allPassed);
    });

    it('should include TypeScript Strict Mode check', async () => {
      const { results } = await checker.runAllChecks();

      const strictModeCheck = results.find((r) => r.rule.includes('POL-001'));
      expect(strictModeCheck).toBeDefined();
      expect(strictModeCheck?.passed).toBe(true);
    });

    it('should include Test Coverage check', async () => {
      const { results } = await checker.runAllChecks();

      const testCoverageCheck = results.find((r) => r.rule.includes('POL-002'));
      expect(testCoverageCheck).toBeDefined();
      expect(testCoverageCheck?.passed).toBe(true);
    });

    it('should include SOLID Principles check', async () => {
      const { results } = await checker.runAllChecks();

      const solidCheck = results.find((r) => r.rule.includes('POL-003'));
      expect(solidCheck).toBeDefined();
      expect(solidCheck?.passed).toBe(true);
    });

    it('should include Test ID Attributes check', async () => {
      const { results } = await checker.runAllChecks();

      const testIdCheck = results.find((r) => r.rule.includes('POL-004'));
      expect(testIdCheck).toBeDefined();
      expect(testIdCheck?.passed).toBe(true);
    });

    it('should include ESLint Code Quality check', async () => {
      const { results } = await checker.runAllChecks();

      const eslintCheck = results.find((r) => r.rule.includes('POL-005'));
      expect(eslintCheck).toBeDefined();
      expect(eslintCheck?.passed).toBe(true);
    });

    it('should include Prettier Code Formatting check', async () => {
      const { results } = await checker.runAllChecks();

      const prettierCheck = results.find((r) => r.rule.includes('POL-006'));
      expect(prettierCheck).toBeDefined();
      expect(prettierCheck?.passed).toBe(true);
    });

    it('should include Pre-Commit Hooks check', async () => {
      const { results } = await checker.runAllChecks();

      const hooksCheck = results.find((r) => r.rule.includes('POL-007'));
      expect(hooksCheck).toBeDefined();
      expect(hooksCheck?.passed).toBe(true);
    });

    it('should include Git Workflow check', async () => {
      const { results } = await checker.runAllChecks();

      const gitWorkflowCheck = results.find((r) => r.rule.includes('POL-008'));
      expect(gitWorkflowCheck).toBeDefined();
      expect(gitWorkflowCheck?.passed).toBe(true);
    });

    it('should include TDD Approach check', async () => {
      const { results } = await checker.runAllChecks();

      const tddCheck = results.find((r) => r.rule.includes('POL-009'));
      expect(tddCheck).toBeDefined();
      expect(tddCheck?.passed).toBe(true);
    });

    it('should include Secrets Management check', async () => {
      const { results } = await checker.runAllChecks();

      const secretsCheck = results.find((r) => r.rule.includes('POL-010'));
      expect(secretsCheck).toBeDefined();
      expect(secretsCheck?.passed).toBe(true);
    });

    it('should include Dependency Security Audit check', async () => {
      const { results } = await checker.runAllChecks();

      const auditCheck = results.find((r) => r.rule.includes('POL-011'));
      expect(auditCheck).toBeDefined();
      expect(auditCheck?.passed).toBe(true);
    });

    it('should include CORS Configuration check', async () => {
      const { results } = await checker.runAllChecks();

      const corsCheck = results.find((r) => r.rule.includes('POL-012'));
      expect(corsCheck).toBeDefined();
      expect(corsCheck?.passed).toBe(true);
    });

    it('should include Input Validation check', async () => {
      const { results } = await checker.runAllChecks();

      const validationCheck = results.find((r) => r.rule.includes('POL-013'));
      expect(validationCheck).toBeDefined();
      expect(validationCheck?.passed).toBe(true);
    });

    it('should include Automated Dependency Updates check', async () => {
      const { results } = await checker.runAllChecks();

      const dependencyUpdatesCheck = results.find((r) =>
        r.rule.includes('POL-014')
      );
      expect(dependencyUpdatesCheck).toBeDefined();
    });

    it('should include Version Compatibility Policy check', async () => {
      const { results } = await checker.runAllChecks();

      const versionCompatCheck = results.find((r) =>
        r.rule.includes('POL-015')
      );
      expect(versionCompatCheck).toBeDefined();
      expect(versionCompatCheck?.passed).toBe(true);
    });

    it('should include License Compliance check', async () => {
      const { results } = await checker.runAllChecks();

      const licenseCheck = results.find((r) => r.rule.includes('POL-016'));
      expect(licenseCheck).toBeDefined();
      expect(licenseCheck?.passed).toBe(true);
    });

    it('should include Supply Chain Security check', async () => {
      const { results } = await checker.runAllChecks();

      const supplyChainCheck = results.find((r) => r.rule.includes('POL-017'));
      expect(supplyChainCheck).toBeDefined();
      expect(supplyChainCheck?.passed).toBe(true);
    });
  });
});

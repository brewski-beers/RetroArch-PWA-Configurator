/**
 * Tests for HousekeepingScanner
 * Follows TEST-001: Use test factories for all test data
 * Follows TEST-002: Each test tests one specific behavior (SRP)
 * Follows TEST-003: All test data is properly typed
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { HousekeepingScanner } from '../src/housekeeping/housekeeping-scanner.js';
import { CommentClassifier } from '../src/housekeeping/comment-classifier.js';
import type { BasePolicyRule } from '../config/base-policy.config.js';

/**
 * Test Factory: Create a mock policy rule
 * Follows TEST-001: Factory pattern for test data creation
 */
function createMockPolicy(id: string, enabled: boolean = true): BasePolicyRule {
  return {
    id,
    name: `Mock Policy ${id}`,
    description: `Test policy ${id}`,
    enabled,
    severity: 'high',
    category: 'application',
  };
}

/**
 * Test Factory: Create a temporary test file
 * Follows TEST-001: Factory pattern for consistent test setup
 */
function createTestFile(
  dir: string,
  filename: string,
  content: string
): string {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Test Factory: Create a temporary test directory
 */
function createTestDirectory(baseName: string = 'test-housekeeping'): string {
  const tempDir = path.join(process.cwd(), `${baseName}-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up test directory
 */
function cleanupTestDirectory(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('HousekeepingScanner', () => {
  let scanner: HousekeepingScanner;
  let classifier: CommentClassifier;
  let testDir: string;

  beforeEach(() => {
    // Arrange: Setup with mock policies
    const mockPolicies = [
      createMockPolicy('POL-001', true),
      createMockPolicy('POL-002', false), // Inactive
      createMockPolicy('TEST-001', true),
    ];
    classifier = new CommentClassifier(mockPolicies);

    // Create temporary test directory
    testDir = createTestDirectory();
    scanner = new HousekeepingScanner(classifier, testDir);
  });

  afterEach(() => {
    // Cleanup: Remove temporary test files
    cleanupTestDirectory(testDir);
  });

  describe('File Scanning', () => {
    it('should scan TypeScript files in directory', () => {
      // Arrange
      const content = `
// TODO: Regular todo
export function test() {
  return true;
}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(1);
      expect(report.genericTodos[0]!.content).toBe('TODO: Regular todo');
    });

    it('should scan nested directories', () => {
      // Arrange
      const subDir = path.join(testDir, 'subdirectory');
      fs.mkdirSync(subDir, { recursive: true });

      const content = `
// TODO: Nested todo
export const value = 42;
`;
      createTestFile(subDir, 'nested.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(1);
    });

    it('should exclude node_modules directory', () => {
      // Arrange
      const nodeModulesDir = path.join(testDir, 'node_modules');
      fs.mkdirSync(nodeModulesDir, { recursive: true });

      const content = `
// TODO: Should be ignored
export const value = 42;
`;
      createTestFile(nodeModulesDir, 'ignored.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(0);
    });

    it('should exclude dist directory', () => {
      // Arrange
      const distDir = path.join(testDir, 'dist');
      fs.mkdirSync(distDir, { recursive: true });

      const content = `
// TODO: Should be ignored
export const value = 42;
`;
      createTestFile(distDir, 'ignored.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(0);
    });

    it('should exclude test files', () => {
      // Arrange
      const content = `
// TODO: Test todo
export const value = 42;
`;
      createTestFile(testDir, 'example.test.ts', content);
      createTestFile(testDir, 'example.spec.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(0);
    });
  });

  describe('Comment Detection', () => {
    it('should detect policy-referenced TODOs', () => {
      // Arrange
      const content = `
// TODO(POL-001): Implement feature
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(0);
      // Policy TODOs are tracked but not as generic
    });

    it('should detect obsolete policy TODOs', () => {
      // Arrange
      const content = `
// TODO(POL-002): Old policy reference
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.obsoleteTodos.length).toBe(1);
      expect(report.obsoleteTodos[0]!.policyRef).toBe('POL-002');
    });

    it('should detect FIXME comments', () => {
      // Arrange
      const content = `
// FIXME: Critical bug
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.fixmes.length).toBe(1);
      expect(report.fixmes[0]!.content).toBe('FIXME: Critical bug');
    });

    it('should detect HACK comments', () => {
      // Arrange
      const content = `
// HACK: Temporary workaround
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.hacks.length).toBe(1);
      expect(report.hacks[0]!.content).toBe('HACK: Temporary workaround');
    });

    it('should detect commented-out code', () => {
      // Arrange
      const content = `
// const oldImplementation = () => {
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.disabledCode.length).toBe(1);
    });

    it('should skip ESLint directive comments', () => {
      // Arrange
      const content = `
// eslint-disable-next-line no-console
console.log('test');
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.summary.totalIssues).toBe(0);
    });

    it('should skip empty comments', () => {
      // Arrange
      const content = `
//
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.summary.totalIssues).toBe(0);
    });

    it('should skip documentation comments', () => {
      // Arrange
      const content = `
// This is a regular comment explaining the code
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.summary.totalIssues).toBe(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate summary with totalIssues count', () => {
      // Arrange
      const content = `
// TODO: Task 1
// FIXME: Bug 1
// HACK: Workaround 1
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      const THREE_ISSUES = 3;
      expect(report.summary.totalIssues).toBe(THREE_ISSUES);
    });

    it('should generate byType statistics', () => {
      // Arrange
      const content = `
// TODO: Task 1
// TODO: Task 2
// FIXME: Bug 1
export function test() {}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.summary.byType['generic-todo']).toBe(2);
      expect(report.summary.byType['fixme']).toBe(1);
    });

    it('should generate byFile statistics', () => {
      // Arrange
      const content1 = `
// TODO: Task 1
// FIXME: Bug 1
`;
      const content2 = `
// TODO: Task 2
`;
      const file1 = createTestFile(testDir, 'file1.ts', content1);
      const file2 = createTestFile(testDir, 'file2.ts', content2);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.summary.byFile[file1]).toBe(2);
      expect(report.summary.byFile[file2]).toBe(1);
    });

    it('should report zero issues for clean code', () => {
      // Arrange
      const content = `
// Regular documentation comment
export function test() {
  return 42;
}
`;
      createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.summary.totalIssues).toBe(0);
      expect(report.obsoleteTodos.length).toBe(0);
      expect(report.genericTodos.length).toBe(0);
      expect(report.fixmes.length).toBe(0);
      expect(report.hacks.length).toBe(0);
      expect(report.disabledCode.length).toBe(0);
    });
  });

  describe('Multiple Files', () => {
    it('should aggregate issues from multiple files', () => {
      // Arrange
      const content1 = `
// TODO: Task 1
export const a = 1;
`;
      const content2 = `
// TODO: Task 2
export const b = 2;
`;
      createTestFile(testDir, 'file1.ts', content1);
      createTestFile(testDir, 'file2.ts', content2);

      // Act
      const report = scanner.scan();

      // Assert
      expect(report.genericTodos.length).toBe(2);
    });

    it('should track line numbers correctly in each file', () => {
      // Arrange
      const content = `
export const a = 1;
// TODO: Line 3
export const b = 2;
`;
      const file = createTestFile(testDir, 'test.ts', content);

      // Act
      const report = scanner.scan();

      // Assert
      const THREE = 3;
      expect(report.genericTodos[0]!.line).toBe(THREE);
      expect(report.genericTodos[0]!.file).toBe(file);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent directory gracefully', () => {
      // Arrange
      const nonExistentDir = path.join(testDir, 'does-not-exist');
      const emptyScanner = new HousekeepingScanner(classifier, nonExistentDir);

      // Act
      const report = emptyScanner.scan();

      // Assert
      expect(report.summary.totalIssues).toBe(0);
    });

    it('should handle empty directory', () => {
      // Arrange
      const emptyDir = path.join(testDir, 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });
      const emptyScanner = new HousekeepingScanner(classifier, emptyDir);

      // Act
      const report = emptyScanner.scan();

      // Assert
      expect(report.summary.totalIssues).toBe(0);
    });

    it('should return source directory', () => {
      // Act
      const sourceDir = scanner.getSourceDirectory();

      // Assert
      expect(sourceDir).toBe(testDir);
    });
  });
});

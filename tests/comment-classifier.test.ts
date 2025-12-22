/**
 * Tests for CommentClassifier
 * Follows TEST-001: Use test factories for all test data
 * Follows TEST-002: Each test tests one specific behavior (SRP)
 * Follows TEST-003: All test data is properly typed
 */

import { describe, it, expect, beforeEach } from 'vitest';
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
 * Test Factory: Create a comment for classification
 * Follows TEST-001: Factory pattern avoids magic values
 */
function createCommentInput(
  text: string,
  file: string = 'test.ts',
  line: number = 1
): { text: string; file: string; line: number } {
  return { text, file, line };
}

describe('CommentClassifier', () => {
  let classifier: CommentClassifier;

  beforeEach(() => {
    // Arrange: Setup with mock policies
    const mockPolicies = [
      createMockPolicy('POL-001', true),
      createMockPolicy('POL-002', true),
      createMockPolicy('POL-003', false), // Inactive policy
      createMockPolicy('TEST-001', true),
      createMockPolicy('E2E-001', true),
    ];
    classifier = new CommentClassifier(mockPolicies);
  });

  describe('Policy-Referenced TODOs', () => {
    it('should classify TODO with active policy reference as policy-todo', () => {
      // Arrange
      const input = createCommentInput('TODO(POL-001): Implement feature');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('policy-todo');
      expect(result.policyRef).toBe('POL-001');
      expect(result.isObsolete).toBe(false);
      expect(result.content).toBe(input.text);
    });

    it('should classify TODO with inactive policy reference as obsolete', () => {
      // Arrange
      const input = createCommentInput('TODO(POL-003): Old feature');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('policy-todo');
      expect(result.policyRef).toBe('POL-003');
      expect(result.isObsolete).toBe(true);
    });

    it('should support TEST-* policy references', () => {
      // Arrange
      const input = createCommentInput('TODO(TEST-001): Add test coverage');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('policy-todo');
      expect(result.policyRef).toBe('TEST-001');
      expect(result.isObsolete).toBe(false);
    });

    it('should support E2E-* policy references', () => {
      // Arrange
      const input = createCommentInput('TODO(E2E-001): Add E2E test');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('policy-todo');
      expect(result.policyRef).toBe('E2E-001');
      expect(result.isObsolete).toBe(false);
    });
  });

  describe('Generic TODOs', () => {
    it('should classify TODO without policy reference as generic-todo', () => {
      // Arrange
      const input = createCommentInput('TODO: Fix this later');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('generic-todo');
      expect(result.policyRef).toBeUndefined();
      expect(result.isObsolete).toBe(false);
    });

    it('should classify TODO with colon as generic-todo', () => {
      // Arrange
      const input = createCommentInput('TODO: Refactor this method');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('generic-todo');
    });

    it('should classify TODO without colon as generic-todo', () => {
      // Arrange
      const input = createCommentInput('TODO implement feature');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('generic-todo');
    });
  });

  describe('FIXME Comments', () => {
    it('should classify FIXME with colon as fixme', () => {
      // Arrange
      const input = createCommentInput('FIXME: Critical bug here');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('fixme');
    });

    it('should classify FIXME without colon as fixme', () => {
      // Arrange
      const input = createCommentInput('FIXME urgent issue');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('fixme');
    });
  });

  describe('HACK Comments', () => {
    it('should classify HACK with colon as hack', () => {
      // Arrange
      const input = createCommentInput('HACK: Temporary workaround');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('hack');
    });

    it('should classify HACK without colon as hack', () => {
      // Arrange
      const input = createCommentInput('HACK temporary fix');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('hack');
    });
  });

  describe('NOTE Comments', () => {
    it('should classify NOTE with colon as note', () => {
      // Arrange
      const input = createCommentInput('NOTE: Important information');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('note');
    });
  });

  describe('Commented-Out Code Detection', () => {
    it('should detect commented-out code with semicolon', () => {
      // Arrange
      const input = createCommentInput('const x = 10;');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('disabled-code');
    });

    it('should detect commented-out function declaration', () => {
      // Arrange
      const input = createCommentInput('function doSomething() {');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('disabled-code');
    });

    it('should detect commented-out arrow function', () => {
      // Arrange
      const input = createCommentInput('const handler = () => {');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('disabled-code');
    });

    it('should detect commented-out import statement', () => {
      // Arrange
      const input = createCommentInput("import { foo } from 'bar';");

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('disabled-code');
    });

    it('should not classify short comments as code', () => {
      // Arrange
      const input = createCommentInput('Short');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('documentation');
    });
  });

  describe('Documentation Comments', () => {
    it('should classify regular comments as documentation', () => {
      // Arrange
      const input = createCommentInput('This is a regular comment');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('documentation');
    });

    it('should classify JSDoc-style comments as documentation', () => {
      // Arrange
      const input = createCommentInput('* Returns the user name');

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.type).toBe('documentation');
    });
  });

  describe('File and Line Information', () => {
    it('should preserve file path in comment', () => {
      // Arrange
      const input = createCommentInput('TODO: test', 'src/test.ts', 42);

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.file).toBe('src/test.ts');
    });

    it('should preserve line number in comment', () => {
      // Arrange
      const input = createCommentInput('TODO: test', 'src/test.ts', 42);

      // Act
      const result = classifier.classify(input.text, input.file, input.line);

      // Assert
      expect(result.line).toBe(42);
    });
  });

  describe('Policy Activity Queries', () => {
    it('should return active policy IDs', () => {
      // Act
      const activePolicies = classifier.getActivePolicyIds();

      // Assert
      expect(activePolicies).toContain('POL-001');
      expect(activePolicies).toContain('POL-002');
      expect(activePolicies).toContain('TEST-001');
      expect(activePolicies).toContain('E2E-001');
      expect(activePolicies).not.toContain('POL-003');
    });

    it('should return inactive policy IDs', () => {
      // Act
      const inactivePolicies = classifier.getInactivePolicyIds();

      // Assert
      expect(inactivePolicies).toContain('POL-003');
      expect(inactivePolicies).not.toContain('POL-001');
      expect(inactivePolicies).not.toContain('POL-002');
    });
  });
});

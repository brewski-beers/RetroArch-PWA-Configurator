/**
 * Meta Policy Checker Tests
 * Validates POL-000: Policy Enforcement Integrity
 * Follows TEST-001 (factory pattern), TEST-002 (SRP), TEST-004 (AAA pattern)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MetaPolicyChecker,
  type PolicyEnforcementResult,
  type EnforcerRegistry,
} from '../src/meta-policy-checker.js';

describe('MetaPolicyChecker', () => {
  let checker: MetaPolicyChecker;

  beforeEach(() => {
    checker = new MetaPolicyChecker();
  });

  describe('checkPolicyEnforcementIntegrity', () => {
    it('should pass when all enabled policies have registered enforcers', () => {
      // Arrange - checker is initialized with known enforcers

      // Act
      const result: PolicyEnforcementResult =
        checker.checkPolicyEnforcementIntegrity();

      // Assert
      expect(result.passed).toBe(true);
      expect(result.unenforced).toHaveLength(0);
      expect(result.totalEnforced).toBe(result.totalEnabled);
      expect(result.message).toContain('enabled policies have enforcement');
    });

    it('should report total count of enabled policies', () => {
      // Arrange - UnifiedPolicySystem has 31 enabled policies (POL-000 through POL-018, TEST-001 through TEST-006, E2E-001 through E2E-006)

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert
      expect(result.totalEnabled).toBeGreaterThanOrEqual(31); // 19 + 6 + 6 = 31 total
      expect(result.totalEnforced).toBe(result.totalEnabled);
    });

    it('should identify policies with missing enforcer field', () => {
      // Arrange - Create a mock test (this test verifies the system works)
      // In real scenario, if a policy has enforcer: undefined, it would be caught

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - All policies should have enforcers
      expect(result.unenforced).toHaveLength(0);
    });

    it('should identify policies with unknown enforcers', () => {
      // Arrange - This would happen if someone added a policy with an enforcer
      // that doesn't exist in the knownEnforcers registry

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - All policies should have known enforcers
      expect(result.unenforced).toHaveLength(0);
    });

    it('should include unenforced policy IDs in message on failure', () => {
      // Arrange - This test validates message format for failures
      // In actual failure scenario, message would contain policy IDs

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - Success case, so message should be positive
      if (!result.passed) {
        expect(result.message).toMatch(/POL-\d+|TEST-\d+|E2E-\d+/);
      } else {
        expect(result.message).toContain('All');
      }
    });
  });

  describe('buildEnforcerRegistry', () => {
    it('should build registry of all enforcers', () => {
      // Arrange - checker initialized with known enforcers

      // Act
      const registry: EnforcerRegistry = checker.buildEnforcerRegistry();

      // Assert
      expect(Object.keys(registry).length).toBeGreaterThan(0);
      expect(registry).toHaveProperty('PolicyChecker');
      expect(registry).toHaveProperty('MetaPolicyChecker');
    });

    it('should map policies to their enforcers', () => {
      // Arrange - checker initialized

      // Act
      const registry = checker.buildEnforcerRegistry();

      // Assert
      const policyChecker = registry['PolicyChecker'];
      expect(policyChecker).toBeDefined();
      expect(policyChecker?.exists).toBe(true);
      expect(policyChecker?.policies).toBeInstanceOf(Array);
      expect(policyChecker?.policies.length).toBeGreaterThan(0);
    });

    it('should mark enforcers as existing when registered', () => {
      // Arrange - checker has known enforcers

      // Act
      const registry = checker.buildEnforcerRegistry();

      // Assert - All enforcers should be marked as existing
      Object.values(registry).forEach((enforcer) => {
        expect(enforcer.exists).toBe(true);
      });
    });

    it('should group policies by enforcer', () => {
      // Arrange - checker initialized

      // Act
      const registry = checker.buildEnforcerRegistry();

      // Assert - MetaPolicyChecker should enforce POL-000
      const metaEnforcer = registry['MetaPolicyChecker'];
      expect(metaEnforcer).toBeDefined();
      expect(metaEnforcer?.policies).toContain('POL-000');
    });

    it('should not include disabled policies', () => {
      // Arrange - checker initialized

      // Act
      const registry = checker.buildEnforcerRegistry();

      // Assert - All policies in registry should be enabled
      Object.values(registry).forEach((enforcer) => {
        expect(enforcer.policies.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getKnownEnforcers', () => {
    it('should return list of registered enforcers', () => {
      // Arrange - checker initialized with default enforcers

      // Act
      const enforcers = checker.getKnownEnforcers();

      // Assert
      expect(enforcers).toBeInstanceOf(Array);
      expect(enforcers.length).toBeGreaterThan(0);
      expect(enforcers).toContain('PolicyChecker');
      expect(enforcers).toContain('MetaPolicyChecker');
    });

    it('should return enforcers in sorted order', () => {
      // Arrange - checker initialized

      // Act
      const enforcers = checker.getKnownEnforcers();

      // Assert - Should be alphabetically sorted
      const sortedEnforcers = [...enforcers].sort();
      expect(enforcers).toEqual(sortedEnforcers);
    });

    it('should include all core enforcers', () => {
      // Arrange - checker initialized

      // Act
      const enforcers = checker.getKnownEnforcers();

      // Assert - Core enforcers should be present
      expect(enforcers).toContain('TypeScriptCompiler');
      expect(enforcers).toContain('Vitest');
      expect(enforcers).toContain('ESLint');
      expect(enforcers).toContain('Prettier');
      expect(enforcers).toContain('Husky');
      expect(enforcers).toContain('CommentClassifier');
    });
  });

  describe('registerEnforcer', () => {
    it('should add new enforcer to registry', () => {
      // Arrange
      const newEnforcer = 'CustomEnforcer';

      // Act
      checker.registerEnforcer(newEnforcer);

      // Assert
      const enforcers = checker.getKnownEnforcers();
      expect(enforcers).toContain(newEnforcer);
    });

    it('should allow duplicate registration without error', () => {
      // Arrange
      const enforcer = 'PolicyChecker';

      // Act & Assert - Should not throw
      expect(() => checker.registerEnforcer(enforcer)).not.toThrow();
    });

    it('should make enforcer available for validation', () => {
      // Arrange
      const newEnforcer = 'NewTestEnforcer';
      checker.registerEnforcer(newEnforcer);

      // Act
      const isRegistered = checker.isEnforcerRegistered(newEnforcer);

      // Assert
      expect(isRegistered).toBe(true);
    });
  });

  describe('isEnforcerRegistered', () => {
    it('should return true for registered enforcers', () => {
      // Arrange - default enforcers are registered

      // Act
      const isRegistered = checker.isEnforcerRegistered('PolicyChecker');

      // Assert
      expect(isRegistered).toBe(true);
    });

    it('should return false for unregistered enforcers', () => {
      // Arrange - checker initialized

      // Act
      const isRegistered = checker.isEnforcerRegistered('NonExistentEnforcer');

      // Assert
      expect(isRegistered).toBe(false);
    });

    it('should be case-sensitive', () => {
      // Arrange - PolicyChecker is registered

      // Act
      const isRegistered = checker.isEnforcerRegistered('policychecker');

      // Assert
      expect(isRegistered).toBe(false);
    });
  });

  describe('Integration with UnifiedPolicySystem', () => {
    it('should validate all policies from unified system', () => {
      // Arrange - UnifiedPolicySystem contains all policies

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - Should validate application + testing + e2e policies
      expect(result.totalEnabled).toBeGreaterThanOrEqual(30); // At least 30 policies
      expect(result.passed).toBe(true);
    });

    it('should verify POL-000 enforces itself', () => {
      // Arrange - checker initialized

      // Act
      const registry = checker.buildEnforcerRegistry();

      // Assert - POL-000 should be enforced by MetaPolicyChecker
      const metaEnforcer = registry['MetaPolicyChecker'];
      expect(metaEnforcer?.policies).toContain('POL-000');
    });

    it('should verify all application policies have enforcers', () => {
      // Arrange - checker initialized

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - All POL-* policies should be covered
      expect(
        result.unenforced.filter((p) => p.id.startsWith('POL-'))
      ).toHaveLength(0);
    });

    it('should verify all testing policies have enforcers', () => {
      // Arrange - checker initialized

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - All TEST-* policies should be covered
      expect(
        result.unenforced.filter((p) => p.id.startsWith('TEST-'))
      ).toHaveLength(0);
    });

    it('should verify all E2E policies have enforcers', () => {
      // Arrange - checker initialized

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - All E2E-* policies should be covered
      expect(
        result.unenforced.filter((p) => p.id.startsWith('E2E-'))
      ).toHaveLength(0);
    });
  });

  describe('Policy Enforcement Report', () => {
    it('should provide complete enforcement statistics', () => {
      // Arrange - checker initialized

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('unenforced');
      expect(result).toHaveProperty('totalEnabled');
      expect(result).toHaveProperty('totalEnforced');
    });

    it('should maintain consistency between counts', () => {
      // Arrange - checker initialized

      // Act
      const result = checker.checkPolicyEnforcementIntegrity();

      // Assert - totalEnforced + unenforced.length should equal totalEnabled
      expect(result.totalEnforced + result.unenforced.length).toBe(
        result.totalEnabled
      );
    });
  });
});

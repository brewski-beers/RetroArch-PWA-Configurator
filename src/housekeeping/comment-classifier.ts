/**
 * Comment Classification System
 * Classifies code comments into actionable categories for housekeeping
 * Follows SRP: Single responsibility of comment categorization
 * Follows DIP: Depends on PolicyRule abstraction
 */

import type { BasePolicyRule } from '../../config/base-policy.config.js';

/**
 * Types of comments found in code
 */
export type CommentType =
  | 'policy-todo' // TODO(POL-XXX): with policy reference
  | 'generic-todo' // TODO: without policy reference
  | 'fixme' // Urgent issues marked with FIXME
  | 'hack' // HACK: temporary workaround
  | 'note' // NOTE: informational
  | 'documentation' // JSDoc or regular comment
  | 'debug' // console.log, debugging code
  | 'disabled-code'; // Commented-out code blocks

/**
 * Structured representation of a code comment
 */
export interface Comment {
  /** Type of comment */
  type: CommentType;
  /** Full comment text */
  content: string;
  /** File path */
  file: string;
  /** Line number (1-based) */
  line: number;
  /** Policy reference (e.g., POL-002, TEST-001) */
  policyRef?: string;
  /** Justification text (if provided) */
  justification?: string;
  /** Whether this comment references an inactive policy */
  isObsolete?: boolean;
}

/**
 * Classifies comments based on content and context
 * Uses policy rules to detect obsolete TODOs
 */
export class CommentClassifier {
  private readonly policyRules: Map<string, BasePolicyRule>;

  constructor(policyRules: BasePolicyRule[]) {
    this.policyRules = new Map(policyRules.map((rule) => [rule.id, rule]));
  }

  /**
   * Classify a comment based on its content and context
   */
  classify(commentText: string, file: string, line: number): Comment {
    // Extract policy reference (e.g., TODO(POL-002):, TODO(TEST-001):, TODO(E2E-001):)
    const policyMatch = commentText.match(/TODO\(([A-Z0-9]+-\d+)\):/);

    if (policyMatch !== null && policyMatch[1] !== undefined) {
      const policyRef = policyMatch[1];
      return {
        type: 'policy-todo',
        content: commentText,
        file,
        line,
        policyRef,
        isObsolete: !this.isPolicyActive(policyRef),
      };
    }

    // Check for generic TODO
    if (commentText.includes('TODO:') || commentText.startsWith('TODO ')) {
      return {
        type: 'generic-todo',
        content: commentText,
        file,
        line,
        isObsolete: false, // Requires manual review
      };
    }

    // Check for FIXME
    if (commentText.includes('FIXME:') || commentText.startsWith('FIXME ')) {
      return { type: 'fixme', content: commentText, file, line };
    }

    // Check for HACK
    if (commentText.includes('HACK:') || commentText.startsWith('HACK ')) {
      return { type: 'hack', content: commentText, file, line };
    }

    // Check for NOTE
    if (commentText.includes('NOTE:') || commentText.startsWith('NOTE ')) {
      return { type: 'note', content: commentText, file, line };
    }

    // Check for commented-out code (heuristic: contains code patterns)
    if (this.looksLikeCode(commentText)) {
      return { type: 'disabled-code', content: commentText, file, line };
    }

    // Default to documentation
    return { type: 'documentation', content: commentText, file, line };
  }

  /**
   * Check if a policy reference is still active
   */
  private isPolicyActive(policyId: string): boolean {
    const policy = this.policyRules.get(policyId);
    return policy?.enabled === true;
  }

  /**
   * Heuristic to detect commented-out code
   * Looks for code patterns like semicolons, brackets, keywords
   */
  private looksLikeCode(text: string): boolean {
    const trimmed = text.trim();

    // Ignore very short comments
    const MIN_CODE_LENGTH = 10;
    if (trimmed.length < MIN_CODE_LENGTH) {
      return false;
    }

    // Check for code indicators
    const codeIndicators = [
      /;\s*$/m, // Ends with semicolon
      /\)\s*{/, // Function body
      /=>\s*{/, // Arrow function
      /^(const|let|var|function|class|interface|type|export|import)\s+/, // Keywords
      /{\s*$/, // Opening brace at end
      /}\s*$/, // Closing brace at end
      /\[[^\]]+\]/, // Array/object access
    ];

    return codeIndicators.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Get all policy IDs that are currently active
   */
  getActivePolicyIds(): string[] {
    return Array.from(this.policyRules.entries())
      .filter(([, rule]) => rule.enabled)
      .map(([id]) => id);
  }

  /**
   * Get all policy IDs that are inactive
   */
  getInactivePolicyIds(): string[] {
    return Array.from(this.policyRules.entries())
      .filter(([, rule]) => !rule.enabled)
      .map(([id]) => id);
  }
}

/**
 * Housekeeping Scanner
 * Scans codebase for housekeeping issues (obsolete TODOs, FIXMEs, etc.)
 * Follows SRP: Single responsibility of scanning files
 * Follows DIP: Depends on CommentClassifier abstraction
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CommentClassifier, Comment } from './comment-classifier.js';

/**
 * Summary of housekeeping scan results
 */
export interface HousekeepingReport {
  /** TODOs that reference inactive policies */
  obsoleteTodos: Comment[];
  /** TODOs without policy references */
  genericTodos: Comment[];
  /** FIXME comments (urgent issues) */
  fixmes: Comment[];
  /** HACK comments (temporary workarounds) */
  hacks: Comment[];
  /** Commented-out code blocks */
  disabledCode: Comment[];
  /** Summary statistics */
  summary: {
    totalIssues: number;
    byType: Record<string, number>;
    byFile: Record<string, number>;
  };
}

/**
 * Scans TypeScript files for housekeeping issues
 */
export class HousekeepingScanner {
  private readonly classifier: CommentClassifier;
  private readonly srcDir: string;

  constructor(classifier: CommentClassifier, srcDir: string = 'src') {
    this.classifier = classifier;
    this.srcDir = srcDir;
  }

  /**
   * Scan all TypeScript files for housekeeping issues
   */
  scan(): HousekeepingReport {
    const files = this.getTypeScriptFiles(this.srcDir);
    const comments: Comment[] = [];

    for (const file of files) {
      const fileComments = this.scanFile(file);
      comments.push(...fileComments);
    }

    return this.generateReport(comments);
  }

  /**
   * Scan a single file for comments
   */
  private scanFile(filePath: string): Comment[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const comments: Comment[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined || line === '') {
        continue;
      }

      // Match single-line comments: // ...
      const singleLineMatch = line.match(/\/\/\s*(.+)/);
      if (singleLineMatch !== null && singleLineMatch[1] !== undefined) {
        const commentText = singleLineMatch[1].trim();

        // Skip empty comments
        if (commentText.length === 0) {
          continue;
        }

        // Skip ESLint directives
        if (commentText.startsWith('eslint-')) {
          continue;
        }

        const comment = this.classifier.classify(commentText, filePath, i + 1);

        // Only track actionable comments (not documentation)
        if (comment.type !== 'documentation' && comment.type !== 'note') {
          comments.push(comment);
        }
      }

      // TODO: Add multi-line comment support (/* ... */) in future PR
    }

    return comments;
  }

  /**
   * Generate housekeeping report from comments
   */
  private generateReport(comments: Comment[]): HousekeepingReport {
    const obsoleteTodos = comments.filter(
      (c) => c.type === 'policy-todo' && c.isObsolete === true
    );
    const genericTodos = comments.filter((c) => c.type === 'generic-todo');
    const fixmes = comments.filter((c) => c.type === 'fixme');
    const hacks = comments.filter((c) => c.type === 'hack');
    const disabledCode = comments.filter((c) => c.type === 'disabled-code');

    const byType: Record<string, number> = {};
    const byFile: Record<string, number> = {};

    for (const comment of comments) {
      const currentTypeCount = byType[comment.type] ?? 0;
      byType[comment.type] = currentTypeCount + 1;

      const currentFileCount = byFile[comment.file] ?? 0;
      byFile[comment.file] = currentFileCount + 1;
    }

    return {
      obsoleteTodos,
      genericTodos,
      fixmes,
      hacks,
      disabledCode,
      summary: {
        totalIssues:
          obsoleteTodos.length +
          genericTodos.length +
          fixmes.length +
          hacks.length +
          disabledCode.length,
        byType,
        byFile,
      },
    };
  }

  /**
   * Get all TypeScript files in directory recursively
   */
  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];

    // Check if directory exists
    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (
        entry.isDirectory() &&
        entry.name !== 'node_modules' &&
        entry.name !== 'dist' &&
        entry.name !== 'coverage' &&
        entry.name !== '.git'
      ) {
        files.push(...this.getTypeScriptFiles(fullPath));
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
      ) {
        // Exclude test files (they have their own comment patterns)
        if (
          !entry.name.endsWith('.test.ts') &&
          !entry.name.endsWith('.spec.ts')
        ) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Get the source directory being scanned
   */
  getSourceDirectory(): string {
    return this.srcDir;
  }
}

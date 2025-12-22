/**
 * Housekeeping Module - Public API
 * Exports comment classification and scanning functionality
 * Follows OCP: Open for extension via new comment types
 */

export { CommentClassifier } from './comment-classifier.js';
export type { CommentType, Comment } from './comment-classifier.js';

export { HousekeepingScanner } from './housekeeping-scanner.js';
export type { HousekeepingReport } from './housekeeping-scanner.js';

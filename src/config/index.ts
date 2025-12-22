/**
 * Configuration Module Exports
 * Public API for configuration system
 * Following POL-003 (SOLID - OCP: Open/Closed Principle)
 */

export { ConfigValidator } from './config-validator.js';
export type { ValidationResult } from './config-validator.js';

export { ConfigLoader } from './config-loader.js';
export type { LoadResult, SaveResult } from './config-loader.js';

export {
  coLocatedTemplate,
  distributedTemplate,
  minimalTemplate,
  configTemplates,
  getTemplate,
  getRecommendedTemplate,
} from './config-templates.js';

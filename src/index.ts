/**
 * Main entry point for RetroArch PWA Configurator
 * Public API exports
 */

// Configuration System
export * from './config/index.js';

// Interfaces
export * from './interfaces/index.js';

// Pipeline Components
export { PipelineOrchestrator } from './pipeline/pipeline-orchestrator.js';
export { Classifier } from './pipeline/classifier.js';
export { Validator } from './pipeline/validator.js';
export { Archiver } from './pipeline/archiver.js';
export { Promoter } from './pipeline/promoter.js';

export function main(): void {
  // TODO: Implement main application logic
}

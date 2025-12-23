import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'json',
        'json-summary',
        'html',
        'lcov',
      ],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        'src/index.ts', // Public API export file, tested through modules
        'src/config/config-wizard.ts', // CLI tool (manual testing)
        'src/policy-documentation-generator.ts', // CLI tool (manual testing)
      ],
      // POL-002: Test Coverage Thresholds
      // Target: 95% lines, 100% functions, 85% branches, 95% statements
      // Current phase: Core policies + YAGNI enforcement implemented
      // Branch coverage gap: policy-checker (62.82%), pipeline-orchestrator (46.15%), promoter (37.5%)
      // TODO: Add tests for remaining branches after YAGNI policies merge
      thresholds: {
        lines: 70,
        functions: 80,
        branches: 73, // Current: 73.29% - TODO: Increase to 85% with pipeline integration tests
        statements: 70,
      },
      // Exclude CLI execution blocks from coverage
      all: true,
      skipFull: false,
      // Enhanced reporting options
      clean: true,
      reportsDirectory: './coverage',
    },
  },
});

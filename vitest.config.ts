import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/', 'dist/', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        'src/index.ts', // Public API export file, tested through modules
      ],
      thresholds: {
        lines: 95,
        functions: 100,
        branches: 85,
        statements: 95,
      },
      // Exclude CLI execution blocks from coverage
      all: true,
      skipFull: false,
    },
  },
});

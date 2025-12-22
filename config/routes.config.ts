/**
 * API Routes Configuration
 * Defines all server routes following config-as-infrastructure principle
 * Routes are auto-tested via E2E smoke tests (E2E-003)
 * Validation schemas enforce POL-013 (Input Validation)
 */

import { z } from 'zod';

/**
 * HTTP Methods supported
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Route configuration interface
 */
export interface RouteConfig {
  /** Unique route identifier */
  id: string;
  /** HTTP method */
  method: HttpMethod;
  /** Route path (Express format) */
  path: string;
  /** Route description */
  description: string;
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** Zod schema for request body validation (POST/PUT/PATCH) */
  bodySchema?: z.ZodSchema;
  /** Zod schema for query params validation */
  querySchema?: z.ZodSchema;
  /** Expected response status code */
  expectedStatus: number;
  /** Whether route is enabled */
  enabled: boolean;
}

/**
 * Zod Schemas for API Endpoints
 */

// Health check - no validation needed
export const healthCheckSchema = z.object({});

// Config validation schema
export const configValidationSchema = z.object({
  archivePath: z.string().min(1, 'Archive path is required'),
  syncPath: z.string().min(1, 'Sync path is required'),
  platforms: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        enabled: z.boolean(),
      })
    )
    .min(1, 'At least one platform required'),
});

/**
 * API Routes Configuration
 * All routes defined here are:
 * - Auto-tested in E2E smoke tests
 * - Validated via Zod schemas (POL-013)
 * - Type-safe (POL-001)
 */
export const routesConfig: RouteConfig[] = [
  {
    id: 'health-check',
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint',
    requiresAuth: false,
    expectedStatus: 200,
    enabled: true,
  },
  {
    id: 'validate-config',
    method: 'POST',
    path: '/api/config/validate',
    description: 'Validate RetroArch configuration',
    requiresAuth: false,
    bodySchema: configValidationSchema,
    expectedStatus: 200,
    enabled: true,
  },
];

/**
 * CORS Configuration (POL-012)
 * Explicit allowlist - NO wildcards
 */
export const corsConfig = {
  development: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  },
  production: {
    origin: [
      'https://retroarch.techbybrewski.com',
      // Add production domains here
    ],
    credentials: true,
  },
};

/**
 * Get CORS configuration based on environment
 */
export function getCorsConfig(): typeof corsConfig.development {
  const env = process.env['NODE_ENV'] || 'development';
  return env === 'production' ? corsConfig.production : corsConfig.development;
}

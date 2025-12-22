/**
 * Validation Middleware
 * Zod-based request validation (POL-013: Input Validation)
 * Follows SRP - single responsibility of validating requests
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validation error response format
 */
interface ValidationErrorResponse {
  error: string;
  details: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Middleware factory for Zod schema validation
 * @param schema - Zod schema to validate against
 * @param target - Which part of request to validate ('body' | 'query' | 'params')
 */
export function validateRequest<T = unknown>(
  schema: ZodSchema<T>,
  target: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate the target part of the request
      const data: unknown = req[target];
      const validated: T = schema.parse(data);

      // Replace request data with validated data (type-safe)
      req[target] = validated;

      next();
    } catch (error) {
      if (isZodError(error)) {
        const errorResponse: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        };

        const BAD_REQUEST_STATUS = 400;
        res.status(BAD_REQUEST_STATUS).json(errorResponse);
        return;
      }

      // Unexpected error
      const INTERNAL_ERROR_STATUS = 500;
      res.status(INTERNAL_ERROR_STATUS).json({
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Type guard for ZodError
 */
function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as ZodError).issues)
  );
}

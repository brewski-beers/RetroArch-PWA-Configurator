/**
 * Rate Limiting Middleware
 * Protects API endpoints from DoS attacks and abuse (POL-021)
 * Follows SRP - single responsibility of rate limiting requests
 */

import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter configuration (POL-021)
 * Applied to all API routes
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for successful responses in non-production environments
  skipSuccessfulRequests: false,
  // Skip rate limiting if the function returns true
  skip: () => false,
});

/**
 * Strict rate limiter for write operations (POL-021)
 * Applied to POST, PUT, PATCH routes
 * Limits: 20 requests per 15 minutes per IP
 */
export const strictApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded for write operations. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: () => false,
});

/**
 * Lenient rate limiter for content index routes (POL-021)
 * Applied to /content routes for RetroArch Remote Downloader
 * Limits: 200 requests per 15 minutes per IP (higher for file browsing)
 */
export const contentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded for content browsing. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: () => false,
});

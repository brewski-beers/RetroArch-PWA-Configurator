/**
 * Rate Limiting Middleware Tests
 * Tests for POL-021 (Rate Limiting) compliance
 * Validates that rate limiters prevent DoS attacks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import {
  apiRateLimiter,
  strictApiRateLimiter,
  contentRateLimiter,
} from '../src/middleware/rate-limit.middleware.js';

describe('Rate Limiting Middleware (POL-021)', () => {
  describe('apiRateLimiter', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use('/api', apiRateLimiter);
      app.get('/api/test', (_req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests under the limit', async () => {
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/test');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Make 101 requests to exceed the limit of 100
      const requests = Array.from({ length: 101 }, () =>
        request(app).get('/api/test')
      );

      const responses = await Promise.all(requests);

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse?.status).toBe(429);
      expect(lastResponse?.body).toHaveProperty('error', 'Too many requests');
    });
  });

  describe('strictApiRateLimiter', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/api/write', strictApiRateLimiter, (_req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests under the strict limit', async () => {
      const response = await request(app)
        .post('/api/write')
        .send({ data: 'test' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should include rate limit headers for strict limiter', async () => {
      const response = await request(app)
        .post('/api/write')
        .send({ data: 'test' });
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });

    it('should return 429 when strict rate limit is exceeded', async () => {
      // Make 21 requests to exceed the strict limit of 20
      const requests = Array.from({ length: 21 }, () =>
        request(app).post('/api/write').send({ data: 'test' })
      );

      const responses = await Promise.all(requests);

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse?.status).toBe(429);
      expect(lastResponse?.body).toHaveProperty('error', 'Too many requests');
      expect(lastResponse?.body.message).toContain('write operations');
    });
  });

  describe('contentRateLimiter', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use('/content', contentRateLimiter);
      app.get('/content/*', (_req, res) => {
        res.json({ files: [] });
      });
    });

    it('should allow requests under the content limit', async () => {
      const response = await request(app).get('/content/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ files: [] });
    });

    it('should include rate limit headers for content limiter', async () => {
      const response = await request(app).get('/content/test');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });

    it('should have higher limit than API limiter', async () => {
      const response = await request(app).get('/content/test');
      const limit = parseInt(response.headers['ratelimit-limit'] as string);
      // Content limiter should allow 200 requests (more than API's 100)
      expect(limit).toBeGreaterThan(100);
    });
  });

  describe('Rate limiter behavior', () => {
    it('should reset rate limit after window expires', async () => {
      const app = express();
      // Create a short-window rate limiter for testing (1 second)
      const testLimiter = (await import('express-rate-limit')).default({
        windowMs: 1000, // 1 second
        max: 2, // 2 requests per second
      });
      app.use('/test', testLimiter);
      app.get('/test', (_req, res) => {
        res.json({ success: true });
      });

      // First 2 requests should succeed
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // Third request should be rate limited
      await request(app).get('/test').expect(429);

      // Wait for window to reset
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should allow requests again
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });
});

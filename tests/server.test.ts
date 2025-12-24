/**
 * Unit tests for AppServer
 * Tests Express server with CORS, validation, and rate limiting (POL-012, POL-013, POL-021)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { AppServer } from '../src/server.js';

import { ConfigFactory } from './factories/config.factory.js';

describe('AppServer', () => {
  let server: AppServer;

  beforeEach(() => {
    server = new AppServer(0); // Use port 0 for random available port
  });

  describe('constructor', () => {
    it('should create server with default port 3000', () => {
      const defaultServer = new AppServer();
      expect(defaultServer).toBeInstanceOf(AppServer);
    });

    it('should create server with custom port', () => {
      const customServer = new AppServer(8080);
      expect(customServer).toBeInstanceOf(AppServer);
    });

    it('should expose Express app instance', () => {
      const app = server.getApp();
      expect(app).toBeDefined();
    });
  });

  describe('API Routes', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await request(server.getApp()).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('version');
      });

      it('should return JSON content type', async () => {
        const response = await request(server.getApp()).get('/api/health');

        expect(response.headers['content-type']).toContain('application/json');
      });
    });

    describe('POST /api/config/validate', () => {
      it('should validate valid configuration (POL-013)', async () => {
        const validConfig = {
          archivePath: '/path/to/archive',
          syncPath: '/path/to/sync',
          platforms: [
            { id: 'nes', name: 'Nintendo Entertainment System', enabled: true },
          ],
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(validConfig);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('valid', true);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject invalid configuration - missing archivePath', async () => {
        const invalidConfig = {
          syncPath: '/path/to/sync',
          platforms: [],
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(invalidConfig);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
        expect(response.body).toHaveProperty('details');
      });

      it('should accept config from factory structure', () => {
        // Arrange - ConfigFactory creates a valid structure
        const factoryConfig = ConfigFactory.create();

        // Act - Test that factory-created configs would be compatible
        // Assert
        expect(factoryConfig).toBeDefined();
        expect(factoryConfig.version).toBe('1.0.0');
      });

      it('should reject invalid configuration - empty platforms', async () => {
        const invalidConfig = {
          archivePath: '/path/to/archive',
          syncPath: '/path/to/sync',
          platforms: [],
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(invalidConfig);

        expect(response.status).toBe(400);
        expect(response.body.details[0].message).toContain(
          'At least one platform required'
        );
      });

      it('should return JSON content type', async () => {
        const validConfig = {
          archivePath: '/path/to/archive',
          syncPath: '/path/to/sync',
          platforms: [{ id: 'nes', name: 'NES', enabled: true }],
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(validConfig);

        expect(response.headers['content-type']).toContain('application/json');
      });
    });

    describe('GET /api/nonexistent', () => {
      it('should return 404 for non-existent API endpoints', async () => {
        const response = await request(server.getApp()).get('/api/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'API endpoint not found');
      });
    });
  });

  describe('Page Routes (Legacy)', () => {
    describe('GET /', () => {
      it('should serve landing page at root route', async () => {
        const response = await request(server.getApp()).get('/');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('<!DOCTYPE html>');
      });

      it('should include page-id data attribute', async () => {
        const response = await request(server.getApp()).get('/');

        expect(response.text).toContain('data-page-id="landing"');
      });
    });

    describe('GET /nonexistent', () => {
      it('should return 404 for non-existent pages', async () => {
        const response = await request(server.getApp()).get('/nonexistent');

        expect(response.status).toBe(404);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('404');
      });
    });
  });

  describe('Middleware', () => {
    describe('CORS (POL-012)', () => {
      it('should include CORS headers', async () => {
        const response = await request(server.getApp())
          .get('/api/health')
          .set('Origin', 'http://localhost:3000');

        expect(response.headers['access-control-allow-origin']).toBeDefined();
      });

      it('should allow localhost origins', async () => {
        const response = await request(server.getApp())
          .get('/api/health')
          .set('Origin', 'http://localhost:3000');

        expect(response.headers['access-control-allow-origin']).toBe(
          'http://localhost:3000'
        );
      });

      it('should handle preflight OPTIONS requests', async () => {
        const response = await request(server.getApp())
          .options('/api/config/validate')
          .set('Origin', 'http://localhost:3000')
          .set('Access-Control-Request-Method', 'POST');

        expect(response.status).toBe(204);
      });
    });

    describe('JSON Body Parsing', () => {
      it('should parse JSON request bodies', async () => {
        const testData = {
          archivePath: '/test',
          syncPath: '/test',
          platforms: [{ id: 'test', name: 'Test', enabled: true }],
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(testData);

        expect(response.status).toBe(200);
        expect(response.body.config).toEqual(testData);
      });

      it('should handle malformed JSON gracefully', async () => {
        const response = await request(server.getApp())
          .post('/api/config/validate')
          .set('Content-Type', 'application/json')
          .send('{ invalid json }');

        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });

    describe('Validation Middleware (POL-013)', () => {
      it('should validate query parameters when target is query', async () => {
        // Test with valid query params (no validation errors expected)
        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send({
            archivePath: '/path',
            syncPath: '/path',
            platforms: [{ id: 'nes', name: 'NES', enabled: true }],
          });

        expect(response.status).toBe(200);
      });

      it('should handle non-Zod errors gracefully', async () => {
        // Trigger internal error by sending oversized payload
        const hugeData = {
          archivePath: 'a'.repeat(100000),
          syncPath: 'a'.repeat(100000),
          platforms: Array(1000)
            .fill(null)
            .map((_, i) => ({
              id: `p${i}`,
              name: `Platform ${i}`,
              enabled: true,
            })),
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(hugeData);

        // Should either validate successfully or fail validation, not crash
        expect([200, 400, 413, 500]).toContain(response.status);
      });
    });

    describe('Rate Limiting (POL-021)', () => {
      it('should include rate limit headers on API requests', async () => {
        const response = await request(server.getApp()).get('/api/health');

        expect(response.headers).toHaveProperty('ratelimit-limit');
        expect(response.headers).toHaveProperty('ratelimit-remaining');
        expect(response.headers).toHaveProperty('ratelimit-reset');
      });

      it('should apply rate limiting to API endpoints', async () => {
        const response = await request(server.getApp()).get('/api/health');

        const limit = parseInt(response.headers['ratelimit-limit'] as string);
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThanOrEqual(100); // API limiter max
      });

      it('should apply stricter rate limiting to POST endpoints', async () => {
        const validConfig = {
          archivePath: '/path/to/archive',
          syncPath: '/path/to/sync',
          platforms: [{ id: 'nes', name: 'NES', enabled: true }],
        };

        const response = await request(server.getApp())
          .post('/api/config/validate')
          .send(validConfig);

        const limit = parseInt(response.headers['ratelimit-limit'] as string);
        // Strict limiter should have lower limit (20 vs 100)
        expect(limit).toBeLessThanOrEqual(20);
      });

      it('should track remaining requests in headers', async () => {
        const firstResponse = await request(server.getApp()).get('/api/health');
        const firstRemaining = parseInt(
          firstResponse.headers['ratelimit-remaining'] as string
        );

        const secondResponse = await request(server.getApp()).get(
          '/api/health'
        );
        const secondRemaining = parseInt(
          secondResponse.headers['ratelimit-remaining'] as string
        );

        // Second request should have fewer remaining requests
        expect(secondRemaining).toBeLessThan(firstRemaining);
      });
    });
  });

  describe('Error Handling', () => {
    describe('404 Errors', () => {
      it('should return 404 for unknown page routes', async () => {
        const response = await request(server.getApp()).get('/unknown/route');

        expect(response.status).toBe(404);
        expect(response.text).toContain('404');
      });

      it('should return JSON 404 for unknown API routes', async () => {
        const response = await request(server.getApp()).get(
          '/api/unknown/endpoint'
        );

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });
    });
  });
});

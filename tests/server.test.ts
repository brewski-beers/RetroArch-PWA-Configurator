/**
 * Unit tests for AppServer
 * Tests Express server with CORS and validation (POL-012, POL-013)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AppServer } from '../src/server.js';
import request from 'supertest';

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
    });
  });
});

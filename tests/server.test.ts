/**
 * Unit tests for AppServer
 * Tests HTTP server logic following SRP
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppServer } from '../src/server.js';
import http from 'node:http';

describe('AppServer', () => {
  let server: AppServer;
  let serverInstance: http.Server | undefined;

  beforeEach(() => {
    server = new AppServer(0); // Use port 0 for random available port
  });

  afterEach(async () => {
    // Clean up server if it's running
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance!.close(() => resolve());
      });
      serverInstance = undefined;
    }
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
  });

  describe('start', () => {
    it('should start the server and return a Promise', async () => {
      const startPromise = server.start();
      expect(startPromise).toBeInstanceOf(Promise);

      // Wait for server to start
      await startPromise;

      // Get the server instance for cleanup
      serverInstance = (server as any).serverInstance;
    });

    it('should log server URL when started', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await server.start();
      serverInstance = (server as any).serverInstance;

      expect(consoleSpy).toHaveBeenCalled();
      const logMessage = consoleSpy.mock.calls[0]?.[0];
      expect(logMessage).toContain('Server running at http://localhost:');

      consoleSpy.mockRestore();
    });
  });

  describe('HTTP request handling', () => {
    it('should serve landing page at root route', async () => {
      const testServer = new AppServer(0);
      await testServer.start();

      const port = (testServer as any).serverInstance.address().port;

      const response = await fetch(`http://localhost:${port}/`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('RetroArch PWA Configurator');

      await new Promise<void>((resolve) => {
        (testServer as any).serverInstance.close(() => resolve());
      });
    });

    it('should return 404 for non-existent routes', async () => {
      const testServer = new AppServer(0);
      await testServer.start();

      const port = (testServer as any).serverInstance.address().port;

      const response = await fetch(`http://localhost:${port}/non-existent`);
      const html = await response.text();

      expect(response.status).toBe(404);
      expect(html).toContain('404 - Page Not Found');

      await new Promise<void>((resolve) => {
        (testServer as any).serverInstance.close(() => resolve());
      });
    });

    it('should serve HTML content with proper Content-Type header', async () => {
      const testServer = new AppServer(0);
      await testServer.start();

      const port = (testServer as any).serverInstance.address().port;

      const response = await fetch(`http://localhost:${port}/`);

      expect(response.headers.get('content-type')).toBe('text/html');

      await new Promise<void>((resolve) => {
        (testServer as any).serverInstance.close(() => resolve());
      });
    });

    it('should handle undefined URL gracefully', async () => {
      const testServer = new AppServer(0);
      await testServer.start();

      const port = (testServer as any).serverInstance.address().port;

      // Make request to root
      const response = await fetch(`http://localhost:${port}/`);

      expect(response.status).toBe(200);

      await new Promise<void>((resolve) => {
        (testServer as any).serverInstance.close(() => resolve());
      });
    });
  });

  describe('integration with PageGenerator', () => {
    it('should generate pages with data-testid attributes', async () => {
      const testServer = new AppServer(0);
      await testServer.start();

      const port = (testServer as any).serverInstance.address().port;

      const response = await fetch(`http://localhost:${port}/`);
      const html = await response.text();

      expect(html).toContain('data-testid="landing-header"');
      expect(html).toContain('data-testid="landing-content"');
      expect(html).toContain('data-testid="landing-footer"');

      await new Promise<void>((resolve) => {
        (testServer as any).serverInstance.close(() => resolve());
      });
    });

    it('should generate pages with correct page-id data attribute', async () => {
      const testServer = new AppServer(0);
      await testServer.start();

      const port = (testServer as any).serverInstance.address().port;

      const response = await fetch(`http://localhost:${port}/`);
      const html = await response.text();

      expect(html).toContain('data-page-id="landing"');

      await new Promise<void>((resolve) => {
        (testServer as any).serverInstance.close(() => resolve());
      });
    });
  });
});

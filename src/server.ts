/**
 * Express HTTP Server
 * API server with CORS, validation, rate limiting, and static file serving
 * Single responsibility: coordinate middleware and routes
 * Following POL-012 (CORS), POL-013 (Input Validation), and POL-021 (Rate Limiting)
 */

import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import escapeHtml from 'escape-html';

import {
  getCorsConfig,
  configValidationSchema,
} from '../config/routes.config.js';
import { platformConfig } from '../config/platform.config.js';

import { PageGenerator } from './pages/page-generator.js';
import { validateRequest } from './middleware/validation.middleware.js';
import {
  apiRateLimiter,
  strictApiRateLimiter,
  contentRateLimiter,
} from './middleware/rate-limit.middleware.js';
import {
  uploadMiddleware,
  type UploadedFile,
} from './middleware/upload.middleware.js';
import { PipelineOrchestrator } from './pipeline/pipeline-orchestrator.js';
import { Classifier } from './pipeline/classifier.js';
import { Validator } from './pipeline/validator.js';
import { Normalizer } from './pipeline/normalizer.js';
import { Archiver } from './pipeline/archiver.js';
import { Promoter } from './pipeline/promoter.js';
import { ConfigLoader } from './config/config-loader.js';

const HTTP_STATUS_INTERNAL_ERROR = 500;
const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;

// Simple safe join to prevent path traversal
function safeJoin(base: string, sub: string): string {
  const resolved = path.resolve(base, sub);
  if (!resolved.startsWith(base)) {
    throw new Error('PATH_TRAVERSAL_BLOCKED');
  }
  return resolved;
}

async function renderDirIndex(
  baseDir: string,
  subPath: string
): Promise<string> {
  const abs = safeJoin(baseDir, subPath);
  const entries = await fsp.readdir(abs, { withFileTypes: true });
  const parent = subPath !== '' ? path.posix.dirname(subPath) : null;
  const links = entries
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()))
    .map((e) => {
      const name = e.name;
      const rel = subPath ? `${subPath}/${name}` : name;
      const href = e.isDirectory()
        ? `/content/${encodeURIComponent(rel)}`
        : `/content/${encodeURIComponent(rel)}?download=1`;
      const type = e.isDirectory() ? 'dir' : 'file';
      return `<li data-testid="content-item" data-type="${escapeHtml(type)}">
        <a href="${escapeHtml(href)}" data-testid="content-link">${escapeHtml(name)}</a>
      </li>`;
    })
    .join('\n');

  const listContent =
    links.length > 0 ? links : '<li data-testid="content-empty">No items</li>';

  const upLink =
    parent !== null && parent !== '.'
      ? `<a href="${escapeHtml(`/content/${encodeURIComponent(parent)}`)}" data-testid="content-up">Up</a>`
      : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ROMs Index - ${escapeHtml(subPath || '/')}</title>
  </head>
  <body>
    <header data-testid="content-header"><h1>ROMs Index</h1></header>
    <main data-testid="content-index">
      ${upLink}
      <ul data-testid="content-list">
        ${listContent}
      </ul>
    </main>
    <footer data-testid="content-footer"><small>TechByBrewski</small></footer>
  </body>
</html>`;
}

export class AppServer {
  private readonly app: Express;
  private readonly pageGenerator: PageGenerator;
  private readonly port: number;

  private static readonly DEFAULT_PORT = 3000;

  constructor(port: number = AppServer.DEFAULT_PORT) {
    this.app = express();
    this.pageGenerator = new PageGenerator();
    this.port = port;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware stack
   * POL-012: CORS with explicit allowlist (no wildcards)
   * POL-013: JSON parsing for validation
   * POL-021: Rate limiting for DoS protection
   */
  private setupMiddleware(): void {
    // CORS configuration (POL-012)
    const corsOptions = getCorsConfig();
    this.app.use(cors(corsOptions));

    // Rate limiting for all routes (POL-021)
    // Apply before other middleware to reject requests early
    this.app.use('/api', apiRateLimiter);
    this.app.use(['/content', '/content/*'], contentRateLimiter);

    // JSON body parsing for API endpoints
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware (development only)
    if (process.env['NODE_ENV'] !== 'production') {
      this.app.use((req: Request, _res: Response, next) => {
        // eslint-disable-next-line no-console
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * Setup API and page routes
   * Routes configured in config/routes.config.ts (DRY principle)
   */
  private setupRoutes(): void {
    // API Routes (from configuration)
    this.setupApiRoutes();

    // Content index routes for Remote Downloader
    this.setupContentIndexRoutes();

    // Legacy page routes (for backward compatibility)
    this.setupPageRoutes();
  }

  /**
   * Setup API routes from configuration
   * POL-013: All POST/PUT/PATCH routes have Zod validation
   * POL-021: Strict rate limiting on write operations
   */
  private setupApiRoutes(): void {
    // GET /api/health - Health check endpoint
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      });
    });

    // POST /api/config/validate - Validate configuration (POL-013 + POL-021)
    this.app.post(
      '/api/config/validate',
      strictApiRateLimiter,
      validateRequest(configValidationSchema, 'body'),
      (req: Request, res: Response) => {
        // Configuration is already validated by middleware
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const config: unknown = req.body;

        res.json({
          valid: true,
          message: 'Configuration is valid',
          config,
        });
      }
    );

    // POST /api/roms/upload - Upload and process ROM file (POL-021)
    const uploadDir = join(tmpdir(), 'retroarch-uploads');
    const BAD_REQUEST_STATUS = 400;
    const INTERNAL_SERVER_ERROR_STATUS = 500;

    this.app.post(
      '/api/roms/upload',
      strictApiRateLimiter, // Use centralized strict rate limiter (20 req/15min)
      uploadMiddleware(uploadDir),
      async (req: Request, res: Response) => {
        try {
          const files = (req as Request & { uploadedFiles?: UploadedFile[] })
            .uploadedFiles;

          if (files === undefined || files.length === 0) {
            res.status(BAD_REQUEST_STATUS).json({
              success: false,
              errors: ['No file uploaded'],
            });
            return;
          }

          const uploadedFile = files[0];
          if (uploadedFile === undefined) {
            res.status(BAD_REQUEST_STATUS).json({
              success: false,
              errors: ['File data missing'],
            });
            return;
          }

          // Load user configuration
          const configLoader = new ConfigLoader();
          const configResult = await configLoader.load();

          if (!configResult.success || configResult.config === undefined) {
            res.status(INTERNAL_SERVER_ERROR_STATUS).json({
              success: false,
              errors: ['Configuration not found. Please run setup first.'],
              phase: 'configuration',
            });
            return;
          }

          // Initialize pipeline components
          const classifier = new Classifier(platformConfig);
          const validator = new Validator(platformConfig);
          const normalizer = new Normalizer(platformConfig);
          const archiver = new Archiver(platformConfig);
          const promoter = new Promoter(platformConfig);

          // Create orchestrator with user config
          const orchestrator = PipelineOrchestrator.fromUserConfig(
            configResult.config,
            classifier,
            validator,
            normalizer,
            archiver,
            promoter
          );

          // Process the uploaded file
          const result = await orchestrator.process(uploadedFile.path);

          if (result.success) {
            res.json({
              success: true,
              message: 'ROM processed successfully',
              rom: result.rom,
            });
          } else {
            res.status(BAD_REQUEST_STATUS).json({
              success: false,
              errors: result.errors,
              phase: result.phase,
            });
          }
        } catch (error) {
          const err = error as Error;
          res.status(INTERNAL_SERVER_ERROR_STATUS).json({
            success: false,
            errors: [`Processing failed: ${err.message}`],
            phase: 'unknown',
          });
        }
      }
    );
  }

  /**
   * Expose read-only content index for RetroArch Remote Downloader
   * Serves HTML index at /content and file downloads via ?download=1
   */
  private setupContentIndexRoutes(): void {
    let syncContentDir: string | null = null;

    const ensureContentDir = async (): Promise<string | null> => {
      if (syncContentDir !== null) {
        return syncContentDir;
      }
      try {
        const loader = new ConfigLoader();
        const result = await loader.load();
        if (result.success === true && result.config !== undefined) {
          // sync.content.path holds the ROMs directory
          syncContentDir = path.resolve(result.config.sync.content.path);
          // Ensure base directory exists so index can render even when empty
          await fsp.mkdir(syncContentDir, { recursive: true });
          return syncContentDir;
        }
      } catch {
        // Ignore, will return null
      }
      return null;
    };

    this.app.get(
      ['/content', '/content/*'],
      async (req: Request, res: Response) => {
        try {
          const base = await ensureContentDir();
          if (base === null) {
            return res
              .status(HTTP_STATUS_SERVICE_UNAVAILABLE)
              .send('CONTENT_INDEX_NOT_READY');
          }
          const wildParam = (req.params as { [key: string]: string })[0];
          const wild =
            wildParam === undefined || wildParam === null ? '' : wildParam;
          const subPath = decodeURIComponent(wild);
          const abs = safeJoin(base, subPath);
          const stat = await fsp.stat(abs);

          const hasDownload = typeof req.query['download'] !== 'undefined';
          if (stat.isFile() && hasDownload) {
            res.sendFile(abs);
            return;
          }

          if (stat.isDirectory()) {
            const html = await renderDirIndex(base, subPath);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(html);
            return;
          }

          const parent = path.posix.dirname(subPath);
          const html = await renderDirIndex(base, parent === '.' ? '' : parent);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(html);
          return;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Content index error:', err);
          res.status(HTTP_STATUS_INTERNAL_ERROR).send('CONTENT_INDEX_ERROR');
          return;
        }
      }
    );

    this.app.get('/api/content-index', async (_req: Request, res: Response) => {
      try {
        const base = await ensureContentDir();
        if (base === null) {
          res
            .status(HTTP_STATUS_SERVICE_UNAVAILABLE)
            .json({ error: 'CONTENT_INDEX_NOT_READY' });
          return;
        }
        const entries = await fsp.readdir(base, { withFileTypes: true });
        res.json({
          baseDir: base,
          items: entries.map((e) => ({
            name: e.name,
            type: e.isDirectory() ? 'dir' : 'file',
          })),
        });
        return;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Content index API error:', err);
        res
          .status(HTTP_STATUS_INTERNAL_ERROR)
          .json({ error: 'CONTENT_INDEX_ERROR' });
        return;
      }
    });
  }

  /**
   * Setup legacy page routes (HTML rendering)
   * Maintains backward compatibility with existing pages
   */
  private setupPageRoutes(): void {
    // Serve generated HTML pages (catch-all route)
    this.app.use((req: Request, res: Response, next) => {
      // Skip if it's an API route or already handled
      if (req.path.startsWith('/api/')) {
        return next();
      }

      const url = req.path;

      // Get page configuration for this route
      const pageConfig = this.pageGenerator.getPageByRoute(url);

      if (pageConfig !== undefined) {
        const html = this.pageGenerator.generatePage(pageConfig);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        res.status(404).setHeader('Content-Type', 'text/html');
        res.send('<h1>404 - Page Not Found</h1>');
      }
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler for API routes (must come after all API route definitions)
    this.app.use('/api', (_req: Request, res: Response) => {
      res.status(404).json({
        error: 'API endpoint not found',
      });
    });

    // Global error handler
    const INTERNAL_ERROR_STATUS = 500;
    this.app.use(
      (
        err: Error,
        _req: Request,
        res: Response,
        _next: express.NextFunction
      ) => {
        // eslint-disable-next-line no-console
        console.error('Server error:', err);

        res.status(INTERNAL_ERROR_STATUS).json({
          error: 'Internal server error',
          message:
            process.env['NODE_ENV'] === 'development' ? err.message : undefined,
        });
      }
    );
  }

  /**
   * Start the Express server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running at http://localhost:${this.port}/`);
        resolve();
      });
    });
  }

  /**
   * Get Express app instance (for testing)
   */
  getApp(): Express {
    return this.app;
  }
}

/* v8 ignore next 6 */
/* eslint-disable no-console */
// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const DEFAULT_BASE = 10;
  const port = parseInt(process.env['PORT'] ?? '3000', DEFAULT_BASE);
  const server = new AppServer(port);
  await server.start();
}
/* eslint-enable no-console */

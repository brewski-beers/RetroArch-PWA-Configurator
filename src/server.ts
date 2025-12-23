/**
 * Express HTTP Server
 * API server with CORS, validation, and static file serving
 * Single responsibility: coordinate middleware and routes
 * Following POL-012 (CORS) and POL-013 (Input Validation)
 */

import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PageGenerator } from './pages/page-generator.js';
import {
  getCorsConfig,
  configValidationSchema,
} from '../config/routes.config.js';
import { validateRequest } from './middleware/validation.middleware.js';
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
import { platformConfig } from '../config/platform.config.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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
   */
  private setupMiddleware(): void {
    // CORS configuration (POL-012)
    const corsOptions = getCorsConfig();
    this.app.use(cors(corsOptions));

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

    // Legacy page routes (for backward compatibility)
    this.setupPageRoutes();
  }

  /**
   * Setup API routes from configuration
   * POL-013: All POST/PUT/PATCH routes have Zod validation
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

    // POST /api/config/validate - Validate configuration (POL-013)
    this.app.post(
      '/api/config/validate',
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

    // POST /api/roms/upload - Upload and process ROM file
    const uploadDir = join(tmpdir(), 'retroarch-uploads');
    const BAD_REQUEST_STATUS = 400;
    const INTERNAL_SERVER_ERROR_STATUS = 500;
    const uploadRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // limit each IP to 20 upload requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.post(
      '/api/roms/upload',
      uploadRateLimiter,
      uploadMiddleware(uploadDir),
      async (req: Request, res: Response) => {
        try {
          const files = (req as Request & { files?: UploadedFile[] }).files;

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

      if (pageConfig) {
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

/**
 * Simple HTTP Server
 * Serves auto-generated pages for testing
 * Single responsibility: serve generated HTML content
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { PageGenerator } from './pages/page-generator.js';

export class AppServer {
  private readonly pageGenerator: PageGenerator;
  private readonly port: number;
  private serverInstance?: ReturnType<typeof createServer>;

  private static readonly HTTP_OK = 200;
  private static readonly HTTP_NOT_FOUND = 404;
  private static readonly DEFAULT_PORT = 3000;

  constructor(port: number = AppServer.DEFAULT_PORT) {
    this.pageGenerator = new PageGenerator();
    this.port = port;
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url ?? '/';

    // Get page configuration for this route
    const pageConfig = this.pageGenerator.getPageByRoute(url);

    if (pageConfig) {
      const html = this.pageGenerator.generatePage(pageConfig);
      res.writeHead(AppServer.HTTP_OK, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(AppServer.HTTP_NOT_FOUND, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Page Not Found</h1>');
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.serverInstance = createServer(
        (req: IncomingMessage, res: ServerResponse) =>
          this.handleRequest(req, res)
      );

      this.serverInstance.listen(this.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running at http://localhost:${this.port}/`);
        resolve();
      });
    });
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

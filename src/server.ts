/**
 * Simple HTTP Server
 * Serves auto-generated pages for testing
 * Single responsibility: serve generated HTML content
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { PageGenerator } from './pages/page-generator.js';

export class AppServer {
  private pageGenerator: PageGenerator;
  private port: number;

  constructor(port: number = 3000) {
    this.pageGenerator = new PageGenerator();
    this.port = port;
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url ?? '/';
    
    // Get page configuration for this route
    const pageConfig = this.pageGenerator.getPageByRoute(url);
    
    if (pageConfig) {
      const html = this.pageGenerator.generatePage(pageConfig);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Page Not Found</h1>');
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      const server = createServer((req: IncomingMessage, res: ServerResponse) => this.handleRequest(req, res));
      
      server.listen(this.port, () => {
        console.log(`Server running at http://localhost:${this.port}/`);
        resolve();
      });
    });
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  const server = new AppServer(port);
  await server.start();
}

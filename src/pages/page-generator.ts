/**
 * Page Generator
 * Auto-generates HTML pages from configuration
 * Follows SRP - single responsibility of generating pages from config
 */

import { pagesConfig, type PageConfig, type PageComponent } from '../../config/pages.config.js';

export class PageGenerator {
  /**
   * Generate HTML for a single component
   */
  private generateComponent(component: PageComponent): string {
    switch (component.type) {
      case 'header':
        return `    <header id="${component.id}">
      <h1>${component.content}</h1>
    </header>`;
      case 'content':
        return `    <main id="${component.id}">
      <p>${component.content}</p>
    </main>`;
      case 'footer':
        return `    <footer id="${component.id}">
      <p>${component.content}</p>
    </footer>`;
      default:
        return `    <div id="${component.id}">${component.content}</div>`;
    }
  }

  /**
   * Generate complete HTML page from configuration
   */
  generatePage(pageConfig: PageConfig): string {
    const components = pageConfig.components
      .map((component: PageComponent) => this.generateComponent(component))
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${pageConfig.description}">
    <title>${pageConfig.title}</title>
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      header {
        background-color: #2c3e50;
        color: white;
        padding: 2rem;
        text-align: center;
      }
      main {
        flex: 1;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }
      footer {
        background-color: #34495e;
        color: white;
        padding: 1rem;
        text-align: center;
      }
    </style>
  </head>
  <body data-page-id="${pageConfig.id}">
${components}
  </body>
</html>`;
  }

  /**
   * Get page configuration by route
   */
  getPageByRoute(route: string): PageConfig | undefined {
    return pagesConfig.find((page: PageConfig) => page.route === route);
  }

  /**
   * Generate all configured pages
   */
  generateAllPages(): Map<string, string> {
    const pages = new Map<string, string>();
    
    for (const pageConfig of pagesConfig) {
      const html = this.generatePage(pageConfig);
      pages.set(pageConfig.route, html);
    }
    
    return pages;
  }
}

/**
 * Page Generator
 * Auto-generates HTML pages from configuration
 * Follows SRP - single responsibility of generating pages from config
 */

import {
  pagesConfig,
  type PageConfig,
  type PageComponent,
} from '../../config/pages.config.js';

export class PageGenerator {
  /**
   * Generate HTML for a single component
   */
  private generateComponent(component: PageComponent): string {
    switch (component.type) {
      case 'header':
        return `    <header id="${component.id}" data-testid="${component.testId}">
      <h1>${component.content}</h1>
    </header>`;
      case 'content':
        return `    <main id="${component.id}" data-testid="${component.testId}">
      <p>${component.content}</p>
    </main>`;
      case 'footer':
        return `    <footer id="${component.id}" data-testid="${component.testId}">
      <p>${component.content}</p>
    </footer>`;
      case 'form':
        return this.generateFormComponent(component);
      default:
        return `    <div id="${component.id}" data-testid="${component.testId}">${component.content}</div>`;
    }
  }

  /**
   * Generate HTML for a form component
   */
  private generateFormComponent(component: PageComponent): string {
    if (component.formConfig === undefined) {
      return `    <div id="${component.id}" data-testid="${component.testId}">Form configuration missing</div>`;
    }

    const {
      action,
      method,
      enctype,
      fields = [],
      submitButton,
    } = component.formConfig;

    const fieldsHtml = fields
      .map((field) => {
        const acceptAttr =
          field.accept !== undefined && field.accept.length > 0
            ? ` accept="${field.accept}"`
            : '';
        const requiredAttr = field.required === true ? ' required' : '';
        const labelText = field.label ?? field.name;
        const requiredIndicator = field.required === true ? ' *' : '';
        return `        <div class="form-group">
          <label for="${field.id}">${labelText}${requiredIndicator}</label>
          <input 
            type="${field.type}" 
            name="${field.name}" 
            id="${field.id}"${acceptAttr}${requiredAttr}
          />
        </div>`;
      })
      .join('\n');

    const submitButtonHtml =
      submitButton !== undefined
        ? `        <button type="submit">${submitButton.text}</button>`
        : '        <button type="submit">Submit</button>';

    const formEnctype = enctype ?? 'application/x-www-form-urlencoded';

    return `    <form id="${component.id}" data-testid="${component.testId}" action="${action}" method="${method}" enctype="${formEnctype}">
${fieldsHtml}
${submitButtonHtml}
      <div id="upload-status"></div>
    </form>`;
  }

  /**
   * Generate complete HTML page from configuration
   */
  generatePage(pageConfig: PageConfig): string {
    const components = pageConfig.components
      .map((component: PageComponent) => this.generateComponent(component))
      .join('\n');

    const hasForm = pageConfig.components.some((c) => c.type === 'form');
    const formScript = hasForm ? this.generateFormScript() : '';

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
        background-color: #f5f5f5;
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
        width: 100%;
      }
      footer {
        background-color: #34495e;
        color: white;
        padding: 1rem;
        text-align: center;
      }
      form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .form-group {
        margin-bottom: 1.5rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #2c3e50;
      }
      input[type="file"] {
        display: block;
        width: 100%;
        padding: 0.75rem;
        border: 2px dashed #3498db;
        border-radius: 4px;
        background-color: #f8f9fa;
        cursor: pointer;
      }
      input[type="file"]:hover {
        border-color: #2980b9;
        background-color: #e9ecef;
      }
      button[type="submit"] {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      button[type="submit"]:hover {
        background-color: #2980b9;
      }
      button[type="submit"]:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
      }
      #upload-status {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 4px;
        display: none;
      }
      #upload-status.success {
        display: block;
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      #upload-status.error {
        display: block;
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      #upload-status.processing {
        display: block;
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      .status-detail {
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body data-page-id="${pageConfig.id}">
${components}
${formScript}
  </body>
</html>`;
  }

  /**
   * Generate JavaScript for form handling
   */
  private generateFormScript(): string {
    return `    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('form[data-testid="ingest-form"]');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const fileInput = document.getElementById('rom-file-input');
          const submitButton = form.querySelector('button[type="submit"]');
          const statusDiv = document.getElementById('upload-status');
          
          if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            showStatus('error', 'Please select a ROM file to upload');
            return;
          }

          const file = fileInput.files[0];
          const formData = new FormData();
          formData.append('romFile', file);

          submitButton.disabled = true;
          showStatus('processing', 'Processing ' + file.name + '...', 'Please wait while we process your ROM file');

          try {
            const response = await fetch('/api/roms/upload', {
              method: 'POST',
              body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
              showStatus('success', 'ROM processed successfully!', 
                'Platform: ' + result.rom.platform + '\\n' +
                'Filename: ' + result.rom.filename + '\\n' +
                'Hash: ' + result.rom.hash.substring(0, 16) + '...'
              );
              form.reset();
            } else {
              showStatus('error', 'Processing failed', 
                result.errors ? result.errors.join(', ') : 'Unknown error occurred'
              );
            }
          } catch (error) {
            showStatus('error', 'Upload failed', error.message);
          } finally {
            submitButton.disabled = false;
          }
        });

        function showStatus(type, message, detail) {
          const statusDiv = document.getElementById('upload-status');
          statusDiv.className = type;
          statusDiv.innerHTML = '<strong>' + message + '</strong>' +
            (detail ? '<div class="status-detail">' + detail.replace(/\\n/g, '<br>') + '</div>' : '');
        }
      });
    </script>`;
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

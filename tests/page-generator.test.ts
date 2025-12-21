/**
 * Unit tests for PageGenerator
 * Tests page generation logic following SRP
 * Uses test factories to maintain DRY principle (TEST-001, TEST-005)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PageGenerator } from '../src/pages/page-generator.js';
import {
  PageConfigFactory,
  ComponentFactory,
} from './factories/page-config.factory.js';

describe('PageGenerator', () => {
  let generator: PageGenerator;

  beforeEach(() => {
    generator = new PageGenerator();
  });

  describe('generatePage', () => {
    it('should generate valid HTML structure', () => {
      // Arrange (TEST-004: AAA pattern)
      const testConfig = PageConfigFactory.withHeader();

      // Act
      const html = generator.generatePage(testConfig);

      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<title>Test Title</title>');
      expect(html).toContain(
        '<meta name="description" content="Test description">'
      );
    });

    it('should include page id in body data attribute', () => {
      const testConfig = PageConfigFactory.create({ id: 'my-page' });

      const html = generator.generatePage(testConfig);

      expect(html).toContain('data-page-id="my-page"');
    });

    it('should generate header component with data-testid', () => {
      const testConfig = PageConfigFactory.withHeader();

      const html = generator.generatePage(testConfig);

      expect(html).toContain(
        '<header id="test-header" data-testid="test-page-header">'
      );
      expect(html).toContain('<h1>Test Header</h1>');
      expect(html).toContain('</header>');
    });

    it('should generate content component with data-testid', () => {
      const testConfig = PageConfigFactory.create({
        components: [ComponentFactory.createContent()],
      });

      const html = generator.generatePage(testConfig);

      expect(html).toContain(
        '<main id="test-content" data-testid="test-page-content">'
      );
      expect(html).toContain('<p>Test Content</p>');
      expect(html).toContain('</main>');
    });

    it('should generate footer component with data-testid', () => {
      const testConfig = PageConfigFactory.create({
        components: [ComponentFactory.createFooter()],
      });

      const html = generator.generatePage(testConfig);

      expect(html).toContain(
        '<footer id="test-footer" data-testid="test-page-footer">'
      );
      expect(html).toContain('<p>Test Footer</p>');
      expect(html).toContain('</footer>');
    });

    it('should generate multiple components in order', () => {
      const testConfig = PageConfigFactory.withAllComponents();

      const html = generator.generatePage(testConfig);

      const headerIndex = html.indexOf('<header');
      const mainIndex = html.indexOf('<main');
      const footerIndex = html.indexOf('<footer');

      expect(headerIndex).toBeLessThan(mainIndex);
      expect(mainIndex).toBeLessThan(footerIndex);
    });

    it('should include CSS styles in head', () => {
      const testConfig = PageConfigFactory.create();

      const html = generator.generatePage(testConfig);

      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
      expect(html).toContain('flex');
      expect(html).toContain('</style>');
    });
  });

  describe('getPageByRoute', () => {
    it('should return page config for existing route', () => {
      const page = generator.getPageByRoute('/');

      expect(page).toBeDefined();
      expect(page?.id).toBe('landing');
      expect(page?.route).toBe('/');
    });

    it('should return undefined for non-existent route', () => {
      const page = generator.getPageByRoute('/non-existent');

      expect(page).toBeUndefined();
    });
  });

  describe('generateAllPages', () => {
    it('should generate all configured pages', () => {
      const pages = generator.generateAllPages();

      expect(pages.size).toBeGreaterThan(0);
      expect(pages.has('/')).toBe(true);
    });

    it('should return Map with route as key and HTML as value', () => {
      const pages = generator.generateAllPages();

      for (const [route, html] of pages.entries()) {
        expect(typeof route).toBe('string');
        expect(typeof html).toBe('string');
        expect(html).toContain('<!DOCTYPE html>');
      }
    });

    it('should generate valid HTML for each page', () => {
      const pages = generator.generateAllPages();

      for (const html of pages.values()) {
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('</html>');
        expect(html).toContain('<body');
        expect(html).toContain('</body>');
      }
    });
  });
});

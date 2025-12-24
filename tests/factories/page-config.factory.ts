/**
 * Test Factory for PageConfig
 * Follows Factory Pattern and DRY principles
 * Single Responsibility: Create test fixtures for PageConfig
 */

import type { PageConfig, PageComponent } from '../../config/pages.config.js';

export class PageConfigFactory {
  /**
   * Create a minimal valid PageConfig for testing
   */
  static create(overrides: Partial<PageConfig> = {}): PageConfig {
    return {
      id: 'test-page',
      name: 'Test Page',
      route: '/test',
      title: 'Test Title',
      description: 'Test description',
      components: [],
      ...overrides,
    };
  }

  /**
   * Create a PageConfig with a header component
   */
  static withHeader(overrides: Partial<PageConfig> = {}): PageConfig {
    return this.create({
      components: [ComponentFactory.createHeader()],
      ...overrides,
    });
  }

  /**
   * Create a PageConfig with all component types
   */
  static withAllComponents(overrides: Partial<PageConfig> = {}): PageConfig {
    return this.create({
      components: [
        ComponentFactory.createHeader(),
        ComponentFactory.createContent(),
        ComponentFactory.createFooter(),
      ],
      ...overrides,
    });
  }

  /**
   * Create a PageConfig with multiple components of the same type
   */
  static withMultipleComponents(
    count: number,
    type: PageComponent['type']
  ): PageConfig {
    const components = Array.from({ length: count }, (_, i) => {
      switch (type) {
        case 'header':
          return ComponentFactory.createHeader({
            id: `header-${i}`,
            testId: `test-header-${i}`,
          });
        case 'content':
          return ComponentFactory.createContent({
            id: `content-${i}`,
            testId: `test-content-${i}`,
          });
        case 'footer':
          return ComponentFactory.createFooter({
            id: `footer-${i}`,
            testId: `test-footer-${i}`,
          });
        case 'form':
          return ComponentFactory.createForm({
            id: `form-${i}`,
            testId: `test-form-${i}`,
          });
        default:
          return ComponentFactory.createContent({
            id: `content-${i}`,
            testId: `test-content-${i}`,
          });
      }
    });

    return this.create({ components });
  }
}

export class ComponentFactory {
  /**
   * Create a header component
   */
  static createHeader(overrides: Partial<PageComponent> = {}): PageComponent {
    return {
      type: 'header',
      id: 'test-header',
      testId: 'test-page-header',
      content: 'Test Header',
      ...overrides,
    };
  }

  /**
   * Create a content component
   */
  static createContent(overrides: Partial<PageComponent> = {}): PageComponent {
    return {
      type: 'content',
      id: 'test-content',
      testId: 'test-page-content',
      content: 'Test Content',
      ...overrides,
    };
  }

  /**
   * Create a footer component
   */
  static createFooter(overrides: Partial<PageComponent> = {}): PageComponent {
    return {
      type: 'footer',
      id: 'test-footer',
      testId: 'test-page-footer',
      content: 'Test Footer',
      ...overrides,
    };
  }

  /**
   * Create a form component
   */
  static createForm(overrides: Partial<PageComponent> = {}): PageComponent {
    return {
      type: 'form',
      id: 'test-form',
      testId: 'test-page-form',
      content: '',
      formConfig: {
        action: '/api/test',
        method: 'POST',
        fields: [
          {
            type: 'file',
            name: 'testFile',
            id: 'test-file-input',
            testId: 'test-file-input',
            label: 'Test File',
          },
        ],
        submitButton: {
          text: 'Submit',
          testId: 'test-submit-button',
        },
      },
      ...overrides,
    };
  }

  /**
   * Create an array of components (header, content, footer)
   */
  static createAll(): PageComponent[] {
    return [this.createHeader(), this.createContent(), this.createFooter()];
  }
}

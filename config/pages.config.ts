/**
 * Pages Configuration
 * Defines page structures following SRP and config-as-infrastructure
 * Pages are auto-generated from this configuration
 */

export interface PageConfig {
  id: string;
  name: string;
  route: string;
  title: string;
  description: string;
  components: PageComponent[];
}

export interface PageComponent {
  type: 'header' | 'content' | 'footer' | 'form';
  id: string;
  testId: string; // Required for Vitest and Playwright testing
  content: string;
  /** Form-specific properties */
  formConfig?: {
    action: string;
    method: string;
    enctype?: string;
    fields?: Array<{
      type: string;
      name: string;
      id: string;
      testId: string;
      accept?: string;
      label?: string;
      required?: boolean;
    }>;
    submitButton?: {
      text: string;
      testId: string;
    };
  };
}

export const pagesConfig: PageConfig[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    route: '/',
    title: 'RetroArch PWA Configurator | TechByBrewski',
    description:
      'A powerful web-based configurator for managing your RetroArch server setups',
    components: [
      {
        type: 'header',
        id: 'main-header',
        testId: 'landing-header',
        content: 'RetroArch PWA Configurator',
      },
      {
        type: 'content',
        id: 'main-content',
        testId: 'landing-content',
        content:
          'Configure and manage your RetroArch server with policy-driven validation and TypeScript-powered tooling',
      },
      {
        type: 'footer',
        id: 'main-footer',
        testId: 'landing-footer',
        content: '© 2025 TechByBrewski',
      },
    ],
  },
  {
    id: 'ingest',
    name: 'ROM Ingestion',
    route: '/ingest',
    title: 'ROM Ingestion | RetroArch PWA Configurator',
    description: 'Upload and process ROM files for your RetroArch server',
    components: [
      {
        type: 'header',
        id: 'ingest-header',
        testId: 'ingest-header',
        content: 'ROM Ingestion',
      },
      {
        type: 'content',
        id: 'ingest-description',
        testId: 'ingest-description',
        content:
          'Upload your ROM files to process and promote them to your RetroArch server',
      },
      {
        type: 'form',
        id: 'ingest-form',
        testId: 'ingest-form',
        content: '',
        formConfig: {
          action: '/api/roms/upload',
          method: 'POST',
          enctype: 'multipart/form-data',
          fields: [
            {
              type: 'file',
              name: 'romFile',
              id: 'rom-file-input',
              testId: 'rom-file-input',
              accept:
                '.nes,.sfc,.smc,.md,.gen,.bin,.cue,.chd,.n64,.z64,.v64,.gba',
              label: 'Select ROM File',
              required: true,
            },
          ],
          submitButton: {
            text: 'Upload and Process',
            testId: 'upload-submit-button',
          },
        },
      },
      {
        type: 'footer',
        id: 'ingest-footer',
        testId: 'ingest-footer',
        content: '© 2025 TechByBrewski',
      },
    ],
  },
];

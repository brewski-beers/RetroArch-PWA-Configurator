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
  type: 'header' | 'content' | 'footer';
  id: string;
  testId: string; // Required for Vitest and Playwright testing
  content: string;
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
];

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
  content: string;
}

export const pagesConfig: PageConfig[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    route: '/',
    title: 'RetroArch PWA Configurator | TechByBrewski',
    description: 'A powerful web-based configurator for managing your RetroArch server setups',
    components: [
      {
        type: 'header',
        id: 'main-header',
        content: 'RetroArch PWA Configurator'
      },
      {
        type: 'content',
        id: 'main-content',
        content: 'Configure and manage your RetroArch server with policy-driven validation and TypeScript-powered tooling'
      },
      {
        type: 'footer',
        id: 'main-footer',
        content: '© 2024 TechByBrewski'
      }
    ]
  }
];

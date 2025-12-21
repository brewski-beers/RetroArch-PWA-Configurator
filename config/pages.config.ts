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
    title: 'RetroArch - Policy-Driven Platform',
    description: 'Welcome to RetroArch platform',
    components: [
      {
        type: 'header',
        id: 'main-header',
        content: 'RetroArch Platform'
      },
      {
        type: 'content',
        id: 'main-content',
        content: 'TypeScript-powered, policy-driven ingestion and management platform'
      },
      {
        type: 'footer',
        id: 'main-footer',
        content: '© 2024 RetroArch'
      }
    ]
  }
];

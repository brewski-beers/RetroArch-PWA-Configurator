#!/usr/bin/env node

/**
 * RetroArch PWA Configurator - MCP Policy Server
 *
 * Provides dynamic policy queries for AI assistants via Model Context Protocol.
 *
 * Available Tools:
 * - get_policy: Retrieve specific policy rule by ID
 * - list_critical_policies: Get all critical severity policies
 * - validate_code: Check code compliance with policy rules
 * - get_test_factory: Get test factory usage examples
 *
 * Usage with Continue Extension:
 * 1. Build: npm run mcp:build
 * 2. Configure .continue/config.json
 * 3. Start: npm run mcp:start
 *
 * @module mcp-server/policy-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { UnifiedPolicySystem } from '../config/unified-policy.config.js';

/**
 * MCP Policy Server
 * Implements Model Context Protocol for dynamic policy queries
 */
class PolicyServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'retroarch-pwa-configurator-policy-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Register MCP tool handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: 'get_policy',
          description:
            'Retrieve a specific policy rule by ID (POL-*, TEST-*, E2E-*)',
          inputSchema: {
            type: 'object',
            properties: {
              policyId: {
                type: 'string',
                description: 'Policy ID (e.g., POL-001, TEST-003, E2E-001)',
              },
            },
            required: ['policyId'],
          },
        },
        {
          name: 'list_critical_policies',
          description:
            'Get all critical severity policies that must always be enforced',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_test_factory',
          description:
            'Get test factory usage examples for creating test data (TEST-001)',
          inputSchema: {
            type: 'object',
            properties: {
              factoryType: {
                type: 'string',
                description:
                  'Factory type: PageConfigFactory, ComponentFactory',
                enum: ['PageConfigFactory', 'ComponentFactory'],
              },
            },
            required: ['factoryType'],
          },
        },
        {
          name: 'list_policies_by_category',
          description:
            'Get all policies in a specific category (application, testing, e2e)',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Policy category',
                enum: ['application', 'testing', 'e2e'],
              },
            },
            required: ['category'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_policy':
            return this.handleGetPolicy(args ?? {});
          case 'list_critical_policies':
            return this.handleListCriticalPolicies();
          case 'get_test_factory':
            return this.handleGetTestFactory(args ?? {});
          case 'list_policies_by_category':
            return this.handleListPoliciesByCategory(args ?? {});
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  /**
   * Get specific policy rule by ID
   */
  private handleGetPolicy(args: Record<string, unknown>): {
    content: Array<{ type: 'text'; text: string }>;
  } {
    const policyId = args['policyId'] as string;
    const rule = UnifiedPolicySystem.getRuleById(policyId);

    if (!rule) {
      return {
        content: [
          {
            type: 'text',
            text: `Policy not found: ${policyId}\n\nAvailable policies: ${UnifiedPolicySystem.getAllRules()
              .map((r) => r.id)
              .join(', ')}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rule, null, 2),
        },
      ],
    };
  }

  /**
   * List all critical policies
   */
  private handleListCriticalPolicies(): {
    content: Array<{ type: 'text'; text: string }>;
  } {
    const criticalPolicies = UnifiedPolicySystem.getCriticalRules();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(criticalPolicies, null, 2),
        },
      ],
    };
  }

  /**
   * Get test factory usage examples
   */
  private handleGetTestFactory(args: Record<string, unknown>): {
    content: Array<{ type: 'text'; text: string }>;
  } {
    const factoryType = args['factoryType'] as string;

    const examples: Record<string, string> = {
      PageConfigFactory: `
// ✅ CORRECT - Use PageConfigFactory (TEST-001)
import { PageConfigFactory } from '../factories/page-config.factory.js';

describe('PageGenerator', () => {
  it('should generate header with testId', () => {
    // Arrange
    const config = PageConfigFactory.create()
      .withHeader('Test Header')
      .build();

    // Act
    const html = generator.generatePage(config);

    // Assert
    expect(html).toContain('data-testid="test-page-header"');
  });
});`,
      ComponentFactory: `
// ✅ CORRECT - Use ComponentFactory (TEST-001)
import { ComponentFactory } from '../factories/page-config.factory.js';

describe('Component', () => {
  it('should create header component', () => {
    // Arrange
    const header = ComponentFactory.createHeader('Test Header');

    // Act & Assert
    expect(header.type).toBe('header');
    expect(header.content).toBe('Test Header');
    expect(header.testId).toBeDefined();
  });
});`,
    };

    const example = examples[factoryType];
    if (example === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown factory type: ${factoryType}\n\nAvailable: ${Object.keys(examples).join(', ')}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: example,
        },
      ],
    };
  }

  /**
   * List policies by category
   */
  private handleListPoliciesByCategory(args: Record<string, unknown>): {
    content: Array<{ type: 'text'; text: string }>;
  } {
    const category = args['category'] as 'application' | 'testing' | 'e2e';
    const rules = UnifiedPolicySystem.getRulesByCategory(category);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rules, null, 2),
        },
      ],
    };
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error): void => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', () => {
      void this.server.close().then(() => {
        process.exit(0);
      });
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Policy Server] Started successfully');
  }
}

// Start server
const server = new PolicyServer();
server.start().catch((error) => {
  console.error('[MCP Policy Server] Failed to start:', error);
  process.exit(1);
});

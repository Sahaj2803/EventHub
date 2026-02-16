#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// TestSprite API configuration
const TESTSPRITE_API_KEY = process.env.TESTSPRITE_API_KEY || 'your-testsprite-api-key-here';
const TESTSPRITE_BASE_URL = 'https://api.testsprite.com/v1';

// Event Web API configuration
const EVENT_WEB_API_BASE = process.env.EVENT_WEB_API_BASE || 'http://localhost:5005/api';
const EVENT_WEB_AUTH_TOKEN = process.env.EVENT_WEB_AUTH_TOKEN || '';

class EventWebMCPTool {
  constructor() {
    this.server = new Server(
      {
        name: 'event-web-tool',
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

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_events',
            description: 'Get all events with filtering and pagination',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', default: 1 },
                limit: { type: 'number', default: 12 },
                category: { type: 'string' },
                search: { type: 'string' },
                status: { type: 'string', enum: ['draft', 'published', 'cancelled', 'completed'] },
                sortBy: { type: 'string', enum: ['date', 'title', 'createdAt', 'views'] },
                sortOrder: { type: 'string', enum: ['asc', 'desc'] },
                featured: { type: 'boolean' },
                upcoming: { type: 'boolean' },
                location: { type: 'string' }
              }
            }
          },
          {
            name: 'get_event_by_id',
            description: 'Get a specific event by ID',
            inputSchema: {
              type: 'object',
              properties: {
                eventId: { type: 'string', required: true }
              },
              required: ['eventId']
            }
          },
          {
            name: 'get_featured_events',
            description: 'Get featured events',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'create_event',
            description: 'Create a new event (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', required: true },
                description: { type: 'string', required: true },
                category: { type: 'string', required: true },
                dateTime: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', required: true },
                    end: { type: 'string', required: true },
                    timezone: { type: 'string', default: 'UTC' }
                  },
                  required: ['start', 'end']
                },
                venue: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', required: true },
                    address: {
                      type: 'object',
                      properties: {
                        city: { type: 'string', required: true },
                        country: { type: 'string', required: true },
                        street: { type: 'string' },
                        state: { type: 'string' },
                        zipCode: { type: 'string' }
                      },
                      required: ['city', 'country']
                    }
                  },
                  required: ['name', 'address']
                },
                pricing: {
                  type: 'object',
                  properties: {
                    isFree: { type: 'boolean', default: false },
                    currency: { type: 'string', default: 'USD' },
                    tiers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          price: { type: 'number' },
                          description: { type: 'string' },
                          quantity: { type: 'number' }
                        }
                      }
                    }
                  }
                },
                capacity: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' }
                  }
                },
                tags: { type: 'array', items: { type: 'string' } },
                shortDescription: { type: 'string' },
                visibility: { type: 'string', enum: ['public', 'private', 'unlisted'], default: 'public' }
              },
              required: ['title', 'description', 'category', 'dateTime', 'venue']
            }
          },
          {
            name: 'update_event',
            description: 'Update an existing event (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                eventId: { type: 'string', required: true },
                updateData: { type: 'object' }
              },
              required: ['eventId', 'updateData']
            }
          },
          {
            name: 'delete_event',
            description: 'Delete an event (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                eventId: { type: 'string', required: true }
              },
              required: ['eventId']
            }
          },
          {
            name: 'get_user_bookings',
            description: 'Get user bookings (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                page: { type: 'number', default: 1 },
                limit: { type: 'number', default: 10 }
              }
            }
          },
          {
            name: 'create_booking',
            description: 'Create a new booking (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                eventId: { type: 'string', required: true },
                tickets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tier: { type: 'string', required: true },
                      quantity: { type: 'number', required: true }
                    },
                    required: ['tier', 'quantity']
                  },
                  required: true
                },
                attendeeInfo: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', required: true },
                    email: { type: 'string', required: true },
                    phone: { type: 'string' }
                  },
                  required: ['name', 'email']
                },
                paymentMethod: { type: 'string', enum: ['stripe', 'paypal', 'bank_transfer', 'wallet'], default: 'stripe' }
              },
              required: ['eventId', 'tickets', 'attendeeInfo']
            }
          },
          {
            name: 'cancel_booking',
            description: 'Cancel a booking (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                bookingId: { type: 'string', required: true },
                reason: { type: 'string' }
              },
              required: ['bookingId']
            }
          },
          {
            name: 'get_categories',
            description: 'Get all event categories',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'create_category',
            description: 'Create a new category (admin only)',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', required: true },
                slug: { type: 'string', required: true },
                color: { type: 'string', required: true },
                description: { type: 'string' }
              },
              required: ['name', 'slug', 'color']
            }
          },
          {
            name: 'register_user',
            description: 'Register a new user',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', required: true },
                email: { type: 'string', required: true },
                password: { type: 'string', required: true },
                role: { type: 'string', enum: ['user', 'organizer'], default: 'user' }
              },
              required: ['name', 'email', 'password']
            }
          },
          {
            name: 'login_user',
            description: 'Login user and get authentication token',
            inputSchema: {
              type: 'object',
              properties: {
                email: { type: 'string', required: true },
                password: { type: 'string', required: true }
              },
              required: ['email', 'password']
            }
          },
          {
            name: 'get_user_profile',
            description: 'Get current user profile (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'update_user_profile',
            description: 'Update user profile (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'object' },
                preferences: { type: 'object' }
              }
            }
          },
          {
            name: 'get_wallet_balance',
            description: 'Get user wallet balance (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'recharge_wallet',
            description: 'Recharge user wallet (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                amount: { type: 'number', required: true },
                paymentMethod: { type: 'string', enum: ['stripe', 'paypal', 'bank_transfer'], default: 'stripe' }
              },
              required: ['amount']
            }
          },
          {
            name: 'get_wallet_transactions',
            description: 'Get wallet transaction history (requires authentication)',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', default: 1 },
                limit: { type: 'number', default: 20 }
              }
            }
          },
          {
            name: 'run_testsprite_test',
            description: 'Run TestSprite API test on Event Web endpoints',
            inputSchema: {
              type: 'object',
              properties: {
                testType: { type: 'string', enum: ['smoke', 'regression', 'performance', 'security'], default: 'smoke' },
                endpoints: { type: 'array', items: { type: 'string' } },
                environment: { type: 'string', default: 'staging' }
              }
            }
          },
          {
            name: 'get_testsprite_results',
            description: 'Get TestSprite test results',
            inputSchema: {
              type: 'object',
              properties: {
                testId: { type: 'string' },
                limit: { type: 'number', default: 10 }
              }
            }
          },
          {
            name: 'test_email_service',
            description: 'Test email service configuration and send test email',
            inputSchema: {
              type: 'object',
              properties: {
                email: { type: 'string', required: true }
              },
              required: ['email']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_events':
            return await this.getEvents(args);
          case 'get_event_by_id':
            return await this.getEventById(args);
          case 'get_featured_events':
            return await this.getFeaturedEvents();
          case 'create_event':
            return await this.createEvent(args);
          case 'update_event':
            return await this.updateEvent(args);
          case 'delete_event':
            return await this.deleteEvent(args);
          case 'get_user_bookings':
            return await this.getUserBookings(args);
          case 'create_booking':
            return await this.createBooking(args);
          case 'cancel_booking':
            return await this.cancelBooking(args);
          case 'get_categories':
            return await this.getCategories();
          case 'create_category':
            return await this.createCategory(args);
          case 'register_user':
            return await this.registerUser(args);
          case 'login_user':
            return await this.loginUser(args);
          case 'get_user_profile':
            return await this.getUserProfile();
          case 'update_user_profile':
            return await this.updateUserProfile(args);
          case 'get_wallet_balance':
            return await this.getWalletBalance();
          case 'recharge_wallet':
            return await this.rechargeWallet(args);
          case 'get_wallet_transactions':
            return await this.getWalletTransactions(args);
          case 'run_testsprite_test':
            return await this.runTestSpriteTest(args);
          case 'get_testsprite_results':
            return await this.getTestSpriteResults(args);
          case 'test_email_service':
            return await this.testEmailService(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  // Helper method to make API requests
  async makeApiRequest(endpoint, method = 'GET', data = null, requiresAuth = false) {
    const config = {
      method,
      url: `${EVENT_WEB_API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (requiresAuth && EVENT_WEB_AUTH_TOKEN) {
      config.headers.Authorization = `Bearer ${EVENT_WEB_AUTH_TOKEN}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Helper method to make TestSprite API requests
  async makeTestSpriteRequest(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      url: `${TESTSPRITE_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TESTSPRITE_API_KEY}`
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`TestSprite API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Event-related methods
  async getEvents(args) {
    const params = new URLSearchParams();
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const data = await this.makeApiRequest(`/events?${params.toString()}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async getEventById(args) {
    const data = await this.makeApiRequest(`/events/${args.eventId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async getFeaturedEvents() {
    const data = await this.makeApiRequest('/events/featured');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async createEvent(args) {
    const data = await this.makeApiRequest('/events', 'POST', args, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async updateEvent(args) {
    const { eventId, updateData } = args;
    const data = await this.makeApiRequest(`/events/${eventId}`, 'PUT', updateData, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async deleteEvent(args) {
    const data = await this.makeApiRequest(`/events/${args.eventId}`, 'DELETE', null, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  // Booking-related methods
  async getUserBookings(args) {
    const params = new URLSearchParams();
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const data = await this.makeApiRequest(`/bookings?${params.toString()}`, 'GET', null, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async createBooking(args) {
    const data = await this.makeApiRequest('/bookings', 'POST', args, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async cancelBooking(args) {
    const { bookingId, reason } = args;
    const data = await this.makeApiRequest(`/bookings/${bookingId}/cancel`, 'PUT', { reason }, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  // Category-related methods
  async getCategories() {
    const data = await this.makeApiRequest('/categories');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async createCategory(args) {
    const data = await this.makeApiRequest('/categories', 'POST', args, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  // User-related methods
  async registerUser(args) {
    const data = await this.makeApiRequest('/auth/register', 'POST', args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async loginUser(args) {
    const data = await this.makeApiRequest('/auth/login', 'POST', args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async getUserProfile() {
    const data = await this.makeApiRequest('/auth/me', 'GET', null, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async updateUserProfile(args) {
    const data = await this.makeApiRequest('/auth/profile', 'PUT', args, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  // Wallet-related methods
  async getWalletBalance() {
    const data = await this.makeApiRequest('/users/wallet', 'GET', null, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async rechargeWallet(args) {
    const data = await this.makeApiRequest('/users/wallet/recharge', 'POST', args, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async getWalletTransactions(args) {
    const params = new URLSearchParams();
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const data = await this.makeApiRequest(`/users/wallet/transactions?${params.toString()}`, 'GET', null, true);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  // TestSprite integration methods
  async runTestSpriteTest(args) {
    const { testType = 'smoke', endpoints = [], environment = 'staging' } = args;
    
    const testConfig = {
      testType,
      environment,
      baseUrl: EVENT_WEB_API_BASE,
      endpoints: endpoints.length > 0 ? endpoints : [
        '/events',
        '/events/featured',
        '/categories',
        '/auth/register',
        '/auth/login'
      ],
      authToken: EVENT_WEB_AUTH_TOKEN
    };

    const data = await this.makeTestSpriteRequest('/tests/run', 'POST', testConfig);
    return {
      content: [
        {
          type: 'text',
          text: `TestSprite test started successfully!\n\nTest ID: ${data.testId}\nTest Type: ${testType}\nEnvironment: ${environment}\n\nYou can check results using get_testsprite_results tool.\n\nResponse: ${JSON.stringify(data, null, 2)}`
        }
      ]
    };
  }

  async getTestSpriteResults(args) {
    const { testId, limit = 10 } = args;
    
    let endpoint = '/tests/results';
    if (testId) {
      endpoint = `/tests/results/${testId}`;
    } else {
      endpoint += `?limit=${limit}`;
    }

    const data = await this.makeTestSpriteRequest(endpoint);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  // Email service testing method
  async testEmailService(args) {
    const data = await this.makeApiRequest('/bookings/test-email', 'POST', { email: args.email });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Event Web MCP Tool server running on stdio');
  }
}

// Start the server
const tool = new EventWebMCPTool();
tool.run().catch(console.error);

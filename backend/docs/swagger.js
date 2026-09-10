const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CSCM Backend API',
      version: '1.0.0',
      description: 'Cognitive Supply Chain Mesh Backend API Documentation',
      contact: {
        name: 'CSCM Team',
        email: 'support@cscm.example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.cscm.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'guest'],
              description: 'User role'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Inventory: {
          type: 'object',
          required: ['storeId', 'productId', 'quantity'],
          properties: {
            id: {
              type: 'integer',
              description: 'Inventory ID'
            },
            storeId: {
              type: 'integer',
              description: 'Store ID'
            },
            productId: {
              type: 'string',
              description: 'Product ID'
            },
            quantity: {
              type: 'integer',
              description: 'Available quantity'
            },
            reorderLevel: {
              type: 'integer',
              description: 'Reorder threshold'
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Order: {
          type: 'object',
          required: ['storeId', 'items'],
          properties: {
            id: {
              type: 'integer',
              description: 'Order ID'
            },
            storeId: {
              type: 'integer',
              description: 'Store ID'
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status'
            },
            totalAmount: {
              type: 'number',
              description: 'Total order amount'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string'
                  },
                  quantity: {
                    type: 'integer'
                  },
                  price: {
                    type: 'number'
                  }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Shipment: {
          type: 'object',
          required: ['orderId', 'items'],
          properties: {
            id: {
              type: 'integer',
              description: 'Shipment ID'
            },
            orderId: {
              type: 'integer',
              description: 'Associated order ID'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
              description: 'Shipment status'
            },
            trackingNumber: {
              type: 'string',
              description: 'Tracking number'
            },
            carrier: {
              type: 'string',
              description: 'Shipping carrier'
            },
            estimatedDelivery: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated delivery date'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string'
                  },
                  quantity: {
                    type: 'integer'
                  }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Event: {
          type: 'object',
          required: ['eventType', 'source'],
          properties: {
            id: {
              type: 'integer',
              description: 'Event ID'
            },
            eventType: {
              type: 'string',
              description: 'Type of event'
            },
            source: {
              type: 'string',
              description: 'Event source'
            },
            data: {
              type: 'object',
              description: 'Event data payload'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Event timestamp'
            },
            processed: {
              type: 'boolean',
              description: 'Processing status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                }
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy']
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            uptime: {
              type: 'number',
              description: 'Server uptime in seconds'
            },
            services: {
              type: 'object',
              description: 'Status of dependent services'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/api/routes/*.js', './src/api/controllers/*.js'],
  baseDir: __dirname
};

const specs = swaggerJsdoc(options);

module.exports = specs;
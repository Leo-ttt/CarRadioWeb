/**
 * Swagger/OpenAPI 文档配置 (P1-08)
 * 
 * 自动生成 API 文档
 * 访问地址: /api-docs
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Knowledge Base API',
      version: '1.0.0',
      description: '现代化知识库管理系统的 RESTful API 文档',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: '{server}/api/v1',
        description: 'API v1',
        variables: {
          server: {
            default: 'http://localhost:3000',
            description: 'API Server URL',
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'admin_token',
          description: 'JWT token stored in httpOnly cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  example: 100,
                },
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 20,
                },
                totalPages: {
                  type: 'integer',
                  example: 5,
                },
              },
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'healthy', 'unhealthy'],
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            uptime: {
              type: 'string',
              example: '3600s',
            },
            memory: {
              type: 'object',
              properties: {
                rss: {
                  type: 'string',
                  example: '100MB',
                },
                heapUsed: {
                  type: 'string',
                  example: '80MB',
                },
                heapTotal: {
                  type: 'string',
                  example: '150MB',
                },
              },
            },
            checks: {
              type: 'object',
              properties: {
                mongodb: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok', 'error', 'disabled'],
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok', 'error', 'disabled'],
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'missing_token',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'insufficient_permissions',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'NOT_FOUND',
              },
            },
          },
        },
        RateLimited: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: '请求过于频繁，请稍后再试',
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation Error - Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: '数据验证失败',
                code: 'VALIDATION_ERROR',
              },
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: '健康检查端点',
      },
      {
        name: 'Auth',
        description: '认证和授权',
      },
      {
        name: 'Documents',
        description: '文档管理',
      },
      {
        name: 'Categories',
        description: '分类管理',
      },
      {
        name: 'AI',
        description: 'AI 助手',
      },
      {
        name: 'Admin',
        description: '管理功能（需认证）',
      },
      {
        name: 'Upload',
        description: '文件上传（需认证）',
      },
      {
        name: 'Users',
        description: '用户管理（需认证）',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

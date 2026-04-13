/**
 * Swagger UI 路由 (P1-08)
 */

import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger';

const router = Router();

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API 文档
 *     description: Swagger UI for API documentation
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 */
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em; }
  `,
  customSiteTitle: 'Knowledge Base API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

export default router;

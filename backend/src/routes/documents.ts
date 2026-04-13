import { Router } from 'express';
import documentService from '../services/documentService';
import { documentViewService } from '../services/documentViewService';
import { validateDocument } from '../middleware/validation';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('documents-route');

const router = Router();

/**
 * 通用文档路由
 */

// 创建通用文档 - 需要认证
router.post('/general', 
  authenticateUser,
  requirePermission(PERMISSIONS.documents.create),
  validateDocument('general'),
  async (req, res) => {
    try {
      const document = await documentService.createGeneralDocument(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: document,
        message: '通用文档创建成功'
      });
    } catch (error) {
      logger.error({ error }, '创建通用文档失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败'
      });
    }
  }
);

// 获取通用文档列表
router.get('/general', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, author, search, language } = req.query;
    
    const result = await documentService.getDocuments('general', {
      status: 'published', // 安全：公开 API 强制只返回已发布文档
      category: category as string,
      author: author as string,
      search: search as string,
      language: language as string
    }, {
      page: Math.min(Math.max(parseInt(page as string), 1), 1000),
      limit: Math.min(Math.max(parseInt(limit as string), 1), 100)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, '获取通用文档列表失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 获取单个通用文档（不增加浏览量）
router.get('/general/:id', async (req, res) => {
  try {
    const document = await documentService.getDocument(req.params.id, 'general', false);
    
    if (!document) {
      res.status(404).json({
        success: false,
        error: '文档不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '获取通用文档失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 更新通用文档 - 需要认证
router.put('/general/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.update),
  validateDocument('general'),
  async (req, res) => {
    try {
      const document = await documentService.updateGeneralDocument(
        req.params.id,
        req.body,
        req.user!
      );
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: '文档不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        data: document,
        message: '文档更新成功'
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, '更新通用文档失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      });
    }
  }
);

// 删除通用文档 - 需要认证
router.delete('/general/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.delete),
  async (req, res) => {
    try {
      const success = await documentService.deleteDocument(
        req.params.id,
        'general',
        req.user!
      );
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: '文档不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        message: '文档删除成功'
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, '删除通用文档失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }
);

/**
 * 视频教程路由
 */

// 创建视频教程 - 需要认证
router.post('/video',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.create),
  validateDocument('video'),
  async (req, res) => {
    try {
      const document = await documentService.createVideoTutorial(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: document,
        message: '视频教程创建成功'
      });
    } catch (error) {
      logger.error({ error }, '创建视频教程失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败'
      });
    }
  }
);

// 获取视频教程列表
router.get('/video', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, author, search } = req.query;
    
    const result = await documentService.getDocuments('video', {
      status: 'published', // 安全：公开 API 强制只返回已发布教程
      category: category as string,
      author: author as string,
      search: search as string
    }, {
      page: Math.min(Math.max(parseInt(page as string), 1), 1000),
      limit: Math.min(Math.max(parseInt(limit as string), 1), 100)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, '获取视频教程列表失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 获取单个视频教程
router.get('/video/:id', async (req, res) => {
  try {
    const document = await documentService.getDocument(req.params.id, 'video');
    
    if (!document) {
      res.status(404).json({
        success: false,
        error: '视频教程不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '获取视频教程失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 更新视频教程 - 需要认证
router.put('/video/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.update),
  validateDocument('video'),
  async (req, res) => {
    try {
      const document = await documentService.updateVideoTutorial(
        req.params.id,
        req.body,
        req.user!
      );
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: '视频教程不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        data: document,
        message: '视频教程更新成功'
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, '更新视频教程失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      });
    }
  }
);

// 删除视频教程 - 需要认证
router.delete('/video/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.delete),
  async (req, res) => {
    try {
      const success = await documentService.deleteDocument(
        req.params.id,
        'video',
        req.user!
      );
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: '视频教程不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        message: '视频教程删除成功'
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, '删除视频教程失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }
);

/**
 * 结构化文章路由
 */

// 创建结构化文章 - 需要认证
router.post('/structured',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.create),
  validateDocument('structured'),
  async (req, res) => {
    try {
      const document = await documentService.createStructuredArticle(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: document,
        message: '结构化文章创建成功'
      });
    } catch (error) {
      logger.error({ error }, '创建结构化文章失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败'
      });
    }
  }
);

// 获取结构化文章列表
router.get('/structured', async (req, res) => {
  try {
    const { page = 1, limit = 10, brand, model, search } = req.query;
    
    const result = await documentService.getDocuments('structured', {
      status: 'published', // 安全：公开 API 强制只返回已发布文章
      brand: brand as string,
      model: model as string,
      search: search as string
    }, {
      page: Math.min(Math.max(parseInt(page as string), 1), 1000),
      limit: Math.min(Math.max(parseInt(limit as string), 1), 100)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, '获取结构化文章列表失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 获取单个结构化文章
router.get('/structured/:id', async (req, res) => {
  try {
    const document = await documentService.getDocument(req.params.id, 'structured');
    
    if (!document) {
      res.status(404).json({
        success: false,
        error: '结构化文章不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '获取结构化文章失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    });
  }
});

// 更新结构化文章 - 需要认证
router.put('/structured/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.update),
  validateDocument('structured'),
  async (req, res) => {
    try {
      const document = await documentService.updateStructuredArticle(
        req.params.id,
        req.body,
        req.user!
      );
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: '结构化文章不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        data: document,
        message: '结构化文章更新成功'
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, '更新结构化文章失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      });
    }
  }
);

// 删除结构化文章 - 需要认证
router.delete('/structured/:id',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.delete),
  async (req, res) => {
    try {
      const success = await documentService.deleteDocument(
        req.params.id,
        'structured',
        req.user!
      );
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: '结构化文章不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        message: '结构化文章删除成功'
      });
    } catch (error) {
      logger.error({ error, id: req.params.id }, '删除结构化文章失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败'
      });
    }
  }
);

/**
 * 通用操作
 */

// 发布文档 - 需要认证
router.patch('/:type/:id/publish',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.publish),
  async (req, res) => {
    try {
      const { type, id } = req.params;
      
      let document;
      switch (type) {
        case 'general':
          document = await documentService.updateGeneralDocument(id, { status: 'published' }, req.user!);
          break;
        case 'video':
          document = await documentService.updateVideoTutorial(id, { status: 'published' }, req.user!);
          break;
        case 'structured':
          document = await documentService.updateStructuredArticle(id, { status: 'published' }, req.user!);
          break;
        default:
          res.status(400).json({
            success: false,
            error: '无效的文档类型'
          });
          return;
      }
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: '文档不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        data: document,
        message: '文档发布成功'
      });
    } catch (error) {
      logger.error({ error, type: req.params.type, id: req.params.id }, '发布文档失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '发布失败'
      });
    }
  }
);

// 归档文档 - 需要认证
router.patch('/:type/:id/archive',
  authenticateUser,
  requirePermission(PERMISSIONS.documents.update),
  async (req, res) => {
    try {
      const { type, id } = req.params;
      
      let document;
      switch (type) {
        case 'general':
          document = await documentService.updateGeneralDocument(id, { status: 'archived' }, req.user!);
          break;
        case 'video':
          document = await documentService.updateVideoTutorial(id, { status: 'archived' }, req.user!);
          break;
        case 'structured':
          document = await documentService.updateStructuredArticle(id, { status: 'archived' }, req.user!);
          break;
        default:
          res.status(400).json({
            success: false,
            error: '无效的文档类型'
          });
          return;
      }
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: '文档不存在'
        });
        return;
      }
      
      res.json({
        success: true,
        data: document,
        message: '文档归档成功'
      });
    } catch (error) {
      logger.error({ error, type: req.params.type, id: req.params.id }, '归档文档失败');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '归档失败'
      });
    }
  }
);

// 搜索文档
router.get('/search', async (req, res) => {
  try {
    const { q, type, category, status } = req.query;
    
    if (!q) {
      res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      });
      return;
    }
    
    const searchPromises = [];
    
    if (!type || type === 'general') {
      searchPromises.push(
        documentService.getDocuments('general', { search: q as string, category: category as string, status: status as string })
      );
    }
    
    if (!type || type === 'video') {
      searchPromises.push(
        documentService.getDocuments('video', { search: q as string, category: category as string, status: status as string })
      );
    }
    
    if (!type || type === 'structured') {
      searchPromises.push(
        documentService.getDocuments('structured', { search: q as string, category: category as string, status: status as string })
      );
    }
    
    const results = await Promise.all(searchPromises);
    const allDocuments = results.flatMap(result => result.documents);
    
    res.json({
      success: true,
      data: {
        documents: allDocuments,
        total: allDocuments.length,
        query: q,
        type: type || 'all'
      }
    });
  } catch (error) {
    logger.error({ error, query: req.query.q }, '搜索文档失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '搜索失败'
    });
  }
});

/**
 * 记录文档浏览
 */
router.post('/:type/:id/view', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { fingerprint, sessionId } = req.body;

    if (!fingerprint) {
      res.status(400).json({
        success: false,
        error: '缺少浏览器指纹'
      });
      return;
    }

    if (!['general', 'video', 'structured'].includes(type)) {
      res.status(400).json({
        success: false,
        error: '无效的文档类型'
      });
      return;
    }

    const document = await documentService.getDocument(id, type);
    
    if (!document) {
      res.status(404).json({
        success: false,
        error: '文档不存在'
      });
      return;
    }

    const documentId = (document._id as any).toString();

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) || 
                      req.socket.remoteAddress || 
                      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await documentViewService.recordView(
      documentId,
      type as 'general' | 'video' | 'structured',
      fingerprint,
      ipAddress,
      userAgent,
      sessionId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error, type: req.params.type, id: req.params.id }, '记录文档浏览失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '记录浏览失败'
    });
  }
});

/**
 * 获取文档浏览统计
 */
router.get('/:type/:id/view-stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await documentViewService.getViewStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '获取浏览统计失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取浏览统计失败'
    });
  }
});

export default router;

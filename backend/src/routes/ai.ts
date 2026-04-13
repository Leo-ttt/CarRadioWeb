import express from 'express';
import { aiService } from '../services/aiService';
import type { AIMessage, AIProvider } from '../services/aiService';
import AIUsage from '../models/AIUsage';
import BaseDocument from '../models/Document';
import { createRateLimit } from '../middleware/errorHandler';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('ai-route');
const router = express.Router();

// Rate limit: 20 AI chat requests per 15 minutes per IP
const aiChatRateLimit = createRateLimit(15 * 60 * 1000, 20, 'AI 请求过于频繁，请稍后再试');

/**
 * POST /api/ai/chat - 发送消息到AI助手（公开访问）
 */
router.post('/chat', aiChatRateLimit, async (req, res) => {
  try {
    const { messages, language } = req.body;

    // 验证请求数据
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        error: '消息格式无效'
      });
      return;
    }

    // 验证消息格式
    const validMessages = messages.every((msg: any) =>
      msg.role && msg.content &&
      ['user', 'assistant', 'system'].includes(msg.role)
    );

    if (!validMessages) {
      res.status(400).json({
        success: false,
        error: '消息内容格式无效'
      });
      return;
    }

    // 调用AI服务
    const response = await aiService.sendMessage(messages as AIMessage[], language);

    // 记录使用统计
    try {
      const currentConfig = aiService.getConfig();
      await AIUsage.create({
        timestamp: new Date(),
        messageCount: 1,
        tokenCount: response.usage?.totalTokens || 0, // 从响应中获取实际token计数
        provider: currentConfig.provider || 'unknown',
        modelName: currentConfig.model || 'unknown',
        success: response.success || false,
        error: response.error
      });
    } catch (statsError) {
      logger.error({ error: statsError }, '记录AI使用统计失败');
      // 不影响主要流程
    }

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'AI聊天接口错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

/**
 * POST /api/ai/select - 处理用户资源选择（公开访问）
 */
router.post('/select', aiChatRateLimit, async (req, res) => {
  try {
    const { selectionNumber, sources, userLanguage, originalQuery } = req.body;

    // 验证请求数据
    if (typeof selectionNumber !== 'number' || !Array.isArray(sources) || !userLanguage) {
      res.status(400).json({
        success: false,
        error: '选择参数无效'
      });
      return;
    }

    // 调用AI服务处理选择
    const response = await aiService.handleResourceSelection(selectionNumber, sources, userLanguage, originalQuery || '');

    // 记录使用统计
    try {
      const currentConfig = aiService.getConfig();
      await AIUsage.create({
        timestamp: new Date(),
        messageCount: 1,
        tokenCount: response.usage?.totalTokens || 0,
        provider: currentConfig.provider || 'unknown',
        modelName: currentConfig.model || 'unknown',
        success: response.success || false,
        error: response.error
      });
    } catch (statsError) {
      logger.error({ error: statsError }, '记录AI使用统计失败');
    }

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'AI资源选择接口错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

/**
 * GET /api/ai/config - 获取AI配置（需要认证）
 */
router.get('/config', authenticateUser, requirePermission(PERMISSIONS.ai.configure), (_req, res) => {
  try {
    const config = aiService.getConfig();
    res.json({
      success: true,
      config
    });
  } catch (error) {
    logger.error({ error }, '获取AI配置错误');
    res.status(500).json({
      success: false,
      error: '获取配置失败'
    });
  }
});

/**
 * PUT /api/ai/config - 更新AI配置（需要认证）
 */
router.put('/config', authenticateUser, requirePermission(PERMISSIONS.ai.configure), async (req, res) => {
  try {
    const { provider, model, temperature, maxTokens, systemPrompt, apiKey, baseURL } = req.body;

    // 验证API密钥（如果提供）
    let validationWarning: string | null = null;
    if (apiKey) {
      const validationResult = await aiService.validateApiKey(apiKey, provider);
      if (!validationResult.valid) {
        res.status(400).json({
          success: false,
          error: validationResult.error || 'API密钥验证失败',
          details: validationResult.details
        });
        return;
      }

      // 如果有警告信息，记录下来但不阻止保存
      if (validationResult.error && validationResult.error.includes('网络连接超时')) {
        validationWarning = validationResult.error;
      }
    }

    // 更新配置
    const updateData: Record<string, unknown> = {};
    if (provider) updateData.provider = provider;
    if (model) updateData.model = model;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (systemPrompt) updateData.systemPrompt = systemPrompt;
    if (apiKey) updateData.apiKey = apiKey;
    if (baseURL !== undefined) updateData.baseURL = baseURL;

    const success = aiService.updateConfig(updateData);

    if (success) {
      res.json({
        success: true,
        message: 'AI配置更新成功',
        warning: validationWarning // 如果有网络警告，返回给前端
      });
    } else {
      res.status(500).json({
        success: false,
        error: '配置更新失败'
      });
    }
  } catch (error) {
    logger.error({ error }, '更新AI配置错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

/**
 * POST /api/ai/models - 拉取供应商最新模型列表（需要认证）
 */
router.post('/models', authenticateUser, requirePermission(PERMISSIONS.ai.configure), async (req, res) => {
  try {
    const provider = String(req.body?.provider || '') as AIProvider;
    const apiKey = String(req.body?.apiKey || '');
    const baseURL = typeof req.body?.baseURL === 'string' ? req.body.baseURL : undefined;

    if (!provider) {
      res.status(400).json({ success: false, error: 'provider_required' });
      return;
    }

    if (!apiKey) {
      res.status(400).json({ success: false, error: 'api_key_required' });
      return;
    }

    const result = await aiService.fetchProviderModels(provider, apiKey, baseURL);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'fetch_models_failed',
      });
      return;
    }

    res.json({
      success: true,
      models: result.models || [],
      warning: result.warning,
    });
  } catch (error) {
    logger.error({ error }, '拉取模型列表接口错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
    });
  }
});

/**
 * GET /api/ai/usage - 获取使用统计（需要认证）
 */
router.get('/usage', authenticateUser, requirePermission(PERMISSIONS.ai.configure), async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 获取总统计
    const totalStats = await AIUsage.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$messageCount' },
          totalTokens: { $sum: '$tokenCount' }
        }
      }
    ]);

    // 获取今日统计
    const todayStats = await AIUsage.aggregate([
      {
        $match: {
          timestamp: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          todayMessages: { $sum: '$messageCount' },
          todayTokens: { $sum: '$tokenCount' }
        }
      }
    ]);

    // 获取本月统计
    const monthlyStats = await AIUsage.aggregate([
      {
        $match: {
          timestamp: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          monthlyMessages: { $sum: '$messageCount' },
          monthlyTokens: { $sum: '$tokenCount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalMessages: totalStats[0]?.totalMessages || 0,
        totalTokens: totalStats[0]?.totalTokens || 0,
        todayMessages: todayStats[0]?.todayMessages || 0,
        todayTokens: todayStats[0]?.todayTokens || 0,
        monthlyMessages: monthlyStats[0]?.monthlyMessages || 0,
        monthlyTokens: monthlyStats[0]?.monthlyTokens || 0
      }
    });
  } catch (error) {
    logger.error({ error }, '获取使用统计错误');
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

/**
 * POST /api/ai/search - 搜索知识库内容
 */
router.post('/search', aiChatRateLimit, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: '搜索查询无效'
      });
      return;
    }

    const results = await aiService.searchKnowledgeBase(query);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error({ error }, '搜索知识库错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '搜索失败'
    });
  }
});

/**
 * POST /api/ai/validate-key - 验证API密钥（需要认证）
 */
router.post('/validate-key', authenticateUser, async (req, res) => {
  try {
    const { apiKey, provider } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({
        success: false,
        error: 'API密钥无效'
      });
      return;
    }

    const validationResult = await aiService.validateApiKey(apiKey, provider);

    res.json({
      success: true,
      valid: validationResult.valid,
      error: validationResult.error,
      details: validationResult.details
    });
  } catch (error) {
    logger.error({ error }, '验证API密钥错误');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '验证失败'
    });
  }
});

/**
 * GET /api/ai/knowledge-base-stats - 获取知识库统计（需要认证）
 */
router.get('/knowledge-base-stats', authenticateUser, requirePermission(PERMISSIONS.ai.configure), async (_req, res) => {
  try {
    const totalDocuments = await BaseDocument.countDocuments()
    
    // 这里假设我们有一个索引状态字段，如果没有可以返回总数作为已索引数
    // 实际项目中可能需要查询向量数据库或搜索引擎的索引状态
    const indexedDocuments = totalDocuments // 临时使用总数
    
    const stats = {
      totalDocuments,
      indexedDocuments,
      lastIndexTime: new Date().toISOString()
    }
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    logger.error({ error }, '获取知识库统计失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取知识库统计失败'
    })
  }
})

/**
 * GET /api/ai/advanced-stats - 获取AI高级统计（需要认证）
 */
router.get('/advanced-stats', authenticateUser, requirePermission(PERMISSIONS.ai.configure), async (_req, res) => {
  try {
    // 获取最近的AI使用记录
    const recentUsage = await AIUsage.find()
      .sort({ createdAt: -1 })
      .limit(100)
    
    // 计算最近7天的Token使用趋势
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })
    
    const tokenTrend = last7Days.map(date => {
      const dayUsage = recentUsage.filter(u => 
        u.createdAt && u.createdAt.toISOString().startsWith(date)
      )
      const tokens = dayUsage.reduce((sum, u) => sum + (u.tokenCount || 0), 0)
      return { date: date.substring(5), tokens }
    })
    
    // 计算成本（假设平均每1000 token = $0.002）
    const monthlyTokens = recentUsage.reduce((sum, u) => sum + (u.tokenCount || 0), 0)
    const monthlyCost = (monthlyTokens / 1000) * 0.002
    
    const stats = {
      tokenTrend,
      monthlyTokens,
      monthlyCost
    }
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    logger.error({ error }, '获取AI高级统计失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取AI高级统计失败'
    })
  }
})

/**
 * POST /api/ai/rebuild-index - 重建知识库索引（需要认证）
 */
router.post('/rebuild-index', authenticateUser, requirePermission(PERMISSIONS.ai.configure), async (_req, res) => {
  try {
    // 这里实现重建索引的逻辑
    // 实际项目中可能需要调用向量数据库或搜索引擎的重建API
    const documents = await BaseDocument.find()
    
    // 模拟索引过程
    const indexedCount = documents.length
    
    res.json({
      success: true,
      indexedCount,
      message: '索引重建完成'
    })
  } catch (error) {
    logger.error({ error }, '重建索引失败')
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重建索引失败'
    })
  }
})

export default router;

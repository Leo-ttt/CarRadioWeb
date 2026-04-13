/**
 * 系统配置路由
 * 管理钉钉机器人、阿里云OSS等第三方服务配置
 * 认证保护已在 index.ts 路由挂载层统一添加
 */

import express, { Request, Response } from 'express';
import systemConfigService from '../services/systemConfigService';
import { notificationService } from '../services/notificationService';
import type { NotificationChannelType, NotificationConfig } from '../models/SystemConfig';
import { createLogger } from '../utils/logger';
import { requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';

const logger = createLogger('system-config-route');

const router = express.Router();

// 配置状态概览
router.get('/status', requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response) => {
  try {
    const status = await systemConfigService.getConfigStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error({ error }, '获取配置状态失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取配置状态失败'
    });
  }
});

// 获取钉钉机器人配置
router.get('/dingtalk', requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getDingtalkConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ error }, '获取钉钉配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取配置失败'
    });
  }
});

// 获取钉钉配置（编辑用）
router.get('/dingtalk/edit', requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getDingtalkConfigForEdit();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ error }, '获取钉钉编辑配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取配置失败'
    });
  }
});

// 更新钉钉机器人配置
router.put('/dingtalk', requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.updateDingtalkConfig(req.body);
    res.json({ success: true, data: config, message: '钉钉配置已更新' });
  } catch (error) {
    logger.error({ error }, '更新钉钉配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新配置失败'
    });
  }
});

// 测试钉钉机器人配置
router.post('/dingtalk/test', requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response) => {
  try {
    const result = await systemConfigService.testDingtalkConfig(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, '测试钉钉配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '测试配置失败'
    });
  }
});

// 获取阿里云OSS配置
router.get('/oss', requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getOSSConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ error }, '获取OSS配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取配置失败'
    });
  }
});

// 获取OSS配置（编辑用）
router.get('/oss/edit', async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getOSSConfigForEdit();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ error }, '获取OSS编辑配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取配置失败'
    });
  }
});

// 更新阿里云OSS配置
router.put('/oss', requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.updateOSSConfig(req.body);
    res.json({ success: true, data: config, message: 'OSS配置已更新' });
  } catch (error) {
    logger.error({ error }, '更新OSS配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新配置失败'
    });
  }
});

// 测试阿里云OSS配置
router.post('/oss/test', requirePermission(PERMISSIONS.settings.update), async (req: Request, res: Response) => {
  try {
    const result = await systemConfigService.testOSSConfig(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, '测试OSS配置失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '测试配置失败'
    });
  }
});

// 获取OSS存储详情
router.get('/oss/storage-details', requirePermission(PERMISSIONS.settings.read), async (req: Request, res: Response) => {
  try {
    const result = await systemConfigService.getOSSStorageDetails();
    res.json(result);
  } catch (error) {
    logger.error({ error }, '获取OSS存储详情失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取存储详情失败'
    });
  }
});

// ==================== Notification channel routes ====================

const VALID_CHANNELS: NotificationChannelType[] = ['dingtalk', 'wecom', 'serverchan', 'smtp', 'webhook'];

// Get all channel status (enabled/disabled)
router.get('/notification/status', requirePermission(PERMISSIONS.notifications.read), async (req: Request, res: Response) => {
  try {
    const status = await notificationService.getAllChannelStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error({ error }, 'Failed to get channel status');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channel status'
    });
  }
});

// Get specific channel config
router.get('/notification/:channel', requirePermission(PERMISSIONS.notifications.read), async (req: Request, res: Response) => {
  try {
    const channel = req.params.channel as NotificationChannelType;
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ success: false, error: `Invalid channel: ${channel}` });
    }

    const edit = req.query.edit === 'true';
    const config = edit
      ? await notificationService.getChannelConfigForEdit(channel)
      : await notificationService.getChannelConfig(channel);

    res.json({ success: true, data: config });
  } catch (error) {
    logger.error({ error, channel: req.params.channel }, 'Failed to get channel config');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channel config'
    });
  }
});

// Update specific channel config
router.put('/notification/:channel', requirePermission(PERMISSIONS.notifications.update), async (req: Request, res: Response) => {
  try {
    const channel = req.params.channel as NotificationChannelType;
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ success: false, error: `Invalid channel: ${channel}` });
    }

    const config = await notificationService.updateChannelConfig(
      channel,
      req.body as NotificationConfig
    );
    res.json({ success: true, data: config, message: `${channel} config updated` });
  } catch (error) {
    logger.error({ error, channel: req.params.channel }, 'Failed to update channel config');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update channel config'
    });
  }
});

// Test specific channel
router.post('/notification/:channel/test', requirePermission(PERMISSIONS.notifications.update), async (req: Request, res: Response) => {
  try {
    const channel = req.params.channel as NotificationChannelType;
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ success: false, error: `Invalid channel: ${channel}` });
    }

    const result = await notificationService.testChannel(channel, req.body as NotificationConfig);
    res.json(result);
  } catch (error) {
    logger.error({ error, channel: req.params.channel }, 'Failed to test channel');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test channel'
    });
  }
});

export default router;

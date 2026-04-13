import express from 'express';
import { authenticateUser, requireSuperAdmin } from '../middleware/auth';
import { deployForum, getForumStatus, getForumDeployCredentials, cancelDeploy, startForumContainers, uninstallForum, getForumExtensions, installForumExtension, uninstallForumExtension, fixFlarumStoragePermissions, flarumCacheClearAndPublishAssets, getForumLogs, repairForumBoot, fixForumOneShot } from '../services/forumService';

const router = express.Router();

// 部署论坛
router.post('/deploy', authenticateUser, requireSuperAdmin, async (_req, res) => {
  deployForum();
  res.status(202).json({ success: true, message: 'Deployment started.' });
});

// 仅启动论坛容器（已部署过但容器已停止时，如 ERR_CONNECTION_REFUSED）
router.post('/start', authenticateUser, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await startForumContainers();
    if (result.success) {
      res.json({ success: true, message: 'Forum containers started.' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start forum containers.' });
  }
});

// 一键卸载论坛（停止并移除容器，并删除 flarum/db、assets、extensions，下次部署为全新环境）
router.post('/uninstall', authenticateUser, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await uninstallForum();
    if (result.success) {
      res.json({ success: true, message: 'Forum uninstalled.' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to uninstall forum.' });
  }
});

// 取消部署
router.post('/cancel-deploy', authenticateUser, requireSuperAdmin, async (_req, res) => {
  await cancelDeploy();
  res.status(200).json({ success: true, message: 'Cancellation request sent.' });
});

// 获取论坛状态（需管理员），含 DB_PASSWORD 供安装页复制
router.get('/status', authenticateUser, requireSuperAdmin, async (_req, res) => {
  try {
    const status = await getForumStatus();
    const credentials = getForumDeployCredentials();
    res.json({ success: true, data: { ...status, dbPassword: credentials.dbPassword } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get forum status.' });
  }
});

// 公开接口：仅返回是否已部署，用于前台论坛页是否跳转
router.get('/public-status', async (_req, res) => {
  try {
    const status = await getForumStatus();
    const deployed = status?.status === 'deployed';
    res.json({ success: true, deployed });
  } catch (error) {
    res.json({ success: true, deployed: false });
  }
});

// 论坛插件列表（含是否已安装）
router.get('/extensions', authenticateUser, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await getForumExtensions();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get forum extensions.' });
  }
});

// 一键安装论坛插件
router.post('/extensions/:id/install', authenticateUser, requireSuperAdmin, async (req, res) => {
  try {
    const result = await installForumExtension(req.params.id);
    if (result.success) {
      res.json({ success: true, message: 'Extension installed.' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to install extension.' });
  }
});

// 一键卸载论坛插件
router.post('/extensions/:id/uninstall', authenticateUser, requireSuperAdmin, async (req, res) => {
  try {
    const result = await uninstallForumExtension(req.params.id);
    if (result.success) {
      res.json({ success: true, message: result.message ?? 'Extension uninstalled.' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to uninstall extension.' });
  }
});

// 获取论坛最近日志（从 Docker 容器读取，便于排查 boot error）
router.get('/logs', authenticateUser, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await getForumLogs();
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, logs: result.logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get forum logs.' });
  }
});

// 一键修复：权限 + 缓存/资源 + 根据 Docker 日志重装问题扩展 + 再次权限（合并原“修复权限”与“修复启动”）
router.post('/fix', authenticateUser, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await fixForumOneShot();
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    const count = (result.reinstalled ?? []).length;
    res.json({
      success: true,
      reinstalled: result.reinstalled ?? [],
      message: count > 0 ? `已重装 ${count} 个问题扩展并修复权限与缓存，请刷新论坛。` : '已修复权限与缓存，请刷新论坛。',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fix forum.' });
  }
});

export default router;

import express from 'express'
import {
  getAudioPresets,
  createAudioPreset,
  updateAudioPreset,
  deleteAudioPreset,
  migrateFromLocalStorage
} from '../services/audioPresetService'
import { createLogger } from '../utils/logger'
import { requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'

const logger = createLogger('audio-presets-route')
const router = express.Router()

/**
 * 获取所有音频预设
 */
router.get('/', requirePermission(PERMISSIONS.settings.read), async (req, res) => {
  try {
    const presets = await getAudioPresets()
    
    res.json({
      success: true,
      presets
    })
  } catch (error) {
    logger.error({ error }, '获取音频预设失败')
    res.status(500).json({
      success: false,
      error: '获取音频预设失败'
    })
  }
})

/**
 * 创建新音频预设
 */
router.post('/', requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { name, settings } = req.body;

    if (!name || !settings) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
      return;
    }

    const preset = await createAudioPreset({
      name,
      settings
    });

    res.json({
      success: true,
      preset
    });
  } catch (error) {
    logger.error({ error }, '创建音频预设失败');
    res.status(500).json({
      success: false,
      error: '创建音频预设失败'
    });
  }
});

/**
 * 更新音频预设
 */
router.put('/:id', requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const preset = await updateAudioPreset(id, updates);

    if (!preset) {
      res.status(404).json({
        success: false,
        error: '音频预设不存在'
      });
      return;
    }

    res.json({
      success: true,
      preset
    });
  } catch (error) {
    logger.error({ error }, '更新音频预设失败');
    res.status(500).json({
      success: false,
      error: '更新音频预设失败'
    });
  }
});

/**
 * 删除音频预设
 */
router.delete('/:id', requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { id } = req.params
    const success = await deleteAudioPreset(id)
    
    if (success) {
      res.json({
        success: true,
        message: '音频预设删除成功'
      })
    } else {
      res.status(404).json({
        success: false,
        error: '音频预设不存在'
      })
    }
  } catch (error) {
    logger.error({ error }, '删除音频预设失败')
    res.status(500).json({
      success: false,
      error: '删除音频预设失败'
    })
  }
})

/**
 * 从localStorage迁移数据
 */
router.post('/migrate/localStorage', requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { localData } = req.body;

    if (!Array.isArray(localData)) {
      res.status(400).json({
        success: false,
        error: 'localData必须是数组'
      });
      return;
    }

    const migratedCount = await migrateFromLocalStorage(localData);

    res.json({
      success: true,
      migratedCount,
      message: `成功迁移 ${migratedCount} 个音频预设数据`
    });
  } catch (error) {
    logger.error({ error }, '迁移音频预设数据失败');
    res.status(500).json({
      success: false,
      error: '迁移音频预设数据失败'
    });
  }
});

export default router

import { Router, Request, Response } from 'express'
import { canbusSettingsService } from '../services/canbusSettingsService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import logger from '../utils/logger'

const router = Router()

// ==================== 公开接口 ====================

/**
 * 获取所�?CANBox 类型（仅启用的）
 */
router.get('/canbox-types', async (_req: Request, res: Response) => {
  try {
    const types = await canbusSettingsService.getAllCANBoxTypes(true)
    res.json({ success: true, data: types })
  } catch (error) {
    logger.error({ err: error }, 'GET /canbox-types error')
    res.status(500).json({ success: false, error: 'Failed to get CANBox types' })
  }
})

/**
 * 获取设置信息（图�?描述�?
 */
router.get('/setting', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.query;

    if (!vehicleId) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: vehicleId'
      });
      return;
    }

    const setting = await canbusSettingsService.getSettingByVehicle(vehicleId as string);

    if (!setting) {
      res.status(404).json({ success: false, error: 'Setting not found' });
      return;
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error({ err: error }, 'GET /setting error');
    res.status(500).json({ success: false, error: 'Failed to get setting' });
  }
});

// ==================== 管理接口（需要认证）====================

// --- CANBox 类型管理 ---

/**
 * 获取所�?CANBox 类型（包括禁用的�?
 */
router.get('/admin/canbox-types', authenticateUser, requirePermission(PERMISSIONS.canbus.read), async (_req: Request, res: Response) => {
  try {
    const types = await canbusSettingsService.getAllCANBoxTypes(false)
    res.json({ success: true, data: types })
  } catch (error) {
    logger.error({ err: error }, 'GET /admin/canbox-types error')
    res.status(500).json({ success: false, error: 'Failed to get CANBox types' })
  }
})

/**
 * 创建 CANBox 类型
 */
router.post('/admin/canbox-types', authenticateUser, requirePermission(PERMISSIONS.canbus.update), async (req: Request, res: Response) => {
  try {
    const canboxType = await canbusSettingsService.createCANBoxType(req.body);
    res.status(201).json({ success: true, data: canboxType });
  } catch (error: unknown) {
    logger.error({ err: error }, 'POST /admin/canbox-types error');
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      res.status(400).json({ success: false, error: 'CANBox type name already exists' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create CANBox type' });
  }
});

/**
 * 更新 CANBox 类型
 */
router.put('/admin/canbox-types/:id', authenticateUser, requirePermission(PERMISSIONS.canbus.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const canboxType = await canbusSettingsService.updateCANBoxType(id, req.body);

    if (!canboxType) {
      res.status(404).json({ success: false, error: 'CANBox type not found' });
      return;
    }

    res.json({ success: true, data: canboxType });
  } catch (error) {
    logger.error({ err: error }, 'PUT /admin/canbox-types/:id error');
    res.status(500).json({ success: false, error: 'Failed to update CANBox type' });
  }
});

/**
 * 删除 CANBox 类型
 */
router.delete('/admin/canbox-types/:id', authenticateUser, requirePermission(PERMISSIONS.canbus.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await canbusSettingsService.deleteCANBoxType(id);
    res.json({ success: true, message: 'CANBox type deleted successfully' });
  } catch (error: unknown) {
    logger.error({ err: error }, 'DELETE /admin/canbox-types/:id error');
    const err = error as Error;
    if (err.message?.includes('Cannot delete')) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete CANBox type' });
  }
});

// --- CANBus 设置管理 ---

/**
 * 获取所有设�?
 */
router.get('/admin/settings', authenticateUser, requirePermission(PERMISSIONS.canbus.read), async (req: Request, res: Response) => {
  try {
    const { vehicleId, isActive } = req.query
    const filters: Record<string, unknown> = {}
    
    if (vehicleId) filters.vehicleId = vehicleId
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    
    const settings = await canbusSettingsService.getAllSettings(filters as {
      vehicleId?: string
      isActive?: boolean
    })
    res.json({ success: true, data: settings })
  } catch (error) {
    logger.error({ err: error }, 'GET /admin/settings error')
    res.status(500).json({ success: false, error: 'Failed to get settings' })
  }
})

/**
 * 创建设置
 */
router.post('/admin/settings', authenticateUser, requirePermission(PERMISSIONS.canbus.update), async (req: Request, res: Response) => {
  try {
    const setting = await canbusSettingsService.createSetting(req.body);
    res.status(201).json({ success: true, data: setting });
  } catch (error: unknown) {
    logger.error({ err: error }, 'POST /admin/settings error');
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Setting already exists for this vehicle'
      });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create setting' });
  }
});

/**
 * 更新设置
 */
router.put('/admin/settings/:id', authenticateUser, requirePermission(PERMISSIONS.canbus.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const setting = await canbusSettingsService.updateSetting(id, req.body);

    if (!setting) {
      res.status(404).json({ success: false, error: 'Setting not found' });
      return;
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error({ err: error }, 'PUT /admin/settings/:id error');
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

/**
 * 删除设置
 */
router.delete('/admin/settings/:id', authenticateUser, requirePermission(PERMISSIONS.canbus.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await canbusSettingsService.deleteSetting(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Setting not found' });
      return;
    }

    res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'DELETE /admin/settings/:id error');
    res.status(500).json({ success: false, error: 'Failed to delete setting' });
  }
});

export default router

import express, { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';
import { systemLogger } from '../utils/logger';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

interface VehicleQuery {
  language?: 'en' | 'ru';
  brand?: string;
  $or?: Array<{
    brand?: { $regex: string; $options: string };
    modelName?: { $regex: string; $options: string };
  }>;
}

/**
 * Get all vehicles
 * GET /api/vehicles
 * 支持按资料体系过滤：?language=en 或 ?language=ru
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10000, brand, search, language } = req.query;
    
    const query: VehicleQuery = {};
    
    // 按资料体系过滤
    if (language && ['en', 'ru'].includes(language as string)) {
      query.language = language as 'en' | 'ru';
    }
    
    if (brand) {
      query.brand = brand as string;
    }
    
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { brand: { $regex: escapedSearch, $options: 'i' } },
        { modelName: { $regex: escapedSearch, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    res.json({
      success: true,
      data: {
        items: vehicles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    systemLogger.error({ error }, 'Failed to get vehicles');
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicles'
    });
  }
});

/**
 * Get vehicle by ID
 * GET /api/vehicles/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    systemLogger.error({ error, id: req.params.id }, 'Failed to get vehicle');
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle'
    });
  }
});

/**
 * Create vehicle - 需要认证
 * POST /api/vehicles
 * 需要指定 language 字段
 */
router.post('/', authenticateUser, requirePermission(PERMISSIONS.vehicles.create), async (req: Request, res: Response) => {
  try {
    const { brand, modelName, year, password, language } = req.body;
    
    // 记录接收到的数据
    systemLogger.info({ 
      body: req.body,
      brand,
      modelName,
      year,
      password: password ? '***' : undefined,
      language 
    }, 'Creating vehicle');
    
    // 验证 language 字段
    if (!language || !['en', 'ru'].includes(language)) {
      systemLogger.warn({ 
        receivedLanguage: language,
        body: req.body 
      }, 'Invalid or missing language field');
      
      return res.status(400).json({
        success: false,
        error: '缺少有效的 language 字段（en 或 ru）',
        details: {
          receivedLanguage: language,
          expectedValues: ['en', 'ru']
        }
      });
    }
    
    // Get next ID (在同一语言下唯一)
    const lastVehicle = await Vehicle.findOne({ language }).sort({ id: -1 });
    const nextId = lastVehicle ? lastVehicle.id + 1 : 1;
    
    const vehicle = new Vehicle({
      id: nextId,
      brand,
      modelName,
      year,
      password: password || '',
      documents: 0,
      language
    });
    
    await vehicle.save();
    
    systemLogger.info({ vehicleId: vehicle._id, language }, 'Vehicle created successfully');
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    systemLogger.error({ error, body: req.body }, 'Failed to create vehicle');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create vehicle'
    });
  }
});

/**
 * Update vehicle - 需要认证
 * PUT /api/vehicles/:id
 */
router.put('/:id', authenticateUser, requirePermission(PERMISSIONS.vehicles.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { brand, modelName, year, password, language } = req.body;
    
    interface UpdateData {
      brand?: string;
      modelName?: string;
      year?: string;
      password?: string;
      language?: 'en' | 'ru';
    }
    
    const updateData: UpdateData = { brand, modelName, year, password };
    // 允许更新 language 字段
    if (language && ['en', 'ru'].includes(language)) {
      updateData.language = language as 'en' | 'ru';
    }
    
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    systemLogger.error({ error, id: req.params.id, body: req.body }, 'Failed to update vehicle');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update vehicle'
    });
  }
});

/**
 * Verify vehicle password
 * POST /api/vehicles/verify-password
 * 验证车型密码，返回访问令牌
 */
router.post('/verify-password', async (req: Request, res: Response) => {
  try {
    const { brand, model, yearRange, password } = req.body;
    
    // 参数验证
    if (!brand || !model || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: brand, model, password'
      });
    }
    
    // 查找车型
    const vehicle = await Vehicle.findOne({ 
      brand: brand.trim(), 
      modelName: model.trim() 
    });
    
    if (!vehicle) {
      systemLogger.warn({ brand, model }, 'Vehicle not found for password verification');
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    // 如果车型没有设置密码，直接通过
    if (!vehicle.password) {
      return res.json({
        success: true,
        data: {
          verified: true,
          requiresPassword: false
        }
      });
    }
    
    // 验证密码
    const isPasswordCorrect = vehicle.password === password.trim();
    
    if (!isPasswordCorrect) {
      systemLogger.warn({ brand, model }, 'Incorrect password attempt');
      return res.status(401).json({
        success: false,
        error: 'Incorrect password'
      });
    }
    
    // 密码正确，返回成功
    systemLogger.info({ brand, model }, 'Password verified successfully');
    
    res.json({
      success: true,
      data: {
        verified: true,
        requiresPassword: true,
        vehicleId: vehicle._id
      }
    });
  } catch (error) {
    systemLogger.error({ error, body: req.body }, 'Failed to verify vehicle password');
    res.status(500).json({
      success: false,
      error: 'Failed to verify password'
    });
  }
});

/**
 * Delete vehicle - 需要认证
 * DELETE /api/vehicles/:id
 */
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.vehicles.delete), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    systemLogger.error({ error, id: req.params.id }, 'Failed to delete vehicle');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete vehicle'
    });
  }
});

export default router;

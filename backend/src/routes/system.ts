import express, { Request, Response } from 'express';
import { 
  getSystemSettings, 
  updateSystemSettings 
} from '../services/systemSettingsService';
import { createLogger } from '../utils/logger';
import { requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';

const logger = createLogger('system-route');

const router = express.Router();

// 获取系统设置
router.get('/settings', requirePermission(PERMISSIONS.system.read), async (req: Request, res: Response) => {
  try {
    const settings = await getSystemSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error({ error }, '获取系统设置失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取设置失败' 
    });
  }
});

// 创建/更新系统设置
router.post('/settings', requirePermission(PERMISSIONS.system.update), async (req: Request, res: Response) => {
  try {
    const settings = await updateSystemSettings(req.body);
    res.json({ success: true, data: settings, message: '设置已保存' });
  } catch (error) {
    logger.error({ error }, '保存系统设置失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '保存设置失败' 
    });
  }
});

// 更新系统设置
router.put('/settings', requirePermission(PERMISSIONS.system.update), async (req: Request, res: Response) => {
  try {
    const settings = await updateSystemSettings(req.body);
    res.json({ success: true, data: settings, message: '设置已更新' });
  } catch (error) {
    logger.error({ error }, '更新系统设置失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '更新设置失败' 
    });
  }
});

// 获取监控数据
router.get('/monitor', requirePermission(PERMISSIONS.system.read), async (req: Request, res: Response) => {
  try {
    const os = require('os');
    const fs = require('fs').promises;
    const path = require('path');
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // 获取CPU信息
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCores = cpus.length;
    
    // 更准确的CPU使用率计算
    let cpuUsage = 0;
    try {
      if (os.platform() === 'linux') {
        // Read /proc/stat directly instead of shell piping
        const statContent = await fs.readFile('/proc/stat', 'utf8');
        const cpuLine = statContent.split('\n').find((line: string) => line.startsWith('cpu '));
        if (cpuLine) {
          const parts = cpuLine.trim().split(/\s+/).slice(1).map(Number);
          const [user, nice, system, idle] = parts;
          const total = user + nice + system + idle;
          cpuUsage = total > 0 ? ((user + system) * 100) / total : 0;
        }
      } else {
        // 其他平台使用负载平均值作为近似值，但限制最大值
        const loadAvg = os.loadavg();
        cpuUsage = Math.min(80, (loadAvg[0] / cpuCores) * 50);
      }
    } catch (error) {
      // 如果获取失败，使用负载平均值的保守估算
      const loadAvg = os.loadavg();
      cpuUsage = Math.min(50, (loadAvg[0] / cpuCores) * 30);
    }
    
    // 获取磁盘使用情况
    let diskStats = {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0
    };
    
    try {
      if (os.platform() === 'linux') {
        // Use execFile with explicit args instead of exec with shell
        const { stdout } = await execFileAsync('df', ['-h', '/']);
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.trim().split(/\s+/);
        if (parts.length >= 6) {
          const totalStr = parts[1];
          const usedStr = parts[2];
          const freeStr = parts[3];
          const usagePercentStr = parts[4];
          
          // 转换为字节
          const parseSize = (sizeStr: string) => {
            const unit = sizeStr.slice(-1).toLowerCase();
            const value = parseFloat(sizeStr.slice(0, -1));
            switch (unit) {
              case 'k': return value * 1024;
              case 'm': return value * 1024 * 1024;
              case 'g': return value * 1024 * 1024 * 1024;
              case 't': return value * 1024 * 1024 * 1024 * 1024;
              default: return value;
            }
          };
          
          diskStats = {
            total: parseSize(totalStr),
            used: parseSize(usedStr),
            free: parseSize(freeStr),
            usagePercent: parseFloat(usagePercentStr.replace('%', ''))
          };
        }
      }
    } catch (diskError) {
      logger.warn({ error: diskError }, '获取磁盘信息失败');
    }
    
    // 获取数据库信息
    let databaseStats: {
      version: string;
      type: string;
      status: 'online' | 'offline';
      connections: number;
      size: string;
    } = {
      version: 'Unknown',
      type: 'MongoDB',
      status: 'offline',
      connections: 0,
      size: 'Unknown'
    };
    
    try {
      // 动态导入 mongoose 以获取数据库信息
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        databaseStats.status = 'online';
        
        // 获取数据库版本
        const admin = mongoose.connection.db.admin();
        const buildInfo = await admin.buildInfo();
        databaseStats.version = buildInfo.version;
        
        // 获取数据库大小
        const stats = await mongoose.connection.db.stats();
        const sizeInMB = Math.round(stats.dataSize / (1024 * 1024) * 100) / 100;
        databaseStats.size = `${sizeInMB} MB`;
        
        // 获取活跃连接数（近似值）
        const serverStatus = await admin.serverStatus();
        databaseStats.connections = serverStatus.connections?.current || 0;
      }
    } catch (dbError) {
      logger.warn({ error: dbError }, '获取数据库信息失败');
    }
    
    const stats = {
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        cores: cpuCores,
        model: cpuModel
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: Math.round((usedMemory / totalMemory) * 100 * 100) / 100
      },
      disk: diskStats,
      database: databaseStats,
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: os.platform()
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    logger.error({ error }, '获取监控数据失败');
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取监控数据失败' 
    });
  }
});

// 获取仪表板统计
router.get('/dashboard-stats', requirePermission(PERMISSIONS.pages.dashboard), async (req: Request, res: Response) => {
  try {
    // 动态导入模型以避免循环依赖
    const { Vehicle } = await import('../models/Vehicle');
    const BaseDocument = (await import('../models/Document')).default;
    const { Feedback } = await import('../models/Feedback');
    
    // 并行获取统计数据
    const [
      totalVehicles,
      totalDocuments,
      totalFeedback,
      unreadFeedback,
      recentVehicles,
      popularDocuments,
      documentsByType
    ] = await Promise.all([
      Vehicle.countDocuments(),
      BaseDocument.countDocuments(),
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'pending' }),
      Vehicle.find().sort({ _id: -1 }).limit(5).select('brand modelName year'),
      BaseDocument.find().sort({ views: -1 }).limit(5),
      BaseDocument.aggregate([
        {
          $group: {
            _id: '$documentType',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            type: '$_id',
            count: 1,
            _id: 0
          }
        }
      ])
    ]);

    const stats = {
      totalVehicles,
      totalDocuments,
      totalForms: totalFeedback,
      unreadForms: unreadFeedback,
      recentVehicles: recentVehicles.map((v: any) => ({
        brand: v.brand,
        model: v.modelName,
        year: v.year,
        createdAt: new Date()
      })),
      popularDocuments: popularDocuments.map((d: any) => ({
        title: d.title || 'Untitled',
        views: d.views || 0,
        type: d.documentType
      })),
      documentsByType: documentsByType.map(d => ({
        type: d.type || 'unknown',
        count: d.count
      }))
    };

    res.json({ success: true, stats });
  } catch (error) {
    logger.error({ error }, '获取仪表板统计失败');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取统计数据失败'
    });
  }
});

export default router;

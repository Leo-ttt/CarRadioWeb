import express from 'express';
import { softwareService } from '../services/softwareService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('software-route');

const router = express.Router();

// 获取所有软件分类（按资料体系）
router.get('/categories', async (req, res) => {
  try {
    const language = req.query.language as 'en' | 'ru' | undefined;
    const categories = await softwareService.getAllCategories(language);
    res.json({ success: true, data: { items: categories, total: categories.length } });
  } catch (error) {
    logger.error({ error }, '获取软件分类失败');
    res.status(500).json({ success: false, error: '获取软件分类失败' });
  }
});

// 创建软件分类（需要指定资料体系）- 需要认证
router.post('/categories', authenticateUser, requirePermission(PERMISSIONS.software.create), async (req, res) => {
  try {
    const { name, order, language } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: '分类名称不能为空' });
    }
    if (!language || !['en', 'ru'].includes(language)) {
      return res.status(400).json({ success: false, error: '缺少有效的 language 字段（en 或 ru）' });
    }
    
    const category = await softwareService.createCategory({ name, order, language });
    res.json({ success: true, category });
  } catch (error) {
    logger.error({ error }, '创建软件分类失败');
    res.status(500).json({ success: false, error: '创建软件分类失败' });
  }
});

// 更新软件分类 - 需要认证
router.put('/categories/:id', authenticateUser, requirePermission(PERMISSIONS.software.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, language } = req.body;
    
    const category = await softwareService.updateCategory(id, { name, order, language });
    if (!category) {
      return res.status(404).json({ success: false, error: '软件分类不存在' });
    }
    
    res.json({ success: true, category });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '更新软件分类失败');
    res.status(500).json({ success: false, error: '更新软件分类失败' });
  }
});

// 删除软件分类 - 需要认证
router.delete('/categories/:id', authenticateUser, requirePermission(PERMISSIONS.software.delete), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await softwareService.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: '软件分类不存在' });
    }
    
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error({ error, id: req.params.id }, '删除软件分类失败');
    const err = error as Error;
    if (err.message === 'Cannot delete category with existing software') {
      return res.status(400).json({ success: false, error: '无法删除包含软件的分类' });
    }
    res.status(500).json({ success: false, error: '删除软件分类失败' });
  }
});

// 获取所有软件（按资料体系）
router.get('/', async (req, res) => {
  try {
    const { categoryId, language } = req.query;
    let software;
    
    if (categoryId) {
      software = await softwareService.getSoftwareByCategory(
        categoryId as string, 
        language as 'en' | 'ru' | undefined
      );
    } else {
      software = await softwareService.getAllSoftware(language as 'en' | 'ru' | undefined);
    }
    
    res.json({ success: true, data: { items: software, total: software.length } });
  } catch (error) {
    logger.error({ error }, '获取软件列表失败');
    res.status(500).json({ success: false, error: '获取软件列表失败' });
  }
});

// 获取单个软件
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const software = await softwareService.getSoftwareById(id);
    
    if (!software) {
      return res.status(404).json({ success: false, error: '软件不存在' });
    }
    
    res.json({ success: true, software });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '获取软件详情失败');
    res.status(500).json({ success: false, error: '获取软件详情失败' });
  }
});

// 创建软件（需要指定资料体系）- 需要认证
router.post('/', authenticateUser, requirePermission(PERMISSIONS.software.create), async (req, res) => {
  try {
    const { name, categoryId, description, downloadUrl, importantNote, language } = req.body;
    
    // 只验证最基本的必填字段
    if (!name || !language) {
      return res.status(400).json({ success: false, error: '软件名称和语言是必填项' });
    }
    if (!['en', 'ru'].includes(language)) {
      return res.status(400).json({ success: false, error: 'language 必须是 en 或 ru' });
    }
    
    const software = await softwareService.createSoftware({
      name,
      categoryId,
      description,
      downloadUrl,
      importantNote,
      language
    });
    
    res.json({ success: true, software });
  } catch (error) {
    logger.error({ error }, '创建软件失败');
    res.status(500).json({ success: false, error: '创建软件失败' });
  }
});

// 更新软件 - 需要认证
router.put('/:id', authenticateUser, requirePermission(PERMISSIONS.software.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description, downloadUrl, importantNote, language } = req.body;
    
    const software = await softwareService.updateSoftware(id, {
      name,
      categoryId,
      description,
      downloadUrl,
      importantNote,
      language
    });
    
    if (!software) {
      return res.status(404).json({ success: false, error: '软件不存在' });
    }
    
    res.json({ success: true, software });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '更新软件失败');
    res.status(500).json({ success: false, error: '更新软件失败' });
  }
});

// 删除软件 - 需要认证
router.delete('/:id', authenticateUser, requirePermission(PERMISSIONS.software.delete), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await softwareService.deleteSoftware(id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: '软件不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error({ error, id: req.params.id }, '删除软件失败');
    res.status(500).json({ success: false, error: '删除软件失败' });
  }
});

export default router;

/**
 * 用户手册路由 - 管理产品说明书 PDF
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/permissions';
import logger from '../utils/logger';

const router = express.Router();

// PDF 存储目录（相对于项目根目录）
const PDF_DIR = path.join(__dirname, '../../../public/PDF');
const ALLOWED_EXTENSIONS = ['.pdf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 确保目录存在
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Multer 配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PDF_DIR);
  },
  filename: (_req, file, cb) => {
    // 保留原始文件名，但确保安全
    const safeName = file.originalname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._()-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 PDF 文件'));
    }
  }
});

/**
 * GET /api/user-manual
 * 获取所有用户手册列表
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(PDF_DIR);
    const manuals = files
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => {
        const filePath = path.join(PDF_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
          // Use API endpoint for inline viewing
          url: `/api/user-manual/view/${encodeURIComponent(file)}`,
          // Use API endpoint for download
          downloadUrl: `/api/user-manual/download/${encodeURIComponent(file)}`
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    res.json({
      success: true,
      manuals
    });
  } catch (error) {
    logger.error({ error }, '获取用户手册列表失败');
    res.status(500).json({
      success: false,
      message: '获取用户手册列表失败'
    });
  }
});

/**
 * GET /api/user-manual/view/:filename
 * 在线预览 PDF（Content-Disposition: inline）
 */
router.get('/view/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(PDF_DIR, decodeURIComponent(filename));

    // Security check
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(PDF_DIR);
    if (!resolvedPath.startsWith(resolvedDir)) {
      return res.status(403).json({ success: false, message: '无效的文件路径' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    const stats = fs.statSync(filePath);
    
    // Remove headers that may interfere with PDF display
    res.removeHeader('X-Download-Options');
    res.removeHeader('X-Content-Type-Options');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    logger.error({ error }, 'PDF 预览失败');
    res.status(500).json({ success: false, message: '预览失败' });
  }
});

/**
 * GET /api/user-manual/download/:filename
 * 下载 PDF（Content-Disposition: attachment）
 */
router.get('/download/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(PDF_DIR, decodeURIComponent(filename));

    // Security check
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(PDF_DIR);
    if (!resolvedPath.startsWith(resolvedDir)) {
      return res.status(403).json({ success: false, message: '无效的文件路径' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    const stats = fs.statSync(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    logger.error({ error }, 'PDF 下载失败');
    res.status(500).json({ success: false, message: '下载失败' });
  }
});

/**
 * POST /api/user-manual/upload
 * 上传用户手册 PDF（需要管理员权限）
 */
router.post('/upload', authenticateUser, requirePermission(PERMISSIONS.resources.update), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的 PDF 文件'
      });
    }

    const file = req.file;
    logger.info({ filename: file.filename, size: file.size }, '用户手册上传成功');

    res.json({
      success: true,
      message: '上传成功',
      manual: {
        name: file.filename,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        url: `/PDF/${encodeURIComponent(file.filename)}`
      }
    });
  } catch (error) {
    logger.error({ error }, '上传用户手册失败');
    res.status(500).json({
      success: false,
      message: '上传失败'
    });
  }
});

/**
 * DELETE /api/user-manual/:filename
 * 删除用户手册 PDF（需要管理员权限）
 */
router.delete('/:filename', authenticateUser, requirePermission(PERMISSIONS.resources.delete), async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(PDF_DIR, filename);

    // 安全检查：确保文件在 PDF 目录内
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(PDF_DIR);
    if (!resolvedPath.startsWith(resolvedDir)) {
      return res.status(403).json({
        success: false,
        message: '无效的文件路径'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    fs.unlinkSync(filePath);
    logger.info({ filename }, '用户手册删除成功');

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    logger.error({ error }, '删除用户手册失败');
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;

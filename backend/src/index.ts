import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { validateConfig } from './config/oss';
import uploadRouter from './routes/upload';
import aiRouter from './routes/ai';
import documentsRouter from './routes/documents';
import imagesRouter from './routes/images';
import softwareRouter from './routes/software';
import contactRouter from './routes/contact';
import adminRouter from './routes/admin';
import audioRouter from './routes/audio';
import feedbackRouter from './routes/feedback';
import documentFeedbackRouter from './routes/documentFeedback';
import draftsRouter from './routes/drafts';
import audioPresetsRouter from './routes/audioPresets';
import systemRouter from './routes/system';
import siteSettingsRouter from './routes/siteSettings';
// 标签路由已被分类路由替代
import categoryRouter from './routes/categoryRoutes';
// 导入Category模型以确保其被注册
import './models/Category';
// 导入SystemConfig模型以确保其被注册
import './models/SystemConfig';
import announcementRouter from './routes/announcement';
import canbusSettingsRouter from './routes/canbusSettings';
import vehiclesRouter from './routes/vehicles';
import systemConfigRouter from './routes/systemConfig';
import resourceLinksRouter from './routes/resourceLinks';
import siteImagesRouter from './routes/siteImages';
import languageRouter from './routes/language';
// 新增：产品和Hero Banner路由
import productsRouter from './routes/products';
import heroBannersRouter from './routes/heroBanners';
import seoSettingsRouter from './routes/seoSettings';
import faqRouter from './routes/faq';
import searchRouter from './routes/search';
import userManualRouter from './routes/userManual';
import pageContentRouter from './routes/pageContent';
import systemConfigService from './services/systemConfigService';
import cleanupJob from './jobs/cleanupJob';
import { globalErrorHandler, handleNotFound, createRateLimit } from './middleware/errorHandler';
import { publicApiLimiter, healthCheckLimiter } from './middleware/rateLimit';
import healthRouter from './routes/health';
import swaggerRouter from './routes/swagger';
import sitemapRouter from './routes/sitemap';
// 访客统计相关
import visitorsRouter from './routes/visitors';
import { recordPageVisit } from './middleware/visitorTracking';
// Ensure models are registered before MongoDB connects
import User from './models/User';
import './models/AuditLog';
import './models/LegalVersion';
import './models/LegalPageContent';
import './models/NewsletterSubscriber';
import './models/NewsletterCampaign';
import { seedDevAdmin } from './seed/devAdmin';
const _userModelRef = User;

// User management + audit log routes
import authRouter from './routes/oauth';
import usersRouter from './routes/users';
import auditLogsRouter from './routes/auditLogs';
import { auditLogMiddleware } from './middleware/auditLog';
import legalVersionsRouter from './routes/legalVersions';
import newsletterRouter from './routes/newsletter';

// 新增：集成优化工具
import { apiLogger, dbLogger, systemLogger } from './utils/logger';
import { securityMiddleware, customSecurityHeaders } from './middleware/security';
import { securityFilters } from './middleware/sanitization';
import cookieParser from 'cookie-parser'
import { csrfMiddleware } from './middleware/csrf';
import { initRedis } from './utils/redisCache';
import { initSentry, sentryErrorHandler, requestTracing } from './utils/sentry';
import compression from 'compression';

// 加载环境变量 - 使用绝对路径确保PM2能正确加载
dotenv.config({ path: path.join(__dirname, '../config.env') });

// ==================== 安全配置验证 ====================

/**
 * JWT_SECRET 安全检查
 * - 生产环境必须配置
 * - 拒绝使用示例密钥
 * - 最小长度 32 字符
 */
const INSECURE_SECRETS = [
  'change-this-to-your-secure-jwt-key-in-production',
  'your-secret-key',
  'secret',
  'jwt-secret',
  'changeme',
  'password',
];

function validateJwtSecret(): void {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      systemLogger.error('JWT_SECRET is required in production. Server cannot start.');
      process.exit(1);
    }
    systemLogger.warn('JWT_SECRET not set. Using random secret for development (sessions will not persist).');
    return;
  }

  if (secret.length < 32) {
    systemLogger.error(`JWT_SECRET is too short (${secret.length} chars). Minimum 32 characters required.`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const lowerSecret = secret.toLowerCase();
  for (const insecure of INSECURE_SECRETS) {
    if (lowerSecret.includes(insecure.toLowerCase())) {
      systemLogger.error(`JWT_SECRET contains insecure pattern: "${insecure}". Please use a strong, unique secret.`);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  systemLogger.info('JWT_SECRET validated successfully');
}

validateJwtSecret();

// 可选：启用 HTTP 代理（国内开发环境访问 Google OAuth 等外部服务）
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (httpsProxy) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { HttpsProxyAgent } = require('https-proxy-agent');
  const https = require('https');
  const http = require('http');
  const agent = new HttpsProxyAgent(httpsProxy);
  https.globalAgent = agent;
  http.globalAgent = agent;
  systemLogger.info({ proxy: httpsProxy }, 'HTTP proxy enabled for outbound requests');
} else {
  systemLogger.info('No HTTP proxy configured (HTTPS_PROXY not set)');
}

const app = express();

// Cloudflare CDN 反向代理：必须启用 trust proxy，否则 Express 无法正确识别 HTTPS，
// 导致 secure cookie 不会被设置
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/official-website';

// 就绪状态标记（用于 /health/ready 探针）
let isSystemReady = false;
export function setSystemReady() { isSystemReady = true; }
export function isSystemReadyCheck() { return isSystemReady; }

// ==================== 初始化优化服务 ====================

// 1. 初始化 Sentry 错误监控（必须在其他中间件之前）
initSentry(app);

// 2. 初始化 Redis 缓存（如果配置了 REDIS_URL）
initRedis();

// 3. 安全中间件（Helmet）
app.use(securityMiddleware);
app.use(customSecurityHeaders);

// 3.1 安全过滤中间件延后注册，待 body parser 就绪后再应用（见下方 express.json 之后）

// 4. Cookie parser（用于 httpOnly JWT cookie）
app.use(cookieParser());

// 5. Gzip/Brotli 压缩（提升传输效率）
app.use(compression());

// 6. Sentry 请求追踪
app.use(requestTracing());

// 7. CSRF 保护（双提交 Cookie 模式）
app.use(csrfMiddleware);

// ==================== 数据库连接 ====================

// 连接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    dbLogger.info('MongoDB connected');

    // 初始化系统配置
    try {
      await systemConfigService.initializeConfigs();
      systemLogger.info('System config initialized');
    } catch (error) {
      systemLogger.error({ error }, 'System config initialization failed');
    }

    // 开发环境：创建默认管理员
    await seedDevAdmin();

    isSystemReady = true;
  })
  .catch((error: unknown) => {
    dbLogger.error({ error }, 'MongoDB connection failed');
    systemLogger.warn('Server will continue running, but database features will be unavailable');
    // 开发环境不退出，允许前端测试
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// 中间件 - 为OSS上传路由设置更大的限制
app.use('/api/oss-files/upload', express.json({ limit: '500mb' }));
app.use('/api/oss-files/upload', express.urlencoded({ extended: true, limit: '500mb' }));

// 为图片上传路由设置更大的限制
app.use('/api/upload', express.json({ limit: '50mb' }));
app.use('/api/upload', express.urlencoded({ extended: true, limit: '50mb' }));

// 其他路由使用较小的限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ P0-03: 安全过滤中间件必须在 body parser 之后，否则 req.body 为 undefined，过滤无效
app.use(securityFilters);

// 会话中间件
import session from 'express-session';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境必须配置 SESSION_SECRET，否则拒绝启动
    systemLogger.error('SESSION_SECRET environment variable is required in production. Server cannot start without it.');
    process.exit(1);
  } else {
    // 开发环境使用随机 secret，但记录警告
    systemLogger.warn('SESSION_SECRET not set, using random secret (sessions will not persist across restarts)');
  }
}

app.use(session({
  secret: SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    // Cloudflare CDN 代理下必须用 lax，strict 会导致 cookie 不随请求发送
    sameSite: 'lax'
  }
}));

// Audit log middleware — records write operations for authenticated users
app.use(auditLogMiddleware);

// 基础请求日志（使用 Pino 结构化日志）
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    apiLogger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, `${req.method} ${req.originalUrl}`);
  });

  next();
});

// CORS配置
// CORS配置：支持逗号分隔的多个来源，严格验证
app.use(cors({
  origin: (origin, callback) => {
    const env = process.env.CORS_ORIGIN || '';
    const allowList = env.split(',').map(s => s.trim()).filter(Boolean);

    // 生产环境：必须有 CORS_ORIGIN 配置
    if (process.env.NODE_ENV === 'production' && allowList.length === 0) {
      systemLogger.error('CORS_ORIGIN is not configured in production. All CORS requests will be rejected.');
      return callback(new Error('CORS not configured'), false);
    }

    // 无 Origin 的情况：
    // - 同源请求（浏览器不发送 Origin）
    // - 非浏览器客户端（curl, Postman, 移动应用）
    // - 服务器到服务器通信
    if (!origin) {
      // 生产环境：只允许有 User-Agent 的非浏览器客户端
      // 浏览器同源请求通常会有 Referer 或其他特征
      const userAgent = process.env.NODE_ENV === 'production'
        ? true // 生产环境允许无 Origin 请求（支持 API 客户端）
        : true; // 开发环境也允许
      return callback(null, userAgent);
    }

    // 验证 Origin 格式（防止注入攻击）
    try {
      const originUrl = new URL(origin);
      // 只允许 http 和 https 协议
      if (!['http:', 'https:'].includes(originUrl.protocol)) {
        systemLogger.warn({ origin }, 'CORS rejected: invalid protocol');
        return callback(null, false);
      }
    } catch {
      systemLogger.warn({ origin }, 'CORS rejected: invalid URL format');
      return callback(null, false);
    }

    // 检查白名单
    const allowed = allowList.includes(origin);
    if (allowed) {
      return callback(null, true);
    }

    // 开发环境：允许 localhost 任意端口
    if (process.env.NODE_ENV !== 'production') {
      const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
      const ipv4Pattern = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;
      if (localhostPattern.test(origin) || ipv4Pattern.test(origin)) {
        return callback(null, true);
      }
    }

    systemLogger.warn({ origin, allowList }, 'CORS rejected: origin not in allowlist');
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 预检请求缓存 24 小时
}));

// 验证OSS配置（可选，不阻止服务器启动）
try {
  validateConfig();
} catch (error: unknown) {
  systemLogger.warn({ error: error instanceof Error ? error.message : String(error) }, 'OSS环境变量配置未找到，将使用数据库中的系统配置');
}

// 健康检查路由 - 移到最前面（不需要认证）
app.use(healthRouter);

// Swagger API 文档 (P1-08)
app.use('/api-docs', swaggerRouter);

// ==================== 全局限流中间件 (P0-02) ====================
// 在限流之前确保 trust proxy 设置正确
app.set('trust proxy', 1);

// 公开 API 全局限流
app.use('/api', publicApiLimiter);

// 本地存储上传文件静态访问（与 StorageSettings.providers.local.uploadPath 默认 ./uploads 对应）
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Sitemap — public, no auth required
app.use(sitemapRouter);

// 根路径 - 移到API路由之前
app.get('/', (req, res) => {
  res.json({
    message: 'Knowledge Base Backend API',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      upload: '/api/upload',
      ai: '/api/ai',
      documents: '/api/documents'
    }
  });
});

// ==================== 认证中间件导入 ====================
import { authenticateUser } from './middleware/auth';

// ==================== 公开路由（无需认证） ====================
// Authentication routes (email verification + password login)
app.use('/api/auth', authRouter);
// 前端展示数据（只读）
app.use('/api/documents', documentsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/software', softwareRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/announcement', announcementRouter);
app.use('/api/language', languageRouter);
app.use('/api/products', productsRouter);
app.use('/api/hero-banners', heroBannersRouter);
app.use('/api/seo', seoSettingsRouter);
app.use('/api/faq', faqRouter);
app.use('/api/search', searchRouter);
app.use('/api/user-manual', userManualRouter);
app.use('/api/page-content', pageContentRouter);
app.use('/api/resource-links', resourceLinksRouter);
app.use('/api/site-settings', siteSettingsRouter);
app.use('/api/legal-versions', legalVersionsRouter);
app.use('/api/newsletter', newsletterRouter);
// CANBus 设置（路由内部自行控制认证，公开 GET + 管理端点需认证）
app.use('/api/canbus-settings', canbusSettingsRouter);
// 网站图片配置（GET 公开，PUT/POST 路由内部自行认证）
app.use('/api', siteImagesRouter);
// 前端公开提交（反馈表单、文档反馈、联系表单）
app.use('/api/feedback', feedbackRouter);
app.use('/api/document-feedback', documentFeedbackRouter);
app.use('/api/contact', contactRouter);
// 访客记录（前端埋点，公开，限流防滥用）
const trackVisitRateLimit = createRateLimit(60 * 1000, 30, 'Too many requests');
app.post('/api/track-visit', trackVisitRateLimit, recordPageVisit);

// 访客统计路由（路由内部自行控制认证，/realtime 公开，其余需认证）
app.use('/api/visitors', visitorsRouter);

// AI 路由（内部自行控制认证，公开端点 chat/select/search + 管理端点需认证）
app.use('/api/ai', aiRouter);

// ==================== 受保护路由（需要认证） ====================
app.use('/api/users', authenticateUser, usersRouter);
app.use('/api/audit-logs', authenticateUser, auditLogsRouter);
app.use('/api/upload', authenticateUser, uploadRouter);
app.use('/api/admin', authenticateUser, adminRouter);
app.use('/api/audio', authenticateUser, audioRouter);
app.use('/api/drafts', authenticateUser, draftsRouter);
app.use('/api/audio-presets', authenticateUser, audioPresetsRouter);
app.use('/api/system', authenticateUser, systemRouter);
app.use('/api/system-config', authenticateUser, systemConfigRouter);

// ==================== V1 API 路由（内部自行控制认证） ====================
// P1-07: 添加 /api/v1 版本控制路由
import apiRoutes from './routes/index';
app.use('/api/v1', apiRoutes);

// 保留 /api/* 向后兼容（标记为 deprecated，建议使用 /api/v1/*）
// 注意：/api/* 路由已经在上面单独挂载，无需再次挂载 apiRoutes

// 404处理 - 必须在所有路由之后，错误处理之前
app.use(handleNotFound);

// Sentry 错误处理中间件（在全局错误处理之前）
app.use(sentryErrorHandler());

// 全局错误处理中间件 - 必须在最后
app.use(globalErrorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  systemLogger.info({
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    ossBucket: process.env.OSS_BUCKET,
    corsOrigin: process.env.CORS_ORIGIN || '(not set)',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  }, 'Server started successfully');

  // 设置服务器超时时间为2小时（用于大文件上传）
  server.timeout = 7200000; // 2小时
  server.keepAliveTimeout = 7200000;
  server.headersTimeout = 7200000;

  // 启动清理任务
  try {
    cleanupJob.startAllJobs();
    systemLogger.info('Cleanup jobs started');
  } catch (error) {
    systemLogger.error({ error }, 'Failed to start cleanup jobs');
  }
});

// 优雅关闭
process.on('SIGINT', async () => {
  systemLogger.info('Received SIGINT signal, shutting down gracefully...');

  try {
    // 关闭数据库连接
    await mongoose.connection.close();
    systemLogger.info('Database connection closed');

    systemLogger.info('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    systemLogger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  systemLogger.info('Received SIGTERM signal, shutting down gracefully...');

  try {
    await mongoose.connection.close();
    systemLogger.info('Database connection closed');
    systemLogger.info('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    systemLogger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
});
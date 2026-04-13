import OSS from 'ali-oss';
import dotenv from 'dotenv';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('oss-config');

// 加载环境变量 - 使用绝对路径确保PM2能正确加载
dotenv.config({ path: path.join(__dirname, '../../config.env') });

// OSS配置
export const ossConfig = {
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
  region: process.env.OSS_REGION!,
  endpoint: process.env.OSS_ENDPOINT!,
};

// 创建OSS客户端（延迟初始化）
let _ossClient: any | null = null;

export const getOSSClient = (): any => {
  if (!_ossClient) {
    // 验证配置
    if (!ossConfig.accessKeyId || !ossConfig.accessKeySecret) {
      throw new Error('OSS credentials not configured. Please set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET in environment variables.');
    }
    
    _ossClient = new OSS({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      region: ossConfig.region,
      endpoint: ossConfig.endpoint,
      // 增加超时时间，适应大文件上传
      timeout: 3600000, // 1小时超时
      // 使用HTTPS以获得更好的性能
      secure: true
    });
  }
  return _ossClient;
};

// 兼容性：保持原有的导出名称，但改为函数调用
export const ossClient = getOSSClient;

// 获取路径前缀（从环境变量或使用默认值）
// 支持空字符串（直接存储到桶根目录）
const getPathPrefix = (): string => {
  const prefix = process.env.OSS_PATH_PREFIX;

  // 如果未配置，使用默认值
  if (prefix === undefined) {
    return 'knowledge-base/';
  }

  // 如果配置为空字符串，返回空（不添加前缀）
  if (prefix === '') {
    return '';
  }

  // 确保前缀以 / 结尾
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
};

// 文件夹路径配置
// 动态生成路径，支持配置前缀
export const uploadPaths = {
  homepage: `${getPathPrefix()}images/homepage/`,
  vehicles: `${getPathPrefix()}images/vehicles/`,
  documents: `${getPathPrefix()}images/documents/`,
  uploads: `${getPathPrefix()}images/uploads/`,
  temp: `${getPathPrefix()}temp/`,
};

// 验证配置
export const validateConfig = () => {
  const requiredFields = [
    'OSS_ACCESS_KEY_ID',
    'OSS_ACCESS_KEY_SECRET', 
    'OSS_BUCKET',
    'OSS_REGION',
    'OSS_ENDPOINT'
  ];

  for (const field of requiredFields) {
    if (!process.env[field]) {
      throw new Error(`Missing required environment variable: ${field}`);
    }
  }

  logger.info({ bucket: ossConfig.bucket, region: ossConfig.region }, 'OSS配置验证通过');
};

/**
 * API验证中间件
 * 遵循Clean Code原则：统一验证逻辑，避免重复代码
 */

import { Request, Response, NextFunction } from 'express';
import { CONTENT_TYPES, CONTENT_STATUS, isValidContentType, isValidContentStatus } from '../models/ContentTypes';
import { STORAGE_PROVIDERS } from '../models/StorageSettings';

/**
 * 验证错误接口
 */
interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * 验证结果接口
 */
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 基础验证函数
 */
class Validator {
  private errors: ValidationError[] = [];
  
  /**
   * 验证字符串
   */
  validateString(value: any, field: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}): this {
    if (options.required && (value === undefined || value === null || value === '')) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value !== 'string') {
        this.errors.push({ field, message: `${field}必须是字符串`, value });
        return this;
      }
      
      if (options.minLength && value.length < options.minLength) {
        this.errors.push({ field, message: `${field}长度不能少于${options.minLength}个字符`, value });
      }
      
      if (options.maxLength && value.length > options.maxLength) {
        this.errors.push({ field, message: `${field}长度不能超过${options.maxLength}个字符`, value });
      }
      
      if (options.pattern && !options.pattern.test(value)) {
        this.errors.push({ field, message: `${field}格式无效`, value });
      }
    }
    
    return this;
  }
  
  /**
   * 验证数字
   */
  validateNumber(value: any, field: string, options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}): this {
    if (options.required && (value === undefined || value === null)) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null) {
      const num = Number(value);
      if (isNaN(num)) {
        this.errors.push({ field, message: `${field}必须是数字`, value });
        return this;
      }
      
      if (options.integer && !Number.isInteger(num)) {
        this.errors.push({ field, message: `${field}必须是整数`, value });
      }
      
      if (options.min !== undefined && num < options.min) {
        this.errors.push({ field, message: `${field}不能小于${options.min}`, value });
      }
      
      if (options.max !== undefined && num > options.max) {
        this.errors.push({ field, message: `${field}不能大于${options.max}`, value });
      }
    }
    
    return this;
  }
  
  /**
   * 验证布尔值
   */
  validateBoolean(value: any, field: string, options: {
    required?: boolean;
  } = {}): this {
    if (options.required && (value === undefined || value === null)) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null && typeof value !== 'boolean') {
      this.errors.push({ field, message: `${field}必须是布尔值`, value });
    }
    
    return this;
  }
  
  /**
   * 验证数组
   */
  validateArray(value: any, field: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}): this {
    if (options.required && (value === undefined || value === null)) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        this.errors.push({ field, message: `${field}必须是数组`, value });
        return this;
      }
      
      if (options.minLength && value.length < options.minLength) {
        this.errors.push({ field, message: `${field}至少需要${options.minLength}个元素`, value });
      }
      
      if (options.maxLength && value.length > options.maxLength) {
        this.errors.push({ field, message: `${field}最多只能有${options.maxLength}个元素`, value });
      }
    }
    
    return this;
  }
  
  /**
   * 验证URL
   */
  validateUrl(value: any, field: string, options: {
    required?: boolean;
  } = {}): this {
    if (options.required && (value === undefined || value === null || value === '')) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      try {
        new URL(value);
      } catch {
        this.errors.push({ field, message: `${field}URL格式无效`, value });
      }
    }
    
    return this;
  }
  
  /**
   * 验证日期
   */
  validateDate(value: any, field: string, options: {
    required?: boolean;
  } = {}): this {
    if (options.required && (value === undefined || value === null || value === '')) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        this.errors.push({ field, message: `${field}日期格式无效`, value });
      }
    }
    
    return this;
  }
  
  /**
   * 验证枚举值
   */
  validateEnum(value: any, field: string, allowedValues: string[], options: {
    required?: boolean;
  } = {}): this {
    if (options.required && (value === undefined || value === null || value === '')) {
      this.errors.push({ field, message: `${field}是必填字段` });
      return this;
    }
    
    if (value !== undefined && value !== null && value !== '' && !allowedValues.includes(value)) {
      this.errors.push({ 
        field, 
        message: `${field}必须是以下值之一: ${allowedValues.join(', ')}`, 
        value 
      });
    }
    
    return this;
  }
  
  /**
   * 获取验证结果
   */
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }
  
  /**
   * 重置验证器
   */
  reset(): this {
    this.errors = [];
    return this;
  }
}

/**
 * 创建验证器实例
 */
const createValidator = () => new Validator();

/**
 * 处理验证错误的中间件
 */
export const handleValidationErrors = (result: ValidationResult, res: Response, next: NextFunction) => {
  if (!result.isValid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: result.errors
      }
    });
    return;
  }

  next();
};

/**
 * 内容数据验证中间件
 */
export const validateContentData = (req: Request, res: Response, next: NextFunction) => {
  const validator = createValidator();
  const data = req.body;
  
  // 基础字段验证
  validator
    .validateString(data.title, 'title', { maxLength: 200 })
    .validateString(data.content, 'content')
    .validateString(data.summary, 'summary', { maxLength: 500 })
    .validateString(data.description, 'description', { maxLength: 1000 })
    .validateString(data.category, 'category', { maxLength: 100 })
    .validateString(data.author, 'author', { maxLength: 100 })
    .validateEnum(data.documentType, 'documentType', Object.values(CONTENT_TYPES))
    .validateEnum(data.status, 'status', Object.values(CONTENT_STATUS))
    .validateEnum(data.type, 'type', ['article', 'tutorial', 'guide'])
    .validateArray(data.images, 'images')
    .validateArray(data.sections, 'sections')
    .validateUrl(data.videoUrl, 'videoUrl')
    .validateArray(data.videos, 'videos')
    .validateEnum(data.platform, 'platform', ['youtube', 'bilibili', 'custom'])
    .validateUrl(data.thumbnail, 'thumbnail')
    .validateNumber(data.price, 'price', { min: 0 })
    .validateArray(data.features, 'features')
    .validateArray(data.tags, 'tags')
    .validateString(data.seoTitle, 'seoTitle', { maxLength: 100 })
    .validateString(data.seoDescription, 'seoDescription', { maxLength: 300 })
    .validateArray(data.seoKeywords, 'seoKeywords')
    .validateDate(data.publishedAt, 'publishedAt')
    .validateDate(data.scheduledAt, 'scheduledAt');
  
  // 复杂字段验证
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((image: any, index: number) => {
      validator
        .validateUrl(image.url, `images[${index}].url`)
        .validateString(image.alt, `images[${index}].alt`, { maxLength: 200 })
        .validateNumber(image.order, `images[${index}].order`, { min: 0, integer: true });
    });
  }
  
  if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach((section: any, index: number) => {
      validator
        .validateString(section.id, `sections[${index}].id`)
        .validateString(section.heading, `sections[${index}].heading`, { maxLength: 200 })
        .validateString(section.content, `sections[${index}].content`)
        .validateEnum(section.layout, `sections[${index}].layout`, ['imageLeft', 'imageRight']);
    });
  }
  
  if (data.videos && Array.isArray(data.videos)) {
    data.videos.forEach((video: any, index: number) => {
      validator
        .validateUrl(video.url, `videos[${index}].url`)
        .validateString(video.title, `videos[${index}].title`, { maxLength: 200 })
        .validateEnum(video.platform, `videos[${index}].platform`, ['youtube', 'bilibili', 'custom'])
        .validateNumber(video.order, `videos[${index}].order`, { min: 0, integer: true });
    });
  }
  
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach((tag: any, index: number) => {
      validator.validateString(tag, `tags[${index}]`, { minLength: 1, maxLength: 50 });
    });
  }
  
  if (data.seoKeywords && Array.isArray(data.seoKeywords)) {
    data.seoKeywords.forEach((keyword: any, index: number) => {
      validator.validateString(keyword, `seoKeywords[${index}]`, { minLength: 1, maxLength: 50 });
    });
  }
  
  const result = validator.getResult();
  handleValidationErrors(result, res, next);
};

/**
 * 内容过滤器验证中间件
 */
export const validateContentFilters = (req: Request, res: Response, next: NextFunction) => {
  const validator = createValidator();
  const query = req.query;
  
  validator
    .validateEnum(query.status as string, 'status', Object.values(CONTENT_STATUS))
    .validateString(query.category as string, 'category', { maxLength: 100 })
    .validateString(query.author as string, 'author', { maxLength: 100 })
    .validateString(query.search as string, 'search', { maxLength: 200 })
    .validateString(query.brand as string, 'brand', { maxLength: 100 })
    .validateString(query.model as string, 'model', { maxLength: 100 })
    .validateString(query.tags as string, 'tags')
    .validateDate(query.dateFrom as string, 'dateFrom')
    .validateDate(query.dateTo as string, 'dateTo')
    .validateNumber(query.priceMin as string, 'priceMin', { min: 0 })
    .validateNumber(query.priceMax as string, 'priceMax', { min: 0 });
  
  const result = validator.getResult();
  handleValidationErrors(result, res, next);
};

/**
 * 分页参数验证中间件
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const validator = createValidator();
  const query = req.query;
  
  validator
    .validateNumber(query.page as string, 'page', { min: 1, integer: true })
    .validateNumber(query.limit as string, 'limit', { min: 1, max: 100, integer: true })
    .validateEnum(query.sortBy as string, 'sortBy', ['createdAt', 'updatedAt', 'title', 'views', 'likes', 'price'])
    .validateEnum(query.sortOrder as string, 'sortOrder', ['asc', 'desc']);
  
  const result = validator.getResult();
  handleValidationErrors(result, res, next);
};

/**
 * 配置数据验证中间件
 */
export const validateConfigData = (req: Request, res: Response, next: NextFunction) => {
  const validator = createValidator();
  const data = req.body;
  
  // 基础配置验证
  if (data.currentProvider) {
    validator.validateEnum(data.currentProvider, 'currentProvider', Object.values(STORAGE_PROVIDERS));
  }
  
  // 模块配置验证
  if (data.knowledgeBase) {
    validator
      .validateBoolean(data.knowledgeBase.enabled, 'knowledgeBase.enabled')
      .validateNumber(data.knowledgeBase.displayOrder, 'knowledgeBase.displayOrder', { min: 0, integer: true })
      .validateArray(data.knowledgeBase.permissions, 'knowledgeBase.permissions');
  }
  
  // 存储配置验证
  if (data.providers) {
    if (data.providers.local) {
      validator
        .validateString(data.providers.local.uploadPath, 'providers.local.uploadPath')
        .validateNumber(data.providers.local.maxFileSize, 'providers.local.maxFileSize', { min: 1, integer: true })
        .validateString(data.providers.local.baseUrl, 'providers.local.baseUrl');
    }
    
    if (data.providers.oss) {
      validator
        .validateString(data.providers.oss.accessKeyId, 'providers.oss.accessKeyId')
        .validateString(data.providers.oss.accessKeySecret, 'providers.oss.accessKeySecret')
        .validateString(data.providers.oss.bucket, 'providers.oss.bucket')
        .validateString(data.providers.oss.region, 'providers.oss.region')
        .validateString(data.providers.oss.endpoint, 'providers.oss.endpoint')
        .validateBoolean(data.providers.oss.secure, 'providers.oss.secure');
    }
  }
  
  // 通用设置验证
  if (data.general) {
    validator
      .validateNumber(data.general.maxFileSize, 'general.maxFileSize', { min: 1, integer: true })
      .validateBoolean(data.general.enableImageCompression, 'general.enableImageCompression')
      .validateNumber(data.general.imageQuality, 'general.imageQuality', { min: 1, max: 100, integer: true });
  }
  
  // 安全设置验证
  if (data.security) {
    validator
      .validateBoolean(data.security.enableVirusScan, 'security.enableVirusScan')
      .validateNumber(data.security.maxUploadRate, 'security.maxUploadRate', { min: 1, integer: true })
      .validateBoolean(data.security.enableWatermark, 'security.enableWatermark')
      .validateEnum(data.security.watermarkPosition, 'security.watermarkPosition', 
        ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']);
  }
  
  // 全局设置验证
  if (data.global) {
    validator
      .validateBoolean(data.global.enableSearch, 'global.enableSearch')
      .validateBoolean(data.global.enableMultiLanguage, 'global.enableMultiLanguage')
      .validateString(data.global.defaultLanguage, 'global.defaultLanguage', { minLength: 2, maxLength: 5 })
      .validateNumber(data.global.autoSaveInterval, 'global.autoSaveInterval', { min: 10, integer: true });
  }
  
  // 缓存设置验证
  if (data.cache) {
    validator
      .validateBoolean(data.cache.enableContentCache, 'cache.enableContentCache')
      .validateNumber(data.cache.cacheExpiration, 'cache.cacheExpiration', { min: 60, integer: true })
      .validateBoolean(data.cache.enableCDN, 'cache.enableCDN')
      .validateUrl(data.cache.cdnUrl, 'cache.cdnUrl');
  }
  
  const result = validator.getResult();
  handleValidationErrors(result, res, next);
};

/**
 * ID参数验证中间件
 */
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || id.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'ID参数不能为空'
      }
    });
    return;
  }

  // 简单的ObjectId格式检查（24位十六进制字符串）
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID_FORMAT',
        message: 'ID格式无效'
      }
    });
    return;
  }

  next();
};

/**
 * 文件上传验证中间件
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  // 检查是否有文件
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_PROVIDED',
        message: '请选择要上传的文件'
      }
    });
    return;
  }

  // 检查文件大小（multer已经处理了基本检查，这里可以添加额外逻辑）
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  for (const file of files) {
    if (file && file.size > 50 * 1024 * 1024) { // 50MB
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `文件 ${file.originalname} 超过50MB大小限制`
        }
      });
      return;
    }
  }

  next();
};

/**
 * 批量操作验证中间件
 */
export const validateBatchOperation = (req: Request, res: Response, next: NextFunction) => {
  const validator = createValidator();
  const data = req.body;
  
  validator.validateArray(data.ids, 'ids', { required: true, minLength: 1, maxLength: 100 });
  
  if (data.ids && Array.isArray(data.ids)) {
    data.ids.forEach((id: any, index: number) => {
      if (typeof id === 'string' && !/^[0-9a-fA-F]{24}$/.test(id)) {
        validator.getResult().errors.push({
          field: `ids[${index}]`,
          message: 'ID格式无效',
          value: id
        });
      }
    });
  }
  
  const result = validator.getResult();
  handleValidationErrors(result, res, next);
};

/**
 * 文档验证中间件工厂函数
 * @param documentType - 文档类型
 */
export const validateDocument = (documentType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validator = createValidator();
    const data = req.body;
    
    // 基础字段验证 - 只验证标题必填，其他字段允许为空（草稿状态）
    validator
      .validateString(data.title, 'title', { required: true, maxLength: 200 })
      .validateString(data.content, 'content')
      .validateString(data.summary, 'summary', { maxLength: 500 })
      .validateString(data.description, 'description', { maxLength: 1000 })
      .validateString(data.category, 'category', { maxLength: 100 })
      .validateString(data.author, 'author', { maxLength: 100 });
    
    // documentType 和 tags 不强制验证，允许为空
    if (data.documentType) {
      validator.validateEnum(data.documentType, 'documentType', Object.values(CONTENT_TYPES));
    }
    
    // 根据文档类型进行特定验证
    switch (documentType) {
      case 'general':
        // 通用文档允许所有字段为空，后续编辑
        if (data.type) {
          validator.validateString(data.type, 'type', { maxLength: 50 });
        }
        break;
        
      case 'video':
        // 视频教程只在有videoUrl时验证格式，不强制必填
        if (data.videoUrl) {
          validator.validateUrl(data.videoUrl, 'videoUrl');
        }
        if (data.videoTitle) {
          validator.validateString(data.videoTitle, 'videoTitle', { maxLength: 200 });
        }
        if (data.platform) {
          validator.validateEnum(data.platform, 'platform', ['youtube', 'bilibili', 'custom']);
        }
        if (data.thumbnail) {
          validator.validateUrl(data.thumbnail, 'thumbnail');
        }
        break;
        
      case 'structured':
        // 结构化文档允许空sections，后续可以编辑添加
        if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
          data.sections.forEach((section: any, index: number) => {
            validator
              .validateString(section.id, `sections[${index}].id`)
              .validateString(section.heading, `sections[${index}].heading`, { maxLength: 200 })
              .validateString(section.content, `sections[${index}].content`);
          });
        }
        break;
    }
    
    const result = validator.getResult();
    handleValidationErrors(result, res, next);
  };
};
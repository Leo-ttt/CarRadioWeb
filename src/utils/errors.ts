/**
 * 统一错误处理类
 * 提供标准化的错误定义和处理机制
 */

/**
 * API 错误码枚举
 */
export enum ErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // 认证错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // 资源错误
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',

  // 请求错误
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_PARAMETER = 'MISSING_PARAMETER',

  // 服务器错误
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // 业务错误
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_FAILED = 'OPERATION_FAILED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
}

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly details?: unknown
  public readonly timestamp: string

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()

    // 保持正确的原型链
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  /**
   * 转换为 JSON 格式（用于日志记录）
   */
  toJSON() {
    return {
      name: this.name,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }

  /**
   * 是否为认证错误
   */
  isAuthError(): boolean {
    return [
      ErrorCode.UNAUTHORIZED,
      ErrorCode.FORBIDDEN,
      ErrorCode.TOKEN_EXPIRED,
      ErrorCode.INVALID_CREDENTIALS,
    ].includes(this.code)
  }

  /**
   * 是否为网络错误
   */
  isNetworkError(): boolean {
    return [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT_ERROR].includes(this.code)
  }

  /**
   * 是否为服务器错误
   */
  isServerError(): boolean {
    return this.statusCode >= 500
  }

  /**
   * 是否为客户端错误
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }
}

/**
 * 从 HTTP 状态码创建错误
 */
export function createErrorFromStatus(
  status: number,
  message?: string,
  details?: unknown
): ApiError {
  const errorMap: Record<number, { code: ErrorCode; defaultMessage: string }> = {
    400: { code: ErrorCode.BAD_REQUEST, defaultMessage: '请求参数错误' },
    401: { code: ErrorCode.UNAUTHORIZED, defaultMessage: '未授权访问' },
    403: { code: ErrorCode.FORBIDDEN, defaultMessage: '禁止访问' },
    404: { code: ErrorCode.NOT_FOUND, defaultMessage: '资源不存在' },
    409: { code: ErrorCode.RESOURCE_EXISTS, defaultMessage: '资源已存在' },
    422: { code: ErrorCode.VALIDATION_ERROR, defaultMessage: '数据验证失败' },
    500: { code: ErrorCode.INTERNAL_SERVER_ERROR, defaultMessage: '服务器内部错误' },
    503: { code: ErrorCode.SERVICE_UNAVAILABLE, defaultMessage: '服务暂时不可用' },
  }

  const error = errorMap[status] || {
    code: ErrorCode.UNKNOWN_ERROR,
    defaultMessage: '未知错误',
  }

  return new ApiError(status, error.code, message || error.defaultMessage, details)
}

/**
 * 从 Fetch 错误创建标准错误
 */
export function createErrorFromFetchError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new ApiError(0, ErrorCode.NETWORK_ERROR, '网络连接失败，请检查网络设置')
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError(0, ErrorCode.TIMEOUT_ERROR, '请求超时，请稍后重试')
  }

  if (error instanceof Error) {
    return new ApiError(0, ErrorCode.UNKNOWN_ERROR, error.message)
  }

  return new ApiError(0, ErrorCode.UNKNOWN_ERROR, '发生未知错误')
}


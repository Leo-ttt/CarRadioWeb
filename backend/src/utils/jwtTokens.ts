/**
 * 双 Token 认证机制 (P0-04)
 * - Access Token: 1 小时，用于 API 认证
 * - Refresh Token: 7 天，用于刷新 Access Token
 * 
 * 降低 Token 泄露风险，即使 Access Token 被盗也只影响 1 小时
 */

import jwt from 'jsonwebtoken';

const MIN_SECRET_LENGTH = 32;

/** 开发环境随机密钥（每次重启会变化） */
let devSecret: string | null = null;

/** 获取开发环境随机密钥（导出供 jwt.ts 共享） */
export function getDevSecret(): string {
  if (!devSecret) {
    devSecret = require('crypto').randomBytes(32).toString('hex');
  }
  return devSecret!;
}

/** Access Token 过期时间: 1 小时 */
const ACCESS_TOKEN_EXPIRES_IN = '1h';

/** Refresh Token 过期时间: 7 天 */
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/** Token 类型枚举 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: TokenType.ACCESS;
}

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  type: TokenType.REFRESH;
}

export type JwtPayload = AccessTokenPayload | RefreshTokenPayload;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  // 开发环境：没有配置时使用随机密钥
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return getDevSecret();
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${secret.length})`);
  }
  return secret;
}

/**
 * 生成 Access Token (短期 Token)
 */
export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  const tokenPayload: AccessTokenPayload = {
    ...payload,
    type: TokenType.ACCESS
  };
  return jwt.sign(tokenPayload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * 生成 Refresh Token (长期 Token)
 */
export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  const tokenPayload: RefreshTokenPayload = {
    ...payload,
    type: TokenType.REFRESH
  };
  return jwt.sign(tokenPayload, getSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * 生成双 Token
 * @returns { accessToken, refreshToken }
 */
export function signTokenPair(user: { userId: string; email: string; role: string }): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const expiresIn = 60 * 60; // 1 小时（秒）
  
  const accessToken = signAccessToken({
    userId: user.userId,
    email: user.email,
    role: user.role
  });
  
  const refreshToken = signRefreshToken({
    userId: user.userId,
    email: user.email
  });
  
  return { accessToken, refreshToken, expiresIn };
}

/**
 * 验证 Token 并返回 payload
 * @param token JWT token
 * @returns Token payload 或 null (如果无效)
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 验证 Access Token
 * @param token JWT token
 * @returns Access Token payload 或 null (如果不是 access token 或已过期)
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  if (payload.type !== TokenType.ACCESS) return null;
  return payload;
}

/**
 * 验证 Refresh Token
 * @param token JWT token
 * @returns Refresh Token payload 或 null (如果不是 refresh token 或已过期)
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  if (payload.type !== TokenType.REFRESH) return null;
  return payload;
}

/**
 * 解析 Token 中的用户信息（不验证签名，用于日志）
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 获取 Token 剩余有效时间
 * @returns 剩余秒数，或 -1 如果已过期/无效
 */
export function getTokenTTL(token: string): number {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded.exp) return -1;
    const remaining = decoded.exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : -1;
  } catch {
    return -1;
  }
}

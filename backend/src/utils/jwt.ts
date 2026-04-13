/**
 * JWT utility — sign and verify tokens for admin authentication
 *
 * P0-04: 已升级为双 Token 机制
 * - Access Token: 1 小时，用于 API 认证
 * - Refresh Token: 7 天，用于刷新 Access Token
 *
 * 推荐使用 signTokenPair() 和 verifyAccessToken() / verifyRefreshToken()
 */

import jwt from 'jsonwebtoken';
import { signTokenPair as newSignTokenPair, verifyAccessToken, verifyRefreshToken, signAccessToken, signRefreshToken, getDevSecret } from './jwtTokens';

const MIN_SECRET_LENGTH = 32;

/** @deprecated 使用 signTokenPair() 代替 */
const JWT_EXPIRES_IN = '24h'

interface JwtPayload {
  userId: string
  email: string
  role: string
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET

  // 开发环境：没有配置时使用共享的随机密钥
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required')
    }
    return getDevSecret()
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${secret.length})`)
  }
  return secret
}

/** @deprecated 使用 signTokenPair() 代替 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN })
}

/** 验证并解码 JWT; 如果无效则返回 null */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload
  } catch {
    return null
  }
}

/**
 * 生成双 Token (推荐使用)
 * @returns { accessToken, refreshToken, expiresIn }
 */
export { newSignTokenPair as signTokenPair, signAccessToken, signRefreshToken };

/**
 * 验证 Access Token (推荐使用)
 */
export { verifyAccessToken, verifyRefreshToken };

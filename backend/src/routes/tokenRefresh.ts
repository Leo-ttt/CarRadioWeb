/**
 * Token 刷新路由 (P0-04)
 * 提供 Access Token 刷新功能
 */

import { Router, Request, Response } from 'express';
import User from '../models/User';
import { verifyRefreshToken, signTokenPair } from '../utils/jwt';
import {
  setTokenCookie,
  clearTokenCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie
} from '../utils/tokenCookie';
import { createLogger } from '../utils/logger';

const logger = createLogger('token-refresh');
const router = Router();

/**
 * POST /api/auth/refresh
 * 使用 Refresh Token 刷新 Access Token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // 从 cookie 获取 Refresh Token
    const refreshToken = getRefreshTokenFromCookie(req);
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'refresh_token_missing',
        message: 'Refresh token is required'
      });
      return;
    }
    
    // 验证 Refresh Token
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'invalid_refresh_token',
        message: 'Refresh token is invalid or expired'
      });
      return;
    }
    
    // 验证用户仍然存在且活跃
    const user = await User.findById(payload.userId);
    
    if (!user || !user.isActive) {
      logger.warn({ userId: payload.userId }, 'User not found or inactive during token refresh');
      res.status(401).json({
        success: false,
        error: 'user_inactive',
        message: 'User account is inactive'
      });
      return;
    }
    
    // 生成新的 Token 对
    const tokens = signTokenPair({
      userId: user._id.toString(),
      email: user.email || user.loginUsername || '',
      role: user.role
    });
    
    // 设置新的 Access Token 和 Refresh Token cookies
    setTokenCookie(res, tokens.accessToken);
    setRefreshTokenCookie(res, tokens.refreshToken);
    
    logger.info({ userId: user._id }, 'Tokens refreshed successfully');
    
    // Token 已通过 httpOnly cookie 设置，不在 body 中返回以防 XSS 窃取
    res.json({
      success: true,
      expiresIn: tokens.expiresIn,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error({ error }, 'Token refresh error');
    res.status(500).json({
      success: false,
      error: 'refresh_error',
      message: 'Token refresh failed'
    });
  }
});

/**
 * GET /api/auth/logout
 * 清除所有认证 cookies
 */
router.get('/logout', (_req: Request, res: Response): void => {
  clearTokenCookie(res);
  clearRefreshTokenCookie(res);
  res.json({ success: true });
});

/**
 * POST /api/auth/logout
 * 清除所有认证 cookies (POST 版本)
 */
router.post('/logout', (_req: Request, res: Response): void => {
  clearTokenCookie(res);
  clearRefreshTokenCookie(res);
  res.json({ success: true });
});

export default router;

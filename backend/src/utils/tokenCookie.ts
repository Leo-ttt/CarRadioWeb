/**
 * Token Cookie Utility
 * Provides secure httpOnly cookie operations for JWT tokens
 * 
 * P0-04: 支持双 Token 机制
 * - Access Token: 1 小时，用于 API 认证
 * - Refresh Token: 7 天，用于刷新 Access Token
 */

import { Request, Response, CookieOptions } from 'express';

const TOKEN_COOKIE_NAME = 'admin_token';
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const CSRF_COOKIE_NAME = 'csrf_token';

// Token 过期时间 (P0-04)
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 小时
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 天

/**
 * Cookie options for Access Token storage (1小时)
 * Uses httpOnly to prevent XSS from reading the token
 * Uses secure flag in production (HTTPS only)
 * Uses sameSite: 'lax' to prevent CSRF attacks
 */
export function getTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  };
}

/**
 * Cookie options for Refresh Token storage (7天)
 * 单独设置过期时间，更长的有效期用于刷新
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/api/auth', // Refresh token 只在 auth 路径发送
  };
}

/**
 * Set Access Token in httpOnly cookie
 */
export function setTokenCookie(res: Response, token: string): void {
  res.cookie(TOKEN_COOKIE_NAME, token, getTokenCookieOptions());
}

/**
 * Set Refresh Token in httpOnly cookie
 * P0-04: 新增函数
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, getRefreshTokenCookieOptions());
}

/**
 * Clear Access Token cookie
 */
export function clearTokenCookie(res: Response): void {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Clear Refresh Token cookie
 * P0-04: 新增函数
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
}

/**
 * Get Access Token from cookie
 */
export function getTokenFromCookie(req: Request): string | undefined {
  return req.cookies[TOKEN_COOKIE_NAME];
}

/**
 * Get Refresh Token from cookie
 * P0-04: 新增函数
 */
export function getRefreshTokenFromCookie(req: Request): string | undefined {
  return req.cookies[REFRESH_TOKEN_COOKIE_NAME];
}

/**
 * Cookie options for CSRF token
 * Uses sameSite: 'lax' to match JWT cookie for consistent behavior
 * The CSRF protection is enforced by the token comparison, not just sameSite
 */
export function getCsrfCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: false, // Must be readable by JavaScript for the double-submit pattern
    secure: isProduction,
    sameSite: 'lax', // Unified with JWT cookie for consistent CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };
}

/**
 * Set CSRF token in cookie
 */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(req: Request): string | undefined {
  return req.cookies[CSRF_COOKIE_NAME];
}

/**
 * Extract Bearer token from Authorization header
 * Also falls back to cookie for API clients that don't send headers
 */
export function extractToken(req: Request): string | undefined {
  // First try Authorization header (standard Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fallback to cookie (for browser-based requests)
  return getTokenFromCookie(req);
}

export default {
  setTokenCookie,
  clearTokenCookie,
  getTokenFromCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setCsrfCookie,
  getCsrfTokenFromCookie,
  extractToken,
  getTokenCookieOptions,
  getRefreshTokenCookieOptions,
};

/**
 * Authentication routes
 * Email verification + password login for internal management
 * OAuth removed - no external dependencies needed
 */

import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import User, { IUser } from '../models/User'
import { signTokenPair, verifyToken, verifyRefreshToken } from '../utils/jwt'
import { createSecureLogger } from '../utils/secureLogger'
import { adminJwtEmailField } from '../utils/adminIdentity'
import { setTokenCookie, clearTokenCookie, clearRefreshTokenCookie, extractToken, setRefreshTokenCookie } from '../utils/tokenCookie'
import { authLimiter, codeLimiter } from '../middleware/rateLimit'
import emailVerificationService from '../services/emailVerificationService'

const logger = createSecureLogger('auth-route')

const BCRYPT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 10

const router = Router()

// 应用认证限流到登录相关路由
router.use('/login', authLimiter)
router.use('/register', authLimiter)
router.use('/send-code', codeLimiter)

// ═══════════════════════════════════════════════════════════════
// 邮箱验证码相关 API
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/send-code — 发送验证码
 * 用于注册和忘记密码
 */
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email, type = 'register' } = req.body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'invalid_email' })
    }

    if (!['register', 'reset_password'].includes(type)) {
      return res.status(400).json({ success: false, error: 'invalid_type' })
    }

    // 注册时检查邮箱是否已存在
    if (type === 'register') {
      const existing = await User.findOne({ email: email.toLowerCase().trim() })
      if (existing) {
        return res.status(409).json({ success: false, error: 'email_already_exists' })
      }
    }

    // 忘记密码时检查邮箱是否存在
    if (type === 'reset_password') {
      const existing = await User.findOne({ email: email.toLowerCase().trim(), provider: 'email' })
      if (!existing) {
        // 为了安全，不暴露邮箱是否存在
        return res.json({ success: true, message: '如果邮箱存在，验证码已发送' })
      }
    }

    const result = await emailVerificationService.sendCode(email, type)

    if (result.success) {
      // 获取邮箱服务商信息（用于前端提示）
      const providerInfo = emailVerificationService.getProviderInfo(email)
      return res.json({
        success: true,
        message: '验证码已发送',
        provider: providerInfo,
      })
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        remainingMs: result.remainingMs,
      })
    }
  } catch (error) {
    logger.error({ error }, 'Send code failed')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

/**
 * POST /api/auth/verify-code — 验证验证码
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code, type = 'register' } = req.body

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'email_and_code_required' })
    }

    const result = await emailVerificationService.verifyCode(email, code, type)

    if (result.success) {
      return res.json({ success: true, message: '验证成功' })
    } else {
      return res.status(400).json({ success: false, error: result.error })
    }
  } catch (error) {
    logger.error({ error }, 'Verify code failed')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

// ═══════════════════════════════════════════════════════════════
// 注册 API（需要先验证邮箱）
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register — 邮箱验证后注册
 * 流程：
 * 1. 前端先调用 /send-code 发送验证码
 * 2. 前端调用 /verify-code 验证
 * 3. 验证通过后，调用此接口完成注册
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nickname, skipVerification } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email_and_password_required' })
    }

    // 密码强度验证
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ success: false, error: 'password_too_short' })
    }

    // 密码复杂度验证
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({ success: false, error: 'password_too_weak' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 检查邮箱是否已注册
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(409).json({ success: false, error: 'email_already_exists' })
    }

    // 验证邮箱验证码（除非是开发环境跳过验证）
    const isDev = process.env.NODE_ENV !== 'production' && skipVerification
    if (!isDev) {
      const isVerified = await emailVerificationService.isEmailVerified(normalizedEmail, 'register')
      if (!isVerified) {
        return res.status(400).json({ success: false, error: 'email_not_verified' })
      }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // 使用 MongoDB 事务原子性检查并创建用户
    const session = await User.startSession()

    try {
      session.startTransaction()

      // 检查是否已存在超级管理员
      const existingSuperAdmin = await User.findOne({ role: 'super_admin' }).session(session)
      const isFirstUser = !existingSuperAdmin

      const user = await User.create([{
        email: normalizedEmail,
        nickname: nickname?.trim() || normalizedEmail.split('@')[0],
        avatar: '',
        role: isFirstUser ? 'super_admin' : 'admin',
        provider: 'email',
        providerId: `email_${normalizedEmail}`,
        passwordHash,
        permissions: [],
        isActive: isFirstUser, // 第一个用户自动激活，其他用户需要审批
        lastLoginAt: new Date(),
      }], { session })

      await session.commitTransaction()

      const newUser = user[0]

      // 清除验证码记录
      await emailVerificationService.clearVerification(normalizedEmail, 'register')

      if (!newUser.isActive) {
        return res.status(403).json({
          success: false,
          error: 'account_pending_approval',
          message: '注册成功，等待管理员审批',
        })
      }

      // 第一个用户直接登录
      const tokens = signTokenPair({
        userId: newUser._id.toString(),
        email: adminJwtEmailField(newUser),
        role: newUser.role,
      })
      setTokenCookie(res, tokens.accessToken)
      setRefreshTokenCookie(res, tokens.refreshToken)

      logger.info({ userId: newUser._id, isFirstUser }, 'Registration successful')

      return res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          email: newUser.email,
          nickname: newUser.nickname,
          role: newUser.role,
        },
      })
    } catch (error: any) {
      await session.abortTransaction()

      // 处理并发创建导致的重复键错误
      if (error.code === 11000) {
        return res.status(409).json({ success: false, error: 'email_already_exists' })
      }

      throw error
    } finally {
      session.endSession()
    }
  } catch (error) {
    logger.error({ error }, 'Registration failed')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

// ═══════════════════════════════════════════════════════════════
// 登录 API
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/login — 邮箱/用户名 + 密码登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const login = String(req.body.login ?? req.body.email ?? '').trim().toLowerCase()
    const password = req.body.password

    if (!login) {
      return res.status(400).json({ success: false, error: 'login_required' })
    }
    if (password == null || String(password).length === 0) {
      return res.status(400).json({ success: false, error: 'password_required' })
    }

    const user = await User.findOne({
      provider: 'email',
      $or: [{ email: String(login) }, { loginUsername: String(login) }],
    }).select('+passwordHash')

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'invalid_credentials' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'account_inactive' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'invalid_credentials' })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const tokens = signTokenPair({
      userId: user._id.toString(),
      email: adminJwtEmailField(user),
      role: user.role,
    })
    setTokenCookie(res, tokens.accessToken)
    setRefreshTokenCookie(res, tokens.refreshToken)

    logger.info({ userId: user._id }, 'Login successful')

    return res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Login failed')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

// ═══════════════════════════════════════════════════════════════
// 忘记密码 API
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/reset-password — 重置密码（需要验证码）
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, error: 'email_code_password_required' })
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ success: false, error: 'password_too_short' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 验证验证码
    const isVerified = await emailVerificationService.isEmailVerified(normalizedEmail, 'reset_password')
    if (!isVerified) {
      return res.status(400).json({ success: false, error: 'email_not_verified' })
    }

    // 查找用户
    const user = await User.findOne({ email: normalizedEmail, provider: 'email' })
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' })
    }

    // 更新密码
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await user.save()

    // 清除验证码
    await emailVerificationService.clearVerification(normalizedEmail, 'reset_password')

    logger.info({ userId: user._id }, 'Password reset successful')

    return res.json({ success: true, message: '密码重置成功' })
  } catch (error) {
    logger.error({ error }, 'Reset password failed')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

// ═══════════════════════════════════════════════════════════════
// Token 管理 API
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/change-password — 已登录用户修改密码
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ success: false, error: 'missing_token' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ success: false, error: 'invalid_token' })
    }

    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'passwords_required' })
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ success: false, error: 'password_too_short' })
    }

    const user = await User.findById(payload.userId).select('+passwordHash')
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' })
    }

    if (user.provider !== 'email') {
      return res.status(400).json({ success: false, error: 'oauth_user_cannot_change_password' })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || '')
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'current_password_incorrect' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await user.save()

    return res.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Change password failed')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

/**
 * POST /api/auth/logout — 登出
 */
router.post('/logout', (_req: Request, res: Response) => {
  clearTokenCookie(res)
  clearRefreshTokenCookie(res)
  res.json({ success: true })
})

/**
 * POST /api/auth/refresh — 刷新 Token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.['refresh_token']

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'refresh_token_missing' })
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      clearTokenCookie(res)
      clearRefreshTokenCookie(res)
      return res.status(401).json({ success: false, error: 'refresh_token_invalid' })
    }

    const user = await User.findById(payload.userId)
    if (!user || !user.isActive) {
      clearTokenCookie(res)
      clearRefreshTokenCookie(res)
      return res.status(401).json({ success: false, error: 'user_inactive' })
    }

    const tokens = signTokenPair({
      userId: user._id.toString(),
      email: adminJwtEmailField(user),
      role: user.role,
    })

    setTokenCookie(res, tokens.accessToken)
    setRefreshTokenCookie(res, tokens.refreshToken)

    logger.info({ userId: user._id }, 'Token refresh successful')

    return res.json({
      success: true,
      expiresIn: tokens.expiresIn,
    })
  } catch (error) {
    logger.error({ error }, 'Token refresh failed')
    clearTokenCookie(res)
    clearRefreshTokenCookie(res)
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

/**
 * GET /api/auth/check — 检查登录状态
 */
router.get('/check', (req: Request, res: Response) => {
  const token = extractToken(req)
  if (!token) {
    return res.json({ authenticated: false })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.json({ authenticated: false })
  }

  return res.json({ authenticated: true })
})

/**
 * GET /api/auth/me — 获取当前用户信息
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ success: false, error: 'missing_token' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ success: false, error: 'invalid_token' })
    }

    const user = await User.findById(payload.userId).select('-__v')
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'user_not_found' })
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email ?? null,
        loginUsername: user.loginUsername ?? null,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions,
        provider: user.provider,
        lastLoginAt: user.lastLoginAt,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get current user')
    return res.status(500).json({ success: false, error: 'server_error' })
  }
})

export default router

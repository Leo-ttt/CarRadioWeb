/**
 * Admin user management routes
 * Most endpoints require super_admin; nickname update only requires auth
 */

import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import { requireSuperAdmin } from '../middleware/auth'
import { ALL_PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'
import { normalizeLoginUsername } from '../utils/loginUsername'

const logger = createLogger('users-route')

const BCRYPT_ROUNDS = 12

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const router = Router()

/**
 * PUT /api/users/me/nickname — any authenticated admin can update their own nickname
 * Must be defined BEFORE router.use(requireSuperAdmin) so it's not blocked
 */
router.put('/me/nickname', async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body

    if (!nickname?.trim()) {
      return res.status(400).json({ success: false, error: 'nickname_required' })
    }

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'not_authenticated' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' })
    }

    user.nickname = nickname.trim()
    await user.save()
    res.json({ success: true, data: user })
  } catch (error) {
    logger.error({ error }, 'Update own nickname failed')
    res.status(500).json({ success: false, error: 'update_failed' })
  }
})

// All remaining routes require super_admin (authenticateUser already applied in index.ts)
router.use(requireSuperAdmin)

/** GET /api/users — list all admin users */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select('-__v')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: users })
  } catch (error) {
    logger.error({ error }, 'Fetch users failed')
    res.status(500).json({ success: false, error: 'fetch_failed' })
  }
})

/** GET /api/users/permissions — return all available permissions */
router.get('/permissions', (_req: Request, res: Response) => {
  res.json({ success: true, data: ALL_PERMISSIONS })
})

/** POST /api/users — create a new admin (invited by super_admin) */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, nickname, permissions, password, loginUsername } = req.body

    if (!nickname?.trim()) {
      return res.status(400).json({ success: false, error: 'nickname_required' })
    }

    const userData: Record<string, unknown> = {
      nickname: nickname.trim(),
      avatar: '',
      role: 'admin',
      permissions: Array.isArray(permissions) ? permissions : [],
      isActive: true,
    }

    const passwordStr = typeof password === 'string' ? password.trim() : ''

    if (passwordStr.length > 0) {
      if (passwordStr.length < 8) {
        return res.status(400).json({ success: false, error: 'password_too_short' })
      }

      const lu = normalizeLoginUsername(typeof loginUsername === 'string' ? loginUsername : '')
      if (!lu) {
        return res.status(400).json({ success: false, error: 'login_username_invalid' })
      }

      if (await User.findOne({ loginUsername: lu })) {
        return res.status(409).json({ success: false, error: 'login_username_taken' })
      }
      if (await User.findOne({ email: lu })) {
        return res.status(409).json({ success: false, error: 'login_username_taken' })
      }

      const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : ''
      if (emailTrim) {
        if (!EMAIL_SHAPE.test(emailTrim)) {
          return res.status(400).json({ success: false, error: 'invalid_contact_email' })
        }
        if (await User.findOne({ email: emailTrim })) {
          return res.status(409).json({ success: false, error: 'email_already_exists' })
        }
        userData.email = emailTrim
      }

      userData.loginUsername = lu
      userData.provider = 'email'
      userData.providerId = `local_${lu}`
      userData.passwordHash = await bcrypt.hash(passwordStr, BCRYPT_ROUNDS)
    } else {
      if (!email?.trim()) {
        return res.status(400).json({ success: false, error: 'email_required' })
      }
      const em = email.trim().toLowerCase()
      if (await User.findOne({ email: em })) {
        return res.status(409).json({ success: false, error: 'email_already_exists' })
      }

      userData.email = em
      userData.provider = 'google'
      userData.providerId = `pending_${Date.now()}`
    }

    const user = await User.create(userData)
    res.status(201).json({ success: true, data: user })
  } catch (error) {
    logger.error({ error }, 'Create user failed')
    res.status(500).json({ success: false, error: 'create_failed' })
  }
})

/** PUT /api/users/:id — update admin nickname, permissions, isActive */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { nickname, permissions, isActive } = req.body

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' })
    }

    // Cannot modify super_admin via this endpoint
    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, error: 'cannot_modify_super_admin' })
    }

    if (nickname !== undefined) user.nickname = nickname
    if (Array.isArray(permissions)) user.permissions = permissions
    if (typeof isActive === 'boolean') user.isActive = isActive

    await user.save()
    res.json({ success: true, data: user })
  } catch (error) {
    logger.error({ error }, 'Update user failed')
    res.status(500).json({ success: false, error: 'update_failed' })
  }
})

/** DELETE /api/users/:id — remove an admin */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' })
    }

    // Cannot delete super_admin
    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, error: 'cannot_delete_super_admin' })
    }

    await User.findByIdAndDelete(id)
    res.json({ success: true })
  } catch (error) {
    logger.error({ error, userId: req.params.id }, 'Delete user failed')
    res.status(500).json({ success: false, error: 'delete_failed' })
  }
})

/** PUT /api/users/:id/nickname — kept for backward compatibility, redirects to /me/nickname logic */
router.put('/:id/nickname', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { nickname } = req.body

    if (!nickname?.trim()) {
      return res.status(400).json({ success: false, error: 'nickname_required' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' })
    }

    user.nickname = nickname.trim()
    await user.save()
    res.json({ success: true, data: user })
  } catch (error) {
    logger.error({ error }, 'Update user nickname failed')
    res.status(500).json({ success: false, error: 'update_failed' })
  }
})

export default router

/**
 * Authentication and authorization middleware
 * JWT-based, reads user from database on each request
 */

import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { extractToken } from '../utils/tokenCookie'
import User, { IUser } from '../models/User'

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IUser
      resource?: unknown
    }
  }
}

/** Require a valid JWT (cookie or Authorization header) and active user */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req)
    if (!token) {
      res.status(401).json({ success: false, error: 'missing_token' })
      return
    }

    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ success: false, error: 'invalid_token' })
      return
    }

    const user = await User.findById(payload.userId)
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'user_inactive' })
      return
    }

    req.user = user
    next()
  } catch {
    res.status(500).json({ success: false, error: 'auth_error' })
  }
}

/** Require specific permission(s) — super_admin always passes */
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'not_authenticated' })
      return
    }

    const hasAll = permissions.every((p) => req.user!.hasPermission(p))
    if (!hasAll) {
      res.status(403).json({ success: false, error: 'insufficient_permissions' })
      return
    }

    next()
  }
}

/** Require super_admin role */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'not_authenticated' })
    return
  }

  if (req.user.role !== 'super_admin') {
    res.status(403).json({ success: false, error: 'super_admin_required' })
    return
  }

  next()
}

/** Optional auth — attach user if token present (cookie or header), but don't block */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        const user = await User.findById(payload.userId)
        if (user?.isActive) {
          req.user = user
        }
      }
    }
  } catch {
    // Silently continue without auth
  }
  next()
}

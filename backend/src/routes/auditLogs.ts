/**
 * Audit log query routes
 * Only super_admin can view logs
 */

import { Router, Request, Response } from 'express'
import AuditLog from '../models/AuditLog'
import { requireSuperAdmin } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const logger = createLogger('audit-logs-route')

const router = Router()

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

// authenticateUser already applied in index.ts
router.use(requireSuperAdmin)

/** GET /api/audit-logs — paginated list with optional filters */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE)
    )
    const skip = (page - 1) * limit

    // Build filter
    const filter: Record<string, unknown> = {}
    if (req.query.action) filter.action = req.query.action
    if (req.query.resource) filter.resource = req.query.resource
    if (req.query.userId) filter.userId = req.query.userId

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch audit logs')
    res.status(500).json({ success: false, error: 'fetch_failed' })
  }
})

export default router

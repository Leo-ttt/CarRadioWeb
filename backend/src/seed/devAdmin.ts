/**
 * 开发环境默认管理员种子数据
 * 仅在非生产环境执行，用于简化开发调试
 */

import bcrypt from 'bcryptjs'
import User from '../models/User'
import { systemLogger } from '../utils/logger'

const DEV_ADMIN = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@dev.local',
  nickname: '开发管理员',
}

export async function seedDevAdmin(): Promise<void> {
  // 生产环境不执行
  if (process.env.NODE_ENV === 'production') {
    return
  }

  try {
    // 检查是否已存在
    const existing = await User.findOne({ loginUsername: DEV_ADMIN.username })
    if (existing) {
      systemLogger.info('Dev admin already exists, skipping seed')
      return
    }

    // 创建默认管理员
    const passwordHash = await bcrypt.hash(DEV_ADMIN.password, 10)
    await User.create({
      loginUsername: DEV_ADMIN.username,
      email: DEV_ADMIN.email,
      nickname: DEV_ADMIN.nickname,
      passwordHash,
      role: 'super_admin',
      provider: 'email',
      providerId: `dev-${Date.now()}`,
      isActive: true,
      permissions: [],
    })

    systemLogger.info(
      `✅ Dev admin created: ${DEV_ADMIN.username} / ${DEV_ADMIN.password}`
    )
  } catch (error) {
    systemLogger.error({ error }, 'Failed to seed dev admin')
  }
}

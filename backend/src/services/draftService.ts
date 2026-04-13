import { Draft, IDraft } from '../models/Draft'
import { createLogger } from '../utils/logger'

const logger = createLogger('draft')

export interface DraftData {
  _id: string
  articleId?: string
  data: any
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateDraftData {
  articleId?: string
  data: any
}

/**
 * 保存草稿
 */
export const saveDraft = async (data: CreateDraftData): Promise<DraftData> => {
  try {
    const draft = new Draft({
      articleId: data.articleId,
      data: data.data
    })

    const savedDraft = await draft.save()
    return savedDraft.toObject() as unknown as DraftData
  } catch (error) {
    logger.error({ error }, '保存草稿失败')
    throw error
  }
}

/**
 * 获取草稿
 */
export const getDraft = async (articleId?: string): Promise<DraftData | null> => {
  try {
    const query = articleId ? { articleId } : { articleId: { $exists: false } }
    const draft = await Draft.findOne(query).sort({ updatedAt: -1 })
    
    if (!draft) {
      return null
    }

    return draft.toObject() as unknown as DraftData
  } catch (error) {
    logger.error({ error }, '获取草稿失败')
    throw error
  }
}

/**
 * 删除草稿
 */
export const deleteDraft = async (articleId?: string): Promise<boolean> => {
  try {
    const query = articleId ? { articleId } : { articleId: { $exists: false } }
    const result = await Draft.deleteMany(query)
    return result.deletedCount > 0
  } catch (error) {
    logger.error({ error }, '删除草稿失败')
    throw error
  }
}

/**
 * 清理过期草稿
 */
export const cleanupExpiredDrafts = async (): Promise<number> => {
  try {
    const result = await Draft.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    return result.deletedCount || 0
  } catch (error) {
    logger.error({ error }, '清理过期草稿失败')
    return 0
  }
}

/**
 * 从localStorage迁移数据
 */
export const migrateFromLocalStorage = async (localData: any[]): Promise<number> => {
  try {
    let migratedCount = 0
    
    for (const item of localData) {
      try {
        await saveDraft({
          articleId: item.articleId,
          data: item.data
        })
        migratedCount++
      } catch (error) {
        logger.error({ error }, '迁移草稿失败')
      }
    }

    return migratedCount
  } catch (error) {
    logger.error({ error }, '迁移草稿数据失败')
    throw error
  }
}

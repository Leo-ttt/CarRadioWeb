import { ContactInfo, IContactInfo } from '../models/ContactInfo'
import { createLogger } from '../utils/logger'

const logger = createLogger('contact-service')

export interface CreateContactInfoData {
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'vk' | 'youtube'
  label: string
  value: string
  icon: string
  qrCode?: string // 二维码图片URL(可选,主要用于telegram)
  isActive?: boolean
  order?: number
  language: 'en' | 'ru' // 资料体系
}

export interface UpdateContactInfoData {
  type?: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'vk' | 'youtube'
  label?: string
  value?: string
  icon?: string
  qrCode?: string
  isActive?: boolean
  order?: number
  language?: 'en' | 'ru'
}

/**
 * 获取所有联系信息（前端使用，只返回活跃的）
 * @param language 资料体系语言，不传则返回所有
 */
export const getAllContactInfo = async (language?: 'en' | 'ru'): Promise<IContactInfo[]> => {
  try {
    const filter: any = { isActive: true }
    if (language) {
      filter.language = language
    }
    
    const contactInfo = await ContactInfo.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .exec()
    return contactInfo
  } catch (error) {
    logger.error({ error }, '获取联系信息失败')
    throw new Error('获取联系信息失败')
  }
}

/**
 * 获取所有联系信息（包括非活跃的，用于管理后台）
 * @param language 资料体系语言，不传则返回所有
 */
export const getAllContactInfoForAdmin = async (language?: 'en' | 'ru'): Promise<IContactInfo[]> => {
  try {
    const filter: any = {}
    if (language) {
      filter.language = language
    }
    
    const contactInfo = await ContactInfo.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .exec()
    return contactInfo
  } catch (error) {
    logger.error({ error }, '获取联系信息失败')
    throw new Error('获取联系信息失败')
  }
}

/**
 * 创建联系信息
 */
export const createContactInfo = async (data: CreateContactInfoData): Promise<IContactInfo> => {
  try {
    // 验证数据
    if (!data.type || !data.value || !data.icon || !data.language) {
      throw new Error('缺少必要字段')
    }

    // 如果没有提供label,根据type自动生成
    if (!data.label) {
      const labelMap: Record<string, string> = {
        email: '邮箱',
        phone: '电话',
        whatsapp: 'WhatsApp',
        telegram: 'Telegram',
        vk: 'VK',
        youtube: 'YouTube'
      }
      data.label = labelMap[data.type] || data.type
    }

    // 检查是否已存在相同类型和语言的联系信息
    const existing = await ContactInfo.findOne({ 
      type: data.type, 
      language: data.language,
      isActive: true 
    })
    if (existing) {
      throw new Error('该类型的联系信息在此资料体系中已存在')
    }

    const contactInfo = new ContactInfo({
      ...data,
      isActive: data.isActive ?? true,
      order: data.order ?? 0
    })

    const savedContactInfo = await contactInfo.save()
    return savedContactInfo
  } catch (error) {
    logger.error({ error }, '创建联系信息失败')
    throw error
  }
}

/**
 * 更新联系信息
 */
export const updateContactInfo = async (id: string, data: UpdateContactInfoData): Promise<IContactInfo> => {
  try {
    const contactInfo = await ContactInfo.findById(id)
    if (!contactInfo) {
      throw new Error('联系信息不存在')
    }

    // 如果要更改类型或语言，检查是否已存在
    if ((data.type && data.type !== contactInfo.type) || (data.language && data.language !== contactInfo.language)) {
      const checkType = data.type || contactInfo.type
      const checkLanguage = data.language || contactInfo.language
      
      const existing = await ContactInfo.findOne({ 
        type: checkType, 
        language: checkLanguage,
        isActive: true,
        _id: { $ne: id }
      })
      if (existing) {
        throw new Error('该类型的联系信息在此资料体系中已存在')
      }
    }

    const updatedContactInfo = await ContactInfo.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    )

    if (!updatedContactInfo) {
      throw new Error('更新联系信息失败')
    }

    return updatedContactInfo
  } catch (error) {
    logger.error({ error }, '更新联系信息失败')
    throw error
  }
}

/**
 * 删除联系信息
 */
export const deleteContactInfo = async (id: string): Promise<void> => {
  try {
    const result = await ContactInfo.findByIdAndDelete(id)
    if (!result) {
      throw new Error('联系信息不存在')
    }
  } catch (error) {
    logger.error({ error }, '删除联系信息失败')
    throw error
  }
}

/**
 * 切换联系信息状态
 */
export const toggleContactInfoStatus = async (id: string): Promise<IContactInfo> => {
  try {
    const contactInfo = await ContactInfo.findById(id)
    if (!contactInfo) {
      throw new Error('联系信息不存在')
    }

    contactInfo.isActive = !contactInfo.isActive
    const updatedContactInfo = await contactInfo.save()
    return updatedContactInfo
  } catch (error) {
    logger.error({ error }, '切换联系信息状态失败')
    throw error
  }
}

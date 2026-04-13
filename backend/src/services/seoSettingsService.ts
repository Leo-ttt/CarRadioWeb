/**
 * SEO Settings Service
 * Business logic for SEO configuration management
 */

import { SEOSettings, ISEOSettings } from '../models/SEOSettings'

// Default SEO configurations for pages
const DEFAULT_SEO_PAGES = [
  'home',
  'products', 
  'about',
  'quality',
  'contact',
  'faq',
  'knowledge',
  'software-downloads'
] as const

type PageKey = typeof DEFAULT_SEO_PAGES[number] | string

// Default SEO content for batch generation
const DEFAULT_SEO_CONTENT: Record<string, { en: { title: string; description: string; keywords: string[] }; ru: { title: string; description: string; keywords: string[] } }> = {
  home: {
    en: {
      title: 'Professional Automotive Electronics',
      description: 'Wireless CarPlay, Android Auto, and touchscreen navigation systems designed for seamless integration with your vehicle.',
      keywords: ['automotive electronics', 'CarPlay', 'Android Auto', 'car navigation', 'head unit']
    },
    ru: {
      title: 'Профессиональная автомобильная электроника',
      description: 'Беспроводной CarPlay, Android Auto и сенсорные навигационные системы для бесшовной интеграции с вашим автомобилем.',
      keywords: ['автомобильная электроника', 'CarPlay', 'Android Auto', 'автонавигация', 'головное устройство']
    }
  },
  products: {
    en: {
      title: 'Products',
      description: 'Browse our premium automotive electronics products including CarPlay systems, Android Auto units, and navigation displays.',
      keywords: ['car products', 'head unit', 'car multimedia', 'vehicle accessories', 'CarPlay system']
    },
    ru: {
      title: 'Продукция',
      description: 'Просмотрите нашу премиальную автомобильную электронику, включая системы CarPlay, Android Auto и навигационные дисплеи.',
      keywords: ['автотовары', 'головное устройство', 'автомультимедиа', 'автоаксессуары', 'система CarPlay']
    }
  },
  about: {
    en: {
      title: 'About Us',
      description: 'Learn about our company, our mission to provide quality automotive electronics, and our commitment to customer satisfaction.',
      keywords: ['about us', 'company', 'automotive electronics manufacturer', 'our story']
    },
    ru: {
      title: 'О нас',
      description: 'Узнайте о нашей компании, нашей миссии по предоставлению качественной автомобильной электроники и нашей приверженности удовлетворению клиентов.',
      keywords: ['о нас', 'компания', 'производитель автоэлектроники', 'наша история']
    }
  },
  quality: {
    en: {
      title: 'Quality Assurance',
      description: 'Our commitment to quality through ISO certifications, rigorous testing, and continuous improvement processes.',
      keywords: ['quality assurance', 'ISO certification', 'product quality', 'testing', 'standards']
    },
    ru: {
      title: 'Гарантия качества',
      description: 'Наша приверженность качеству через сертификацию ISO, строгое тестирование и процессы непрерывного улучшения.',
      keywords: ['гарантия качества', 'сертификация ISO', 'качество продукции', 'тестирование', 'стандарты']
    }
  },
  contact: {
    en: {
      title: 'Contact Us',
      description: 'Get in touch with our support team for technical assistance, product inquiries, or partnership opportunities.',
      keywords: ['contact us', 'support', 'customer service', 'technical support', 'inquiries']
    },
    ru: {
      title: 'Связаться с нами',
      description: 'Свяжитесь с нашей службой поддержки для технической помощи, вопросов о продукции или возможностей партнерства.',
      keywords: ['связаться с нами', 'поддержка', 'обслуживание клиентов', 'техподдержка', 'запросы']
    }
  },
  faq: {
    en: {
      title: 'FAQ',
      description: 'Find answers to frequently asked questions about our products, installation, compatibility, and support.',
      keywords: ['FAQ', 'frequently asked questions', 'help', 'support', 'answers']
    },
    ru: {
      title: 'Часто задаваемые вопросы',
      description: 'Найдите ответы на часто задаваемые вопросы о наших продуктах, установке, совместимости и поддержке.',
      keywords: ['FAQ', 'часто задаваемые вопросы', 'помощь', 'поддержка', 'ответы']
    }
  },
  knowledge: {
    en: {
      title: 'Knowledge Base',
      description: 'Access comprehensive vehicle compatibility guides, installation manuals, and technical documentation for our products.',
      keywords: ['knowledge base', 'vehicle compatibility', 'installation guide', 'technical documentation', 'tutorials']
    },
    ru: {
      title: 'База знаний',
      description: 'Получите доступ к полным руководствам по совместимости автомобилей, инструкциям по установке и технической документации.',
      keywords: ['база знаний', 'совместимость автомобилей', 'руководство по установке', 'техническая документация', 'учебники']
    }
  },
  'software-downloads': {
    en: {
      title: 'Software Downloads',
      description: 'Download the latest firmware updates, software tools, and drivers for your automotive electronics products.',
      keywords: ['software downloads', 'firmware', 'updates', 'drivers', 'tools']
    },
    ru: {
      title: 'Загрузка программного обеспечения',
      description: 'Загрузите последние обновления прошивки, программные инструменты и драйверы для вашей автомобильной электроники.',
      keywords: ['загрузка ПО', 'прошивка', 'обновления', 'драйверы', 'инструменты']
    }
  }
}

interface CreateSEOInput {
  pageKey: string
  language: 'en' | 'ru'
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  structuredData?: string
}

interface UpdateSEOInput {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean
  structuredData?: string
  isActive?: boolean
}

export class SEOSettingsService {
  /**
   * Get SEO settings for a specific page and language
   */
  async getByPageKey(pageKey: PageKey, language: string = 'en'): Promise<ISEOSettings | null> {
    const validLanguage = 'en'
    return SEOSettings.getByPageKey(pageKey, validLanguage)
  }

  /**
   * Get all SEO settings
   */
  async getAll(language?: string): Promise<ISEOSettings[]> {
    const query: Record<string, unknown> = {}
    if (language) {
      query.language = 'en'
    }
    return SEOSettings.find(query).sort({ pageKey: 1, language: 1 })
  }

  /**
   * Get SEO settings by ID
   */
  async getById(id: string): Promise<ISEOSettings | null> {
    return SEOSettings.findById(id)
  }

  /**
   * Create new SEO settings
   */
  async create(input: CreateSEOInput): Promise<ISEOSettings> {
    // Check if already exists
    const existing = await SEOSettings.findOne({
      pageKey: input.pageKey,
      language: input.language
    })

    if (existing) {
      throw new Error(`SEO settings for page "${input.pageKey}" in language "${input.language}" already exists`)
    }

    const seoSettings = new SEOSettings({
      ...input,
      keywords: input.keywords ?? [],
      ogType: input.ogType ?? 'website',
      isActive: true
    })

    return seoSettings.save()
  }

  /**
   * Update SEO settings
   */
  async update(id: string, input: UpdateSEOInput): Promise<ISEOSettings | null> {
    return SEOSettings.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    )
  }

  /**
   * Delete SEO settings
   */
  async delete(id: string): Promise<boolean> {
    const result = await SEOSettings.findByIdAndDelete(id)
    return !!result
  }

  /**
   * Bulk get SEO settings for multiple pages
   */
  async getBulk(pageKeys: string[], language: string = 'en'): Promise<Map<string, ISEOSettings>> {
    const validLanguage = 'en'
    const settings = await SEOSettings.find({
      pageKey: { $in: pageKeys },
      language: validLanguage,
      isActive: true
    })

    const map = new Map<string, ISEOSettings>()
    settings.forEach(setting => {
      map.set(setting.pageKey, setting)
    })

    return map
  }

  /**
   * Get available page keys for SEO configuration
   */
  getAvailablePageKeys(): readonly string[] {
    return DEFAULT_SEO_PAGES
  }

  /**
   * Generate default SEO settings for all unconfigured pages
   * Returns count of created settings
   */
  async generateDefaults(): Promise<{ created: number; skipped: number; errors: string[] }> {
    const result = { created: 0, skipped: 0, errors: [] as string[] }
    const languages: Array<'en' | 'ru'> = ['en']

    for (const pageKey of DEFAULT_SEO_PAGES) {
      const defaultContent = DEFAULT_SEO_CONTENT[pageKey]
      if (!defaultContent) continue

      for (const language of languages) {
        try {
          // Check if already exists
          const existing = await SEOSettings.findOne({ pageKey, language })
          if (existing) {
            result.skipped++
            continue
          }

          const content = defaultContent[language]
          const seoSettings = new SEOSettings({
            pageKey,
            language,
            title: content.title,
            description: content.description,
            keywords: content.keywords,
            ogType: 'website',
            isActive: true
          })

          await seoSettings.save()
          result.created++
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`${pageKey}/${language}: ${message}`)
        }
      }
    }

    return result
  }
}

export const seoSettingsService = new SEOSettingsService()

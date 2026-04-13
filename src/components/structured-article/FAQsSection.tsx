import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ImageUpload from '@/components/ImageUpload'
import LazyRichTextEditor from '@/components/LazyRichTextEditor'
import { Plus, Trash2 } from 'lucide-react'

interface FAQItem {
  id: string
  title: string
  description: string
  images: string[]
}

interface Props {
  faqs: FAQItem[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof FAQItem, value: any) => void
}

const FAQsSection: React.FC<Props> = ({ faqs, onAdd, onRemove, onUpdate }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          {t('admin.structuredArticle.faqs')}
        </h3>
      </div>

      {faqs.map((faq, index) => (
        <Card key={faq.id} className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-slate-800 dark:text-white">
              {t('admin.structuredArticle.faq')} {index + 1}
            </h4>
            <Button variant="outline" size="sm" onClick={() => onRemove(faq.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.structuredArticle.faqTitle')}
              </label>
              <Input
                value={faq.title}
                onChange={(e) => onUpdate(faq.id, 'title', e.target.value)}
                placeholder={t('admin.structuredArticle.faqTitlePlaceholder')}
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.structuredArticle.faqDescription')}
              </label>
              <LazyRichTextEditor
                value={faq.description}
                onChange={(val) => onUpdate(faq.id, 'description', val)}
                placeholder={t('admin.structuredArticle.faqDescriptionPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.structuredArticle.faqImages')}
              </label>
              <ImageUpload
                value={faq.images.join(',')}
                onChange={(val) => onUpdate(faq.id, 'images', val ? val.split(',') : [])}
                placeholder={t('admin.structuredArticle.uploadFaqImages')}
                imageType="structured-article"
              />
            </div>
          </div>
        </Card>
      ))}

      {/* 添加按钮在底部 */}
      {faqs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <p className="mb-4">{t('admin.structuredArticle.noFAQs')}</p>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addFAQ')}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addFAQ')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default FAQsSection

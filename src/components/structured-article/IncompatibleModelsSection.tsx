import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ImageUpload from '@/components/ImageUpload'
import LazyRichTextEditor from '@/components/LazyRichTextEditor'
import { Plus, Trash2 } from 'lucide-react'
import type { IncompatibleModel } from '@/types/structured-article'

interface Props {
  models: IncompatibleModel[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof IncompatibleModel, value: any) => void
}

const IncompatibleModelsSection: React.FC<Props> = ({ models, onAdd, onRemove, onUpdate }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          {t('admin.structuredArticle.incompatibleModels')}
        </h3>
      </div>

      {models.map((model, index) => (
        <Card key={model.id} className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-slate-800 dark:text-white">
              {t('admin.structuredArticle.incompatibleModel')} {index + 1}
            </h4>
            <Button variant="outline" size="sm" onClick={() => onRemove(model.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.structuredArticle.modelName')}
              </label>
              <Input
                value={model.name || ''}
                onChange={(e) => onUpdate(model.id, 'name', e.target.value)}
                placeholder={t('admin.structuredArticle.modelNamePlaceholder')}
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.structuredArticle.dashboardImage')}
              </label>
              <ImageUpload
                value={model.dashboardImage}
                onChange={(val) => onUpdate(model.id, 'dashboardImage', val)}
                placeholder={t('admin.structuredArticle.uploadDashboardImage')}
                imageType="structured-article"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('admin.structuredArticle.modelDescription')}
            </label>
            <LazyRichTextEditor
              value={model.description}
              onChange={(val) => onUpdate(model.id, 'description', val)}
              placeholder={t('admin.structuredArticle.modelDescriptionPlaceholder')}
            />
          </div>
        </Card>
      ))}

      {/* 添加按钮在底部 */}
      {models.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <p className="mb-4">{t('admin.structuredArticle.noIncompatibleModels')}</p>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addIncompatibleModel')}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addIncompatibleModel')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default IncompatibleModelsSection

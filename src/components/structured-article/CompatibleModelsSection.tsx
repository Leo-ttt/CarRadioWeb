import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ImageUpload from '@/components/ImageUpload'
import LazyRichTextEditor from '@/components/LazyRichTextEditor'
import { Plus, Trash2 } from 'lucide-react'
import type { CompatibleModel } from '@/types/structured-article'

interface Props {
  models: CompatibleModel[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, fieldPath: string, value: any) => void
}

const CompatibleModelsSection: React.FC<Props> = ({ models, onAdd, onRemove, onUpdate }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          {t('admin.structuredArticle.compatibleModels')}
        </h3>
      </div>

      {models.map((model, index) => (
        <Card key={model.id} className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-slate-800 dark:text-white">
              {t('admin.structuredArticle.compatibleModel')} {index + 1}
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('admin.structuredArticle.modelDescription')}
            </label>
            <LazyRichTextEditor
              value={model.description}
              onChange={(val) => onUpdate(model.id, 'description', val)}
              placeholder={t('admin.structuredArticle.modelDescriptionPlaceholder')}
            />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4">
            <h5 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              {t('admin.structuredArticle.originalHost')}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.structuredArticle.frontImage')}
                </label>
                <ImageUpload
                  value={model.originalHost.frontImage}
                  onChange={(val) => onUpdate(model.id, 'originalHost.frontImage', val)}
                  placeholder={t('admin.structuredArticle.uploadFrontImage')}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.structuredArticle.backImage')}
                </label>
                <ImageUpload
                  value={model.originalHost.backImage}
                  onChange={(val) => onUpdate(model.id, 'originalHost.backImage', val)}
                  placeholder={t('admin.structuredArticle.uploadBackImage')}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.structuredArticle.pinDefinitionImage')}
                </label>
                <ImageUpload
                  value={model.originalHost.pinDefinitionImage}
                  onChange={(val) => onUpdate(model.id, 'originalHost.pinDefinitionImage', val)}
                  placeholder={t('admin.structuredArticle.uploadPinDefinitionImage')}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.structuredArticle.partNumber')}
                </label>
                <Input
                  value={model.originalHost.partNumber || ''}
                  onChange={(e) => onUpdate(model.id, 'originalHost.partNumber', e.target.value)}
                  placeholder={t('admin.structuredArticle.partNumberPlaceholder')}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                {t('admin.structuredArticle.hostDescription')}
              </label>
              <LazyRichTextEditor
                value={model.originalHost.description}
                onChange={(val) => onUpdate(model.id, 'originalHost.description', val)}
                placeholder={t('admin.structuredArticle.hostDescriptionPlaceholder')}
              />
            </div>
            <div className="mt-4">
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                {t('admin.structuredArticle.wiringDiagram')}
              </label>
              <ImageUpload
                value={model.originalHost.wiringDiagram || ''}
                onChange={(val) => onUpdate(model.id, 'originalHost.wiringDiagram', val)}
                placeholder={t('admin.structuredArticle.uploadWiringDiagram')}
                imageType="structured-article"
              />
            </div>
          </div>

          {/* 可选模块 - 原车面板/原车屏 */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4">
            <h5 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              {t('admin.structuredArticle.optionalModules', '可选模块（原车面板/原车屏）')}
            </h5>

            {/* 空调面板 */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h6 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                {t('admin.structuredArticle.airConditioningPanel', '空调面板')}
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.panelImage', '面板图片')}
                  </label>
                  <ImageUpload
                    value={model.optionalModules?.airConditioningPanel?.image || ''}
                    onChange={(val) => onUpdate(model.id, 'optionalModules.airConditioningPanel.image', val)}
                    placeholder={t('admin.structuredArticle.uploadPanelImage', '上传空调面板图片')}
                    imageType="structured-article"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.interfaceImage', '接口图片')}
                  </label>
                  <ImageUpload
                    value={model.optionalModules?.airConditioningPanel?.interfaceImage || ''}
                    onChange={(val) => onUpdate(model.id, 'optionalModules.airConditioningPanel.interfaceImage', val)}
                    placeholder={t('admin.structuredArticle.uploadInterfaceImage', '上传接口图片')}
                    imageType="structured-article"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.partNumber', '零件号')}
                  </label>
                  <Input
                    value={model.optionalModules?.airConditioningPanel?.partNumber || ''}
                    onChange={(e) => onUpdate(model.id, 'optionalModules.airConditioningPanel.partNumber', e.target.value)}
                    placeholder={t('admin.structuredArticle.partNumberPlaceholder', '输入零件号')}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.moduleDescription', '说明')}
                  </label>
                  <Input
                    value={model.optionalModules?.airConditioningPanel?.description || ''}
                    onChange={(e) => onUpdate(model.id, 'optionalModules.airConditioningPanel.description', e.target.value)}
                    placeholder={t('admin.structuredArticle.moduleDescriptionPlaceholder', '输入说明')}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 显示屏背板（原车屏） */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h6 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                {t('admin.structuredArticle.displayBackPanel', '显示屏背板（原车屏）')}
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.panelImage', '面板图片')}
                  </label>
                  <ImageUpload
                    value={model.optionalModules?.displayBackPanel?.image || ''}
                    onChange={(val) => onUpdate(model.id, 'optionalModules.displayBackPanel.image', val)}
                    placeholder={t('admin.structuredArticle.uploadPanelImage', '上传原车屏图片')}
                    imageType="structured-article"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.interfaceImage', '接口图片')}
                  </label>
                  <ImageUpload
                    value={model.optionalModules?.displayBackPanel?.interfaceImage || ''}
                    onChange={(val) => onUpdate(model.id, 'optionalModules.displayBackPanel.interfaceImage', val)}
                    placeholder={t('admin.structuredArticle.uploadInterfaceImage', '上传接口图片')}
                    imageType="structured-article"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.partNumber', '零件号')}
                  </label>
                  <Input
                    value={model.optionalModules?.displayBackPanel?.partNumber || ''}
                    onChange={(e) => onUpdate(model.id, 'optionalModules.displayBackPanel.partNumber', e.target.value)}
                    placeholder={t('admin.structuredArticle.partNumberPlaceholder', '输入零件号')}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.moduleDescription', '说明')}
                  </label>
                  <Input
                    value={model.optionalModules?.displayBackPanel?.description || ''}
                    onChange={(e) => onUpdate(model.id, 'optionalModules.displayBackPanel.description', e.target.value)}
                    placeholder={t('admin.structuredArticle.moduleDescriptionPlaceholder', '输入说明')}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* 仪表盘面板（原车面板） */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h6 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                {t('admin.structuredArticle.dashboardPanel', '仪表盘面板（原车面板）')}
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.panelImage', '面板图片')}
                  </label>
                  <ImageUpload
                    value={model.optionalModules?.dashboardPanel?.image || ''}
                    onChange={(val) => onUpdate(model.id, 'optionalModules.dashboardPanel.image', val)}
                    placeholder={t('admin.structuredArticle.uploadPanelImage', '上传原车面板图片')}
                    imageType="structured-article"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.interfaceImage', '接口图片')}
                  </label>
                  <ImageUpload
                    value={model.optionalModules?.dashboardPanel?.interfaceImage || ''}
                    onChange={(val) => onUpdate(model.id, 'optionalModules.dashboardPanel.interfaceImage', val)}
                    placeholder={t('admin.structuredArticle.uploadInterfaceImage', '上传接口图片')}
                    imageType="structured-article"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.partNumber', '零件号')}
                  </label>
                  <Input
                    value={model.optionalModules?.dashboardPanel?.partNumber || ''}
                    onChange={(e) => onUpdate(model.id, 'optionalModules.dashboardPanel.partNumber', e.target.value)}
                    placeholder={t('admin.structuredArticle.partNumberPlaceholder', '输入零件号')}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.structuredArticle.moduleDescription', '说明')}
                  </label>
                  <Input
                    value={model.optionalModules?.dashboardPanel?.description || ''}
                    onChange={(e) => onUpdate(model.id, 'optionalModules.dashboardPanel.description', e.target.value)}
                    placeholder={t('admin.structuredArticle.moduleDescriptionPlaceholder', '输入说明')}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* 添加按钮在底部 */}
      {models.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <p className="mb-4">{t('admin.structuredArticle.noCompatibleModels')}</p>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addCompatibleModel')}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addCompatibleModel')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CompatibleModelsSection

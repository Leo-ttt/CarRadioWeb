import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import ImageUpload from '@/components/ImageUpload'
import {
  OriginalHost,
  OptionalModules
} from '@/types/structured-article'

interface VehicleInfoSectionProps {
  brand: string
  model: string
  yearRange: string
  vehicleImage: string
  introduction: string
  importantNotes: string
  originalHost: OriginalHost
  optionalModules: OptionalModules
  onUpdate: (field: string, value: any) => void
  onUpdateOriginalHost: (field: string, value: any) => void
  onUpdateOptionalModules: (module: string, field: string, value: any) => void
}

const VehicleInfoSection: React.FC<VehicleInfoSectionProps> = ({
  brand,
  model,
  yearRange,
  vehicleImage,
  introduction,
  importantNotes,
  originalHost,
  optionalModules,
  onUpdate,
  onUpdateOriginalHost,
  onUpdateOptionalModules
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.structuredArticle.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.brand')}
              </label>
              <Input
                value={brand}
                onChange={(e) => onUpdate('brand', e.target.value)}
                placeholder={t('admin.structuredArticle.brandPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.model')}
              </label>
              <Input
                value={model}
                onChange={(e) => onUpdate('model', e.target.value)}
                placeholder={t('admin.structuredArticle.modelPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.yearRange')}
              </label>
              <Input
                value={yearRange}
                onChange={(e) => onUpdate('yearRange', e.target.value)}
                placeholder={t('admin.structuredArticle.yearRangePlaceholder')}
              />
            </div>
          </div>

          {/* 车辆外观图 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.vehicleImage')}
            </label>
            <ImageUpload
              value={vehicleImage}
              onChange={(image) => onUpdate('vehicleImage', image)}
              imageType="hero"
              className="w-full"
            />
          </div>

          {/* 车型介绍 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.introduction')}
            </label>
            <textarea
              value={introduction}
              onChange={(e) => onUpdate('introduction', e.target.value)}
              placeholder={t('admin.structuredArticle.introductionPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 重要注意事项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.importantNotes')}
            </label>
            <textarea
              value={importantNotes}
              onChange={(e) => onUpdate('importantNotes', e.target.value)}
              placeholder={t('admin.structuredArticle.importantNotesPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 原车主机信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.structuredArticle.originalHost')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.frontImage')}
              </label>
              <ImageUpload
                value={originalHost.frontImage}
                onChange={(image) => onUpdateOriginalHost('frontImage', image)}
                imageType="structured-article"
              />
              <Input
                value={originalHost.frontImageDescription || ''}
                onChange={(e) => onUpdateOriginalHost('frontImageDescription', e.target.value)}
                placeholder={t('admin.structuredArticle.imageDescriptionPlaceholder')}
                className="mt-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.backImage')}
              </label>
              <ImageUpload
                value={originalHost.backImage}
                onChange={(image) => onUpdateOriginalHost('backImage', image)}
                imageType="structured-article"
              />
              <Input
                value={originalHost.backImageDescription || ''}
                onChange={(e) => onUpdateOriginalHost('backImageDescription', e.target.value)}
                placeholder={t('admin.structuredArticle.imageDescriptionPlaceholder')}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.pinDefinitionImage')}
            </label>
                          <ImageUpload
                value={originalHost.pinDefinitionImage}
                onChange={(image) => onUpdateOriginalHost('pinDefinitionImage', image)}
                imageType="structured-article"
              />
            <Input
              value={originalHost.pinDefinitionDescription || ''}
              onChange={(e) => onUpdateOriginalHost('pinDefinitionDescription', e.target.value)}
              placeholder={t('admin.structuredArticle.imageDescriptionPlaceholder')}
              className="mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.wiringDiagram')}
            </label>
            <ImageUpload
              value={originalHost.wiringDiagram || ''}
              onChange={(image) => onUpdateOriginalHost('wiringDiagram', image)}
              imageType="structured-article"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.description')}
            </label>
            <textarea
              value={originalHost.description}
              onChange={(e) => onUpdateOriginalHost('description', e.target.value)}
              placeholder={t('admin.structuredArticle.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 可选模块信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.structuredArticle.optionalModules')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 空调面板 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('admin.structuredArticle.airConditioningPanel')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.structuredArticle.image')}
                </label>
                <ImageUpload
                  value={optionalModules.airConditioningPanel.image}
                  onChange={(image) => onUpdateOptionalModules('airConditioningPanel', 'image', image)}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.structuredArticle.description')}
                </label>
                <textarea
                  value={optionalModules.airConditioningPanel.description}
                  onChange={(e) => onUpdateOptionalModules('airConditioningPanel', 'description', e.target.value)}
                  placeholder={t('admin.structuredArticle.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 显示屏背板 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('admin.structuredArticle.displayBackPanel')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.structuredArticle.image')}
                </label>
                <ImageUpload
                  value={optionalModules.displayBackPanel.image}
                  onChange={(image) => onUpdateOptionalModules('displayBackPanel', 'image', image)}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.structuredArticle.description')}
                </label>
                <textarea
                  value={optionalModules.displayBackPanel.description}
                  onChange={(e) => onUpdateOptionalModules('displayBackPanel', 'description', e.target.value)}
                  placeholder={t('admin.structuredArticle.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 仪表板面板 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('admin.structuredArticle.dashboardPanel')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.structuredArticle.image')}
                </label>
                <ImageUpload
                  value={optionalModules.dashboardPanel.image}
                  onChange={(image) => onUpdateOptionalModules('dashboardPanel', 'image', image)}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.structuredArticle.description')}
                </label>
                <textarea
                  value={optionalModules.dashboardPanel.description}
                  onChange={(e) => onUpdateOptionalModules('dashboardPanel', 'description', e.target.value)}
                  placeholder={t('admin.structuredArticle.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VehicleInfoSection

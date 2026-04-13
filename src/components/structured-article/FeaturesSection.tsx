import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ImageUpload from '@/components/ImageUpload'
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { SupportedFeature } from '@/types/structured-article'

interface FeaturesSectionProps {
  supportedFeatures: SupportedFeature[]
  unsupportedFeatures: SupportedFeature[]
  onUpdateSupportedFeatures: (features: SupportedFeature[]) => void
  onUpdateUnsupportedFeatures: (features: SupportedFeature[]) => void
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  supportedFeatures,
  unsupportedFeatures,
  onUpdateSupportedFeatures,
  onUpdateUnsupportedFeatures
}) => {
  const { t } = useTranslation()

  // 生成唯一ID
  const generateId = () => `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 添加支持功能
  const addSupportedFeature = () => {
    const newFeature: SupportedFeature = {
      id: generateId(),
      name: '',
      description: '',
      images: [],
      isSupported: true
    }
    onUpdateSupportedFeatures([...supportedFeatures, newFeature])
  }

  // 添加不支持功能
  const addUnsupportedFeature = () => {
    const newFeature: SupportedFeature = {
      id: generateId(),
      name: '',
      description: '',
      images: [],
      isSupported: false
    }
    onUpdateUnsupportedFeatures([...unsupportedFeatures, newFeature])
  }

  // 更新支持功能
  const updateSupportedFeature = (id: string, field: keyof SupportedFeature, value: any) => {
    const updatedFeatures = supportedFeatures.map(feature =>
      feature.id === id ? { ...feature, [field]: value } : feature
    )
    onUpdateSupportedFeatures(updatedFeatures)
  }

  // 更新不支持功能
  const updateUnsupportedFeature = (id: string, field: keyof SupportedFeature, value: any) => {
    const updatedFeatures = unsupportedFeatures.map(feature =>
      feature.id === id ? { ...feature, [field]: value } : feature
    )
    onUpdateUnsupportedFeatures(updatedFeatures)
  }

  // 删除支持功能
  const removeSupportedFeature = (id: string) => {
    const updatedFeatures = supportedFeatures.filter(feature => feature.id !== id)
    onUpdateSupportedFeatures(updatedFeatures)
  }

  // 删除不支持功能
  const removeUnsupportedFeature = (id: string) => {
    const updatedFeatures = unsupportedFeatures.filter(feature => feature.id !== id)
    onUpdateUnsupportedFeatures(updatedFeatures)
  }

  // 添加图片到功能
  const addImageToFeature = (featureId: string, isSupported: boolean, image: string) => {
    if (isSupported) {
      updateSupportedFeature(featureId, 'images', [
        ...supportedFeatures.find(f => f.id === featureId)?.images || [],
        image
      ])
    } else {
      updateUnsupportedFeature(featureId, 'images', [
        ...unsupportedFeatures.find(f => f.id === featureId)?.images || [],
        image
      ])
    }
  }

  // 删除功能图片
  const removeImageFromFeature = (featureId: string, isSupported: boolean, imageIndex: number) => {
    if (isSupported) {
      const feature = supportedFeatures.find(f => f.id === featureId)
      if (feature) {
        const updatedImages = feature.images.filter((_, index) => index !== imageIndex)
        updateSupportedFeature(featureId, 'images', updatedImages)
      }
    } else {
      const feature = unsupportedFeatures.find(f => f.id === featureId)
      if (feature) {
        const updatedImages = feature.images.filter((_, index) => index !== imageIndex)
        updateUnsupportedFeature(featureId, 'images', updatedImages)
      }
    }
  }

  // 渲染功能项
  const renderFeatureItem = (
    feature: SupportedFeature,
    isSupported: boolean,
    onUpdate: (id: string, field: keyof SupportedFeature, value: any) => void,
    onRemove: (id: string) => void
  ) => (
    <div key={feature.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isSupported ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <h4 className="font-medium text-gray-900">
            {isSupported ? t('admin.structuredArticle.supportedFeature') : t('admin.structuredArticle.unsupportedFeature')}
          </h4>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(feature.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.structuredArticle.featureName')}
          </label>
          <Input
            value={feature.name}
            onChange={(e) => onUpdate(feature.id, 'name', e.target.value)}
            placeholder={t('admin.structuredArticle.featureNamePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.structuredArticle.description')}
          </label>
          <Input
            value={feature.description}
            onChange={(e) => onUpdate(feature.id, 'description', e.target.value)}
            placeholder={t('admin.structuredArticle.descriptionPlaceholder')}
          />
        </div>
      </div>

      {/* 功能图片 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('admin.structuredArticle.featureImages')}
        </label>

        {/* 添加新图片 */}
        <div className="mb-3">
          <ImageUpload
            value=""
            onChange={(image) => addImageToFeature(feature.id, isSupported, image)}
            imageType="structured-article"
            className="w-full"
          />
        </div>

        {/* 显示已有图片 */}
        {feature.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {feature.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`${feature.name} ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImageFromFeature(feature.id, isSupported, index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 支持功能 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t('admin.structuredArticle.supportedFeatures')}</span>
            </span>
            <Button
              onClick={addSupportedFeature}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('admin.structuredArticle.addFeature')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supportedFeatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.structuredArticle.noSupportedFeatures')}</p>
            </div>
          ) : (
            supportedFeatures.map(feature =>
              renderFeatureItem(
                feature,
                true,
                updateSupportedFeature,
                removeSupportedFeature
              )
            )
          )}
        </CardContent>
      </Card>

      {/* 不支持功能 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{t('admin.structuredArticle.unsupportedFeatures')}</span>
            </span>
            <Button
              onClick={addUnsupportedFeature}
              size="sm"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('admin.structuredArticle.addFeature')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unsupportedFeatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.structuredArticle.noUnsupportedFeatures')}</p>
            </div>
          ) : (
            unsupportedFeatures.map(feature =>
              renderFeatureItem(
                feature,
                false,
                updateUnsupportedFeature,
                removeUnsupportedFeature
              )
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FeaturesSection

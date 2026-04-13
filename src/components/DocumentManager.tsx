import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
// Badge组件暂时用简单的span替代
import { Edit, Trash2, Eye, ChevronDown, ChevronRight } from 'lucide-react'

// 文档基础接口
interface BaseDocument {
  _id?: string
  id?: string | number
  title: string
  status: string
  author?: string
  summary?: string
  videoUrl?: string
  createdAt: string | Date
  updatedAt?: string | Date
  vehicleId?: string | number
}

// 车型接口
interface VehicleInfo {
  _id?: string
  id?: string | number
  brand: string
  model: string
}

interface DocumentManagerProps {
  documents: BaseDocument[]
  documentType: 'general' | 'video' | 'structured'
  onEditDocument: (doc: BaseDocument) => void
  onDeleteDocument: (id: number | string) => void
  onPreviewDocument: (doc: BaseDocument) => void
  vehicles?: VehicleInfo[]
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  documentType,
  onEditDocument,
  onDeleteDocument,
  onPreviewDocument,
  vehicles = []
}) => {
  const { t } = useTranslation()
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())

  // 切换品牌展开状态
  const toggleBrand = (brand: string) => {
    const newExpanded = new Set(expandedBrands)
    if (newExpanded.has(brand)) {
      newExpanded.delete(brand)
    } else {
      newExpanded.add(brand)
    }
    setExpandedBrands(newExpanded)
  }

  // 切换车型展开状态
  const toggleModel = (modelKey: string) => {
    const newExpanded = new Set(expandedModels)
    if (newExpanded.has(modelKey)) {
      newExpanded.delete(modelKey)
    } else {
      newExpanded.add(modelKey)
    }
    setExpandedModels(newExpanded)
  }

  // 获取文档状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  // 渲染文档操作按钮
  const renderDocumentActions = (doc: BaseDocument) => (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={() => onPreviewDocument(doc)}>
        <Eye className="h-3 w-3 mr-1" />
        {t('common.preview')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => onEditDocument(doc)}>
        <Edit className="h-3 w-3 mr-1" />
        {t('common.edit')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => {
        const docId = doc._id || doc.id;
        if (docId) onDeleteDocument(docId);
      }}>
        <Trash2 className="h-3 w-3 mr-1" />
        {t('common.delete')}
      </Button>
    </div>
  )

  // 渲染单个文档卡片
  const renderDocumentCard = (doc: BaseDocument) => (
    <Card key={doc._id || doc.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                {t(`articles.${doc.status}`)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {t('knowledge.author')}: {doc.author || t('knowledge.technicalTeam')}
            </p>
            {doc.summary && (
              <p className="text-sm text-gray-700 mb-3">{doc.summary}</p>
            )}
            {documentType === 'video' && doc.videoUrl && (
              <p className="text-sm text-blue-600 mb-2">
                {t('admin.video.videoLink')}: {doc.videoUrl}
              </p>
            )}
            <div className="text-xs text-gray-500">
              {t('knowledge.createdAt')}: {new Date(doc.createdAt).toLocaleDateString()}
              {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                <span className="ml-2">
                  {t('knowledge.updatedAt')}: {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="ml-4">
            {renderDocumentActions(doc)}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // 结构化文章需要按车型分组显示
  if (documentType === 'structured') {
    if (documents.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>{t('admin.structuredArticle.noArticles')}</p>
        </div>
      )
    }

    // 按品牌和车型分组
    const groupedVehicles = vehicles.reduce((acc: Record<string, Record<string, VehicleInfo[]>>, vehicle: VehicleInfo) => {
      if (!acc[vehicle.brand]) {
        acc[vehicle.brand] = {}
      }
      if (!acc[vehicle.brand][vehicle.model]) {
        acc[vehicle.brand][vehicle.model] = []
      }
      acc[vehicle.brand][vehicle.model].push(vehicle)
      return acc
    }, {})

    return (
      <div className="space-y-4">
        {Object.entries(groupedVehicles).map(([brand, models]) => (
          <div key={brand} className="border rounded-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleBrand(brand)}
            >
              <h3 className="text-lg font-semibold text-gray-900">{brand}</h3>
              {expandedBrands.has(brand) ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {expandedBrands.has(brand) && (
              <div className="border-t">
                {Object.entries(models).map(([model, modelVehicles]) => {
                  const modelKey = `${brand}-${model}`
                  const modelDocs = documents.filter((doc: BaseDocument) =>
                    modelVehicles.some((v: VehicleInfo) => v._id === doc.vehicleId || v.id === doc.vehicleId)
                  )

                  return (
                    <div key={modelKey} className="border-b last:border-b-0">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleModel(modelKey)}
                      >
                        <h4 className="font-medium text-gray-800">{model}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {modelDocs.length} {t('admin.documents.articles')}
                          </span>
                          {expandedModels.has(modelKey) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {expandedModels.has(modelKey) && (
                        <div className="p-3 bg-gray-50">
                          {modelDocs.length > 0 ? (
                            modelDocs.map((doc: BaseDocument) => renderDocumentCard(doc))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              {t('admin.structuredArticle.noArticlesForModel')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // 通用文档和视频教程的简单列表显示
  if (documents.length === 0) {
    const emptyMessage = documentType === 'video'
      ? t('admin.video.noVideos')
      : t('admin.documents.noDocuments')

    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc: BaseDocument) => renderDocumentCard(doc))}
    </div>
  )
}

export default DocumentManager

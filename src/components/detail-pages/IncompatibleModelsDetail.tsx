import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, XCircle, Image, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface IncompatibleModelsDetailProps {
  document: any
  onBack: () => void
  onImageClick?: (imageUrl: string, altText: string) => void
}

const IncompatibleModelsDetail: React.FC<IncompatibleModelsDetailProps> = ({
  document,
  onBack,
  onImageClick
}) => {
  const { t } = useTranslation()
  const [expandedModels, setExpandedModels] = useState<Set<number>>(new Set())

  const incompatibleModels = document.incompatibleModels || []

  const toggleModel = (index: number) => {
    const newExpanded = new Set(expandedModels)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModels(newExpanded)
  }

  const expandAll = () => {
    setExpandedModels(new Set(incompatibleModels.map((_: any, index: number) => index)))
  }

  const collapseAll = () => {
    setExpandedModels(new Set())
  }

  return (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <Button
        onClick={onBack}
        variant="outline"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('knowledge.cardSections.backToOverview')}
      </Button>

      {/* 警告提示 */}
      <Card className="bg-red-900/20 border-red-800/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">
              {t('knowledge.incompatibleWarning')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      {incompatibleModels.length > 0 && (
        <div className="flex gap-2 justify-end">
          <Button
            onClick={expandAll}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {t('knowledge.expandAll')}
          </Button>
          <Button
            onClick={collapseAll}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {t('knowledge.collapseAll')}
          </Button>
        </div>
      )}

      {incompatibleModels.length > 0 ? (
        <div className="space-y-4">
          {incompatibleModels.map((model: any, index: number) => {
            const isExpanded = expandedModels.has(index)

            return (
              <Card
                key={index}
                className="bg-red-900/20 border-red-800/50 backdrop-blur-sm overflow-hidden"
              >
                {/* 型号头部 */}
                <button
                  onClick={() => toggleModel(index)}
                  className="w-full p-4 text-left hover:bg-red-900/30 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {model.dashboardImage && (
                        <img
                          src={model.dashboardImage}
                          alt={model.modelName || model.name}
                          className="w-12 h-12 object-cover rounded-lg border border-red-800/50"
                        />
                      )}
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                        <XCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-red-100 text-left">
                          {model.modelName || model.name}
                        </h3>
                        <span className="text-red-300 text-xs">
                          {t('knowledge.incompatibleModel')} {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-red-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* 型号详细内容 */}
                {isExpanded && (
                  <CardContent className="px-4 pb-4 border-t border-red-800/50">
                    {/* 仪表板图片 */}
                    {model.dashboardImage && (
                      <div className="mb-4 mt-4">
                        <h4 className="text-red-200 text-sm font-medium mb-2 flex items-center">
                          <Image className="h-4 w-4 mr-2" />
                          {t('knowledge.dashboardInteriorView')}
                        </h4>
                        <img
                          src={model.dashboardImage}
                          alt={`${model.modelName || model.name} ${t('knowledge.dashboardInteriorView')}`}
                          className="w-full rounded-lg shadow-md border border-red-800/50 cursor-pointer hover:scale-[1.02] transition-transform"
                          onClick={() => onImageClick?.(model.dashboardImage, t('knowledge.dashboardInteriorView'))}
                        />
                      </div>
                    )}

                    {/* 描述信息 */}
                    {model.description && (
                      <div className="mb-4">
                        <h4 className="text-red-200 text-sm font-medium mb-2">
                          {t('knowledge.description')}
                        </h4>
                        <p className="text-red-200 bg-red-900/20 p-3 rounded-lg text-sm border border-red-800/30">
                          {model.description}
                        </p>
                      </div>
                    )}

                    {/* 不兼容原因 */}
                    {model.reason && (
                      <div className="mb-4">
                        <h4 className="text-red-200 text-sm font-medium mb-2">
                          不兼容原因
                        </h4>
                        <p className="text-red-300 bg-red-900/30 p-3 rounded-lg text-sm border border-red-800/50">
                          {model.reason}
                        </p>
                      </div>
                    )}

                    {/* 替代建议 */}
                    {model.alternative && (
                      <div>
                        <h4 className="text-red-200 text-sm font-medium mb-2">
                          替代建议
                        </h4>
                        <p className="text-red-200 bg-green-900/20 p-3 rounded-lg text-sm border border-green-800/50">
                          {model.alternative}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <XCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {t('knowledge.noIncompatibleModels')}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {t('knowledge.noIncompatibleModelsMessage')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default IncompatibleModelsDetail

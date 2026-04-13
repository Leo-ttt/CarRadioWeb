import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Car, ChevronRight, ChevronDown, Image as ImageIcon } from 'lucide-react'
import { TabView, TabPanel } from 'primereact/tabview'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface CompatibleModelsDetailProps {
  document: any
  onBack: () => void
  onImageClick?: (imageUrl: string, altText: string) => void
}

const CompatibleModelsDetail: React.FC<CompatibleModelsDetailProps> = ({
  document,
  onBack,
  onImageClick
}) => {
  const { t } = useTranslation()
  const [expandedModels, setExpandedModels] = useState<Set<number>>(new Set())

  const compatibleModels = document.compatibleModels || []

  const toggleModel = (index: number) => {
    const newExpanded = new Set(expandedModels)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModels(newExpanded)
  }

  // 检查是否有 Optional Modules
  const hasOptionalModules = (model: any) => {
    return !!(
      model.optionalModules?.airConditioningPanel?.image ||
      model.optionalModules?.displayBackPanel?.image ||
      model.optionalModules?.dashboardPanel?.image
    )
  }

  const expandAll = () => {
    setExpandedModels(new Set(compatibleModels.map((_: any, index: number) => index)))
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

      {/* 操作按钮 */}
      {compatibleModels.length > 0 && (
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

      {compatibleModels.length > 0 ? (
        <div className="space-y-4">
          {compatibleModels.map((model: any, index: number) => {
            const isExpanded = expandedModels.has(index)

            return (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm overflow-hidden"
              >
                {/* 型号头部 */}
                <button
                  onClick={() => toggleModel(index)}
                  className="w-full p-4 text-left hover:bg-gray-700/30 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {model.dashboardImage && (
                        <img
                          src={model.dashboardImage}
                          alt={model.modelName || model.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white text-left">
                          {model.modelName || model.name}
                        </h3>
                        {model.originalHost?.partNumber && (
                          <span className="text-gray-400 text-xs font-mono">
                            {t('knowledge.partNumber')}: {model.originalHost.partNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* 型号详细内容 */}
                {isExpanded && (
                  <CardContent className="px-4 pb-4 border-t border-gray-700/50">
                    {/* 描述 */}
                    {model.description && (
                      <div className="mb-4 mt-4 text-gray-300 bg-gray-700/30 p-3 rounded-lg text-sm">
                        {model.description}
                      </div>
                    )}

                    {/* 使用 PrimeReact TabView */}
                    <TabView className="compatible-model-tabs">
                      {/* Dashboard 标签 */}
                      <TabPanel header={t('knowledge.dashboard')}>
                        {model.dashboardImage ? (
                          <div>
                            <h4 className="text-white text-sm font-medium mb-2 flex items-center">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              {t('knowledge.dashboardImage')}
                            </h4>
                            <img
                              src={model.dashboardImage}
                              alt="Dashboard"
                              className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-700/50"
                              onClick={() => onImageClick?.(model.dashboardImage, 'Dashboard')}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-sm">
                            {t('common.noData')}
                          </div>
                        )}
                      </TabPanel>

                      {/* Original Host 标签 */}
                      <TabPanel header={t('knowledge.originalHost')}>
                        {(model.originalHost?.frontImage || model.originalHost?.backImage ||
                          model.originalHost?.pinDefinitionImage || model.originalHost?.wiringDiagram) ? (
                          <div className="space-y-4">
                            {model.originalHost?.frontImage && (
                              <div>
                                <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.hostFront')}</h4>
                                <img
                                  src={model.originalHost.frontImage}
                                  alt="Host Front"
                                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-700/50"
                                  onClick={() => onImageClick?.(model.originalHost.frontImage, 'Host Front')}
                                />
                                {model.originalHost.frontImageDescription && (
                                  <p className="text-gray-400 text-xs mt-2">{model.originalHost.frontImageDescription}</p>
                                )}
                              </div>
                            )}

                            {model.originalHost?.backImage && (
                              <div>
                                <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.hostBack')}</h4>
                                <img
                                  src={model.originalHost.backImage}
                                  alt="Host Back"
                                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-700/50"
                                  onClick={() => onImageClick?.(model.originalHost.backImage, 'Host Back')}
                                />
                                {model.originalHost.backImageDescription && (
                                  <p className="text-gray-400 text-xs mt-2">{model.originalHost.backImageDescription}</p>
                                )}
                              </div>
                            )}

                            {model.originalHost?.pinDefinitionImage && (
                              <div>
                                <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.pinDefinition')}</h4>
                                <img
                                  src={model.originalHost.pinDefinitionImage}
                                  alt="Pin Definition"
                                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-700/50"
                                  onClick={() => onImageClick?.(model.originalHost.pinDefinitionImage, 'Pin Definition')}
                                />
                                {model.originalHost.pinDefinitionDescription && (
                                  <p className="text-gray-400 text-xs mt-2">{model.originalHost.pinDefinitionDescription}</p>
                                )}
                              </div>
                            )}

                            {model.originalHost?.wiringDiagram && (
                              <div>
                                <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.wiringDiagram')}</h4>
                                <img
                                  src={model.originalHost.wiringDiagram}
                                  alt="Wiring Diagram"
                                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-700/50"
                                  onClick={() => onImageClick?.(model.originalHost.wiringDiagram, 'Wiring Diagram')}
                                />
                              </div>
                            )}

                            {model.originalHost?.description && (
                              <div className="bg-gray-700/30 rounded-lg p-3">
                                <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.installationNotes')}</h4>
                                <p className="text-gray-300 text-sm">{model.originalHost.description}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-sm">
                            {t('common.noData')}
                          </div>
                        )}
                      </TabPanel>

                      {/* Optional Modules 标签 */}
                      {hasOptionalModules(model) && (
                        <TabPanel header={t('knowledge.optionalModules')}>
                          {(model.optionalModules?.airConditioningPanel?.image ||
                            model.optionalModules?.displayBackPanel?.image ||
                            model.optionalModules?.dashboardPanel?.image) ? (
                            <div className="space-y-3">
                              {model.optionalModules?.airConditioningPanel?.image && (
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                  <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.airConditioningPanel')}</h4>
                                  <img
                                    src={model.optionalModules.airConditioningPanel.image}
                                    alt="Air Conditioning Panel"
                                    className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-2 border border-gray-700/50"
                                    onClick={() => onImageClick?.(model.optionalModules.airConditioningPanel.image, 'Air Conditioning Panel')}
                                  />
                                  {model.optionalModules.airConditioningPanel.partNumber && (
                                    <p className="text-gray-400 text-xs">
                                      {t('knowledge.partNumber')}: {model.optionalModules.airConditioningPanel.partNumber}
                                    </p>
                                  )}
                                  {model.optionalModules.airConditioningPanel.description && (
                                    <p className="text-gray-300 text-sm mt-2">{model.optionalModules.airConditioningPanel.description}</p>
                                  )}
                                </div>
                              )}

                              {model.optionalModules?.displayBackPanel?.image && (
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                  <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.displayBackPanel')}</h4>
                                  <img
                                    src={model.optionalModules.displayBackPanel.image}
                                    alt="Display Back Panel"
                                    className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-2 border border-gray-700/50"
                                    onClick={() => onImageClick?.(model.optionalModules.displayBackPanel.image, 'Display Back Panel')}
                                  />
                                  {model.optionalModules.displayBackPanel.partNumber && (
                                    <p className="text-gray-400 text-xs">
                                      {t('knowledge.partNumber')}: {model.optionalModules.displayBackPanel.partNumber}
                                    </p>
                                  )}
                                  {model.optionalModules.displayBackPanel.description && (
                                    <p className="text-gray-300 text-sm mt-2">{model.optionalModules.displayBackPanel.description}</p>
                                  )}
                                </div>
                              )}

                              {model.optionalModules?.dashboardPanel?.image && (
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                  <h4 className="text-white text-sm font-medium mb-2">{t('knowledge.dashboardPanel')}</h4>
                                  <img
                                    src={model.optionalModules.dashboardPanel.image}
                                    alt="Dashboard Panel"
                                    className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-2 border border-gray-700/50"
                                    onClick={() => onImageClick?.(model.optionalModules.dashboardPanel.image, 'Dashboard Panel')}
                                  />
                                  {model.optionalModules.dashboardPanel.partNumber && (
                                    <p className="text-gray-400 text-xs">
                                      {t('knowledge.partNumber')}: {model.optionalModules.dashboardPanel.partNumber}
                                    </p>
                                  )}
                                  {model.optionalModules.dashboardPanel.description && (
                                    <p className="text-gray-300 text-sm mt-2">{model.optionalModules.dashboardPanel.description}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">
                              {t('knowledge.noOptionalModules')}
                            </div>
                          )}
                        </TabPanel>
                      )}
                    </TabView>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <Car className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {t('knowledge.noCompatibleModels')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CompatibleModelsDetail

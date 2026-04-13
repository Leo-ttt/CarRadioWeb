import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface CompatibleModelModalProps {
  isOpen: boolean
  onClose: () => void
  model: any
  onImageClick?: (imageUrl: string, altText: string) => void
}

const CompatibleModelModal: React.FC<CompatibleModelModalProps> = ({
  isOpen,
  onClose,
  model,
  onImageClick
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'host' | 'modules'>('dashboard')

  // 处理ESC键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !model) {return null}

  const tabs = [
    { id: 'dashboard', label: t('knowledge.dashboard') || 'Dashboard' },
    { id: 'host', label: t('knowledge.originalHost') || 'Original Host' },
    { id: 'modules', label: t('knowledge.optionalModules') || 'Optional Modules' }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div
          className="relative w-full max-w-6xl bg-gray-800 rounded-lg shadow-xl transform transition-all my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - 固定在顶部 */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-20 rounded-t-lg">
            <div>
              <h2 className="text-2xl font-bold text-white">{model.name || model.modelName}</h2>
              {model.originalHost?.partNumber && (
                <p className="text-gray-400 mt-1">
                  {t('knowledge.partNumber')}: {model.originalHost.partNumber}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Description */}
          {model.description && (
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
              <p className="text-gray-300">{model.description}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-700 bg-gray-800/50 sticky top-[88px] z-10">
            <div className="flex space-x-1 px-4 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content - 可滚动区域 */}
          <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">{activeTab === 'dashboard' && (
              <div className="space-y-4">
                {model.dashboardImage && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      {t('knowledge.dashboardImage')}
                    </h3>
                    <img
                      src={model.dashboardImage}
                      alt="Dashboard"
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onImageClick?.(model.dashboardImage, 'Dashboard')}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'host' && (
              <div className="space-y-6">
                {/* Front Image */}
                {model.originalHost?.frontImage && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      {t('knowledge.hostFront')}
                    </h3>
                    <img
                      src={model.originalHost.frontImage}
                      alt="Host Front"
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onImageClick?.(model.originalHost.frontImage, 'Host Front')}
                    />
                    {model.originalHost.frontImageDescription && (
                      <p className="text-gray-400 text-sm mt-2">
                        {model.originalHost.frontImageDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Back Image */}
                {model.originalHost?.backImage && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      {t('knowledge.hostBack')}
                    </h3>
                    <img
                      src={model.originalHost.backImage}
                      alt="Host Back"
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onImageClick?.(model.originalHost.backImage, 'Host Back')}
                    />
                    {model.originalHost.backImageDescription && (
                      <p className="text-gray-400 text-sm mt-2">
                        {model.originalHost.backImageDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Pin Definition */}
                {model.originalHost?.pinDefinitionImage && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      {t('knowledge.pinDefinition')}
                    </h3>
                    <img
                      src={model.originalHost.pinDefinitionImage}
                      alt="Pin Definition"
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onImageClick?.(model.originalHost.pinDefinitionImage, 'Pin Definition')}
                    />
                    {model.originalHost.pinDefinitionDescription && (
                      <p className="text-gray-400 text-sm mt-2">
                        {model.originalHost.pinDefinitionDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Wiring Diagram */}
                {model.originalHost?.wiringDiagram && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      {t('knowledge.wiringDiagram')}
                    </h3>
                    <img
                      src={model.originalHost.wiringDiagram}
                      alt="Wiring Diagram"
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onImageClick?.(model.originalHost.wiringDiagram, 'Wiring Diagram')}
                    />
                  </div>
                )}

                {/* Host Description */}
                {model.originalHost?.description && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-2">
                      {t('knowledge.installationNotes')}
                    </h3>
                    <p className="text-gray-300">{model.originalHost.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'modules' && (
              <div className="space-y-6">
                {/* Air Conditioning Panel */}
                {model.optionalModules?.airConditioningPanel?.image && (
                  <Card className="bg-gray-700/50">
                    <CardContent className="p-4">
                      <h3 className="text-white font-semibold mb-3">
                        {t('knowledge.airConditioningPanel')}
                      </h3>
                      <img
                        src={model.optionalModules.airConditioningPanel.image}
                        alt="Air Conditioning Panel"
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-3"
                        onClick={() => onImageClick?.(model.optionalModules.airConditioningPanel.image, 'Air Conditioning Panel')}
                      />
                      {model.optionalModules.airConditioningPanel.partNumber && (
                        <p className="text-gray-400 text-sm">
                          {t('knowledge.partNumber')}: {model.optionalModules.airConditioningPanel.partNumber}
                        </p>
                      )}
                      {model.optionalModules.airConditioningPanel.description && (
                        <p className="text-gray-300 mt-2">
                          {model.optionalModules.airConditioningPanel.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Display Back Panel */}
                {model.optionalModules?.displayBackPanel?.image && (
                  <Card className="bg-gray-700/50">
                    <CardContent className="p-4">
                      <h3 className="text-white font-semibold mb-3">
                        {t('knowledge.displayBackPanel')}
                      </h3>
                      <img
                        src={model.optionalModules.displayBackPanel.image}
                        alt="Display Back Panel"
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-3"
                        onClick={() => onImageClick?.(model.optionalModules.displayBackPanel.image, 'Display Back Panel')}
                      />
                      {model.optionalModules.displayBackPanel.partNumber && (
                        <p className="text-gray-400 text-sm">
                          {t('knowledge.partNumber')}: {model.optionalModules.displayBackPanel.partNumber}
                        </p>
                      )}
                      {model.optionalModules.displayBackPanel.description && (
                        <p className="text-gray-300 mt-2">
                          {model.optionalModules.displayBackPanel.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Dashboard Panel */}
                {model.optionalModules?.dashboardPanel?.image && (
                  <Card className="bg-gray-700/50">
                    <CardContent className="p-4">
                      <h3 className="text-white font-semibold mb-3">
                        {t('knowledge.dashboardPanel')}
                      </h3>
                      <img
                        src={model.optionalModules.dashboardPanel.image}
                        alt="Dashboard Panel"
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-3"
                        onClick={() => onImageClick?.(model.optionalModules.dashboardPanel.image, 'Dashboard Panel')}
                      />
                      {model.optionalModules.dashboardPanel.partNumber && (
                        <p className="text-gray-400 text-sm">
                          {t('knowledge.partNumber')}: {model.optionalModules.dashboardPanel.partNumber}
                        </p>
                      )}
                      {model.optionalModules.dashboardPanel.description && (
                        <p className="text-gray-300 mt-2">
                          {model.optionalModules.dashboardPanel.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {!model.optionalModules?.airConditioningPanel?.image &&
                 !model.optionalModules?.displayBackPanel?.image &&
                 !model.optionalModules?.dashboardPanel?.image && (
                  <div className="text-center py-8 text-gray-400">
                    {t('knowledge.noOptionalModules')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompatibleModelModal

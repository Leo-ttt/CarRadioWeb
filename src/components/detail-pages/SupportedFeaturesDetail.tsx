import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SupportedFeaturesDetailProps {
  document: any
  onBack: () => void
}

const SupportedFeaturesDetail: React.FC<SupportedFeaturesDetailProps> = ({
  document,
  onBack
}) => {
  const { t } = useTranslation()

  // 确保功能数组是字符串数组，处理可能的对象结构
  const supportedFeatures = (document.supportedFeatures || document.features?.supported || [])
    .map((feature: any) => typeof feature === 'string' ? feature : feature?.name || feature?.title || String(feature))
    .filter((feature: string) => feature && feature.trim())

  const unsupportedFeatures = (document.unsupportedFeatures || document.features?.unsupported || [])
    .map((feature: any) => typeof feature === 'string' ? feature : feature?.name || feature?.title || String(feature))
    .filter((feature: string) => feature && feature.trim())

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('knowledge.cardSections.backToOverview')}
        </Button>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('knowledge.cardSections.supportedFeatures')}
          </h1>
          <p className="text-gray-300">
            {t('knowledge.cardSections.supportedFeaturesDesc')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 支持的功能 */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-400" />
                {t('knowledge.supportedFeatures')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supportedFeatures.length > 0 ? (
                <div className="space-y-2">
                  {supportedFeatures.map((feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center p-3 rounded-lg bg-green-900/20 border border-green-800/50"
                    >
                      <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-green-100">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {t('knowledge.noSupportedFeatures')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 不支持的功能 */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <X className="h-5 w-5 mr-2 text-red-400" />
                {t('knowledge.unsupportedFeatures')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unsupportedFeatures.length > 0 ? (
                <div className="space-y-2">
                  {unsupportedFeatures.map((feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center p-3 rounded-lg bg-red-900/20 border border-red-800/50"
                    >
                      <X className="h-4 w-4 text-red-400 mr-3 flex-shrink-0" />
                      <span className="text-red-100">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {t('knowledge.noUnsupportedFeatures')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 统计信息 */}
        <Card className="mt-6 bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">{t('knowledge.featuresStatistics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-900/20 border border-green-800/50">
                <div className="text-2xl font-bold text-green-400">
                  {supportedFeatures.length}
                </div>
                <div className="text-green-200 text-sm">{t('knowledge.supportedFeaturesUnit')}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-900/20 border border-red-800/50">
                <div className="text-2xl font-bold text-red-400">
                  {unsupportedFeatures.length}
                </div>
                <div className="text-red-200 text-sm">{t('knowledge.unsupportedFeaturesUnit')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SupportedFeaturesDetail

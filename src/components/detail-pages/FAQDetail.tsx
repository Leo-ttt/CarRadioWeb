import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, HelpCircle, ChevronRight, ChevronDown, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

interface FAQDetailProps {
  document: any
  onBack: () => void
  onImageClick?: (imageUrl: string, altText: string) => void
}

const FAQDetail: React.FC<FAQDetailProps> = ({
  document,
  onBack,
  onImageClick
}) => {
  const { t } = useTranslation()
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set())

  const faqs = document.faqs || []

  const toggleFAQ = (index: number) => {
    const newExpanded = new Set(expandedFAQs)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedFAQs(newExpanded)
  }

  const expandAll = () => {
    setExpandedFAQs(new Set(faqs.map((_: any, index: number) => index)))
  }

  const collapseAll = () => {
    setExpandedFAQs(new Set())
  }

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

        {/* 页面标题和操作 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('knowledge.cardSections.faqs')}
            </h1>
            <p className="text-gray-300">
              {t('knowledge.cardSections.faqsDesc')}
            </p>
          </div>
          {faqs.length > 0 && (
            <div className="flex gap-2">
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
        </div>

        {faqs.length > 0 ? (
          <div className="space-y-4">
            {faqs.map((faq: any, index: number) => {
              const isExpanded = expandedFAQs.has(index)
              return (
                <Card
                  key={index}
                  className="bg-white/10 border-white/20 backdrop-blur-sm overflow-hidden"
                >
                  {/* FAQ头部 */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white text-left">
                            {faq.title}
                          </h3>
                          <span className="text-gray-400 text-sm">
                            FAQ #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          {isExpanded ? t('knowledge.collapseAnswer') : t('knowledge.viewAnswer')}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* FAQ内容 */}
                  {isExpanded && (
                    <CardContent className="px-6 pb-6">
                      {/* 答案 */}
                      <div className="mb-6">
                        <h4 className="text-white font-medium mb-3">
                          {t('knowledge.solution')}
                        </h4>
                        <div
                          className="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10"
                          dangerouslySetInnerHTML={sanitizeHTMLForReact(faq.description)}
                        />
                      </div>

                      {/* 相关图片 */}
                      {faq.images && faq.images.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-white font-medium mb-3 flex items-center">
                            <Image className="h-4 w-4 mr-2" />
                            {t('knowledge.relatedImages')}
                          </h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            {faq.images.map((image: string, imgIndex: number) => (
                              <div key={imgIndex} className="group">
                                <img
                                  src={image}
                                  alt={`FAQ ${index + 1} - Image ${imgIndex + 1}`}
                                  className="w-full rounded-lg shadow-md border border-white/20 group-hover:border-white/40 transition-colors cursor-pointer hover:scale-[1.02] transition-transform"
                                  onClick={() => onImageClick?.(image, `FAQ ${index + 1} - ${t('knowledge.relatedImages')} ${imgIndex + 1}`)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 涉及型号功能已移除，因为FAQ本身就是针对当前车型的 */}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {t('knowledge.noFAQs')}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {t('knowledge.noFAQsMessage')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 统计信息 */}
        {faqs.length > 0 && (
          <Card className="mt-8 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">{t('knowledge.faqStatistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-900/20 border border-blue-800/50">
                  <div className="text-2xl font-bold text-blue-400">
                    {faqs.length}
                  </div>
                  <div className="text-blue-200 text-sm">{t('knowledge.questionsUnit')}</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-900/20 border border-green-800/50">
                  <div className="text-2xl font-bold text-green-400">
                    {faqs.filter((faq: any) => faq.images && faq.images.length > 0).length}
                  </div>
                  <div className="text-green-200 text-sm">{t('knowledge.withImages')}</div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default FAQDetail

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Car, XCircle, FileText, HelpCircle, Settings } from 'lucide-react'
import { Accordion, AccordionTab } from 'primereact/accordion'
import SupportedFeaturesDetail from '@/components/detail-pages/SupportedFeaturesDetail'
import CompatibleModelsDetail from '@/components/detail-pages/CompatibleModelsDetail'
import IncompatibleModelsDetail from '@/components/detail-pages/IncompatibleModelsDetail'
import FAQDetail from '@/components/detail-pages/FAQDetail'
import { Card, CardContent } from '@/components/ui/Card'
import ImageGallery, { GalleryImage } from '@/components/ImageGallery'
import DocumentFeedback from '@/components/DocumentFeedback'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

interface StructuredDocumentViewerProps {
  document: any
  onBack: () => void
}

const StructuredDocumentViewer: React.FC<StructuredDocumentViewerProps> = ({ document, onBack }) => {
  const { t } = useTranslation()

  // 图片画廊状态
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [initialImageIndex, setInitialImageIndex] = useState(0)

  // 打开图片画廊
  const openGallery = (imageUrl: string, altText: string) => {
    setGalleryImages([{
      url: imageUrl,
      alt: altText,
      title: document.title
    }])
    setInitialImageIndex(0)
    setGalleryOpen(true)
  }

  // 根据文档类型决定显示内容
  const isStructuredDocument = document.type === 'structured'
  const isArticleDocument = document.type === 'article'

  // 计算各模块的数量
  const supportedFeaturesCount = (document.supportedFeatures?.length || document.features?.supported?.length) || 0
  const unsupportedFeaturesCount = (document.unsupportedFeatures?.length || document.features?.unsupported?.length) || 0
  const compatibleModelsCount = document.compatibleModels?.length || 0
  const incompatibleModelsCount = document.incompatibleModels?.length || 0
  const faqsCount = document.faqs?.length || 0

  return (
    <div className="space-y-6">
      {/* 文档头部信息 */}
      <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {document.title}
                </h3>
                {/* 移除重复的车型信息显示，只保留文档标题 */}
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 rounded-lg"
            >
              ← {t('knowledge.backToSelect')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 文档信息 */}
      <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* 文档信息 */}
            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-4">
              <span>{t('knowledge.author')}: {document.authorId?.username || document.author || t('knowledge.technicalTeam')}</span>
              <span>•</span>
              <span>{t('knowledge.uploadTime')}: {document.publishedAt ? new Date(document.publishedAt).toLocaleDateString('zh-CN') : document.createdAt ? new Date(document.createdAt).toLocaleDateString('zh-CN') : 'N/A'}</span>
              <span>•</span>
              <span>{t('knowledge.viewCount')}: {document.views || 0}</span>
              <span>•</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isStructuredDocument
                  ? 'bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                  : isArticleDocument
                  ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-200 border border-primary-300 dark:border-primary-500/30'
                  : 'bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30'
              }`}>
                {isStructuredDocument
                  ? t('knowledge.structuredDocument')
                  : isArticleDocument
                  ? t('knowledge.article')
                  : t('knowledge.file')
                }
              </span>
            </div>

            {/* 根据文档类型显示不同内容 */}
            {isStructuredDocument ? (
              // 结构化文档内容 - 基本信息
              <div>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{t('knowledge.vehicleResearch.basicInfo')}</h4>

                {/* 基本信息 */}
                <div className="space-y-6 mb-6">
                  {/* 车辆外观图 */}
                  {(document.basicInfo?.vehicleImage || document.vehicleImage) && (
                    <div>
                      <h5 className="text-slate-700 dark:text-white text-sm font-medium mb-3">{t('knowledge.vehicleExteriorView')}</h5>
                      <div className="relative group">
                        <img
                          src={document.basicInfo?.vehicleImage || document.vehicleImage}
                          alt={t('knowledge.vehicleExteriorView')}
                          className="w-full max-w-3xl mx-auto rounded-xl shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform border border-gray-200 dark:border-white/10"
                          loading="lazy"
                          decoding="async"
                          onClick={() => openGallery(document.basicInfo?.vehicleImage || document.vehicleImage, t('knowledge.vehicleExteriorView'))}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                      </div>
                      <p className="text-center text-slate-500 dark:text-gray-400 text-sm mt-3">
                        {t('knowledge.clickToViewFullImage')}
                      </p>
                    </div>
                  )}

                  {/* 简介 */}
                  {(document.basicInfo?.introduction || document.introduction) && (
                    <div>
                      <h5 className="text-slate-700 dark:text-white text-sm font-medium mb-3">{t('knowledge.introduction')}</h5>
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-gray-300 prose-headings:text-slate-800 dark:prose-headings:text-white prose-strong:text-slate-800 dark:prose-strong:text-white"
                        dangerouslySetInnerHTML={sanitizeHTMLForReact(document.basicInfo?.introduction || document.introduction)}
                      />
                    </div>
                  )}

                  {/* 重要提示 */}
                  {(document.basicInfo?.importantNotes || document.importantNotes) && (
                    <div className="bg-gradient-to-br from-red-50 dark:from-red-900/20 to-red-100/50 dark:to-red-800/10 border border-red-200 dark:border-red-800/50 backdrop-blur-sm shadow-lg rounded-xl p-6">
                      <h5 className="text-red-700 dark:text-red-300 text-sm font-medium mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('common.importantNotes')}
                      </h5>
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none prose-p:text-red-700 dark:prose-p:text-red-200 prose-headings:text-red-800 dark:prose-headings:text-red-300 prose-strong:text-red-900 dark:prose-strong:text-red-100"
                        dangerouslySetInnerHTML={sanitizeHTMLForReact(document.basicInfo?.importantNotes || document.importantNotes)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : isArticleDocument ? (
              // 富文本文档内容
              <div>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{t('knowledge.documentContent')}</h4>
                <div
                  className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={sanitizeHTMLForReact(document.content || t('knowledge.noContent'))}
                />
              </div>
            ) : (
              // 文件文档内容
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {t('knowledge.fileDocument')}
                </h3>
                <p className="text-slate-600 dark:text-gray-300">
                  {t('knowledge.fileDocumentDesc')}
                </p>
                <button
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300"
                >
                  {t('common.downloadFile')}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 功能模块 - 使用 PrimeReact Accordion */}
      {isStructuredDocument && (
        <div className="my-12">
          <Accordion multiple className="structured-document-accordion">
            {/* 功能支持 */}
            <AccordionTab
              header={
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold">{t('knowledge.cardSections.supportedFeatures')}</span>
                  <span className="ml-auto text-sm text-slate-500 dark:text-gray-400">
                    {supportedFeaturesCount + unsupportedFeaturesCount} {t('common.items')}
                  </span>
                </div>
              }
            >
              <div className="[&>div>button]:hidden">
                <SupportedFeaturesDetail document={document} onBack={() => {}} />
              </div>
            </AccordionTab>

            {/* 适配型号 */}
            <AccordionTab
              header={
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-green-400" />
                  <span className="font-semibold">{t('knowledge.cardSections.compatibleModels')}</span>
                  <span className="ml-auto text-sm text-slate-500 dark:text-gray-400">
                    {compatibleModelsCount} {t('common.items')}
                  </span>
                </div>
              }
            >
              <div className="[&>div>button]:hidden">
                <CompatibleModelsDetail document={document} onBack={() => {}} onImageClick={openGallery} />
              </div>
            </AccordionTab>

            {/* 不适配型号 */}
            <AccordionTab
              header={
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="font-semibold">{t('knowledge.cardSections.incompatibleModels')}</span>
                  <span className="ml-auto text-sm text-slate-500 dark:text-gray-400">
                    {incompatibleModelsCount} {t('common.items')}
                  </span>
                </div>
              }
            >
              <div className="[&>div>button]:hidden">
                <IncompatibleModelsDetail document={document} onBack={() => {}} onImageClick={openGallery} />
              </div>
            </AccordionTab>

            {/* 常见问题 */}
            <AccordionTab
              header={
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold">{t('knowledge.cardSections.faqs')}</span>
                  <span className="ml-auto text-sm text-slate-500 dark:text-gray-400">
                    {faqsCount} {t('common.items')}
                  </span>
                </div>
              }
            >
              <div className="[&>div>div>button]:hidden">
                <FAQDetail document={document} onBack={() => {}} onImageClick={openGallery} />
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      )}

      {/* 用户留言 */}
      {isStructuredDocument && (
        <DocumentFeedback
          documentId={document._id || document.id}
          documentType="structured"
          className="mt-6"
        />
      )}

      {/* 图片画廊 */}
      <ImageGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={galleryImages}
        initialIndex={initialImageIndex}
      />
    </div>
  )
}

export default StructuredDocumentViewer

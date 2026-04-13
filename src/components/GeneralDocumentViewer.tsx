import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, User, Eye, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import DocumentFeedback from '@/components/DocumentFeedback'
import ImageGallery, { GalleryImage } from '@/components/ImageGallery'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

interface GeneralDocumentViewerProps {
  document: any
  onBack: () => void
}

const GeneralDocumentViewer: React.FC<GeneralDocumentViewerProps> = ({ document, onBack }) => {
  const { t } = useTranslation()

  // 图片画廊状态
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [initialImageIndex, setInitialImageIndex] = useState(0)

  // 数据转换：如果没有sections但有images，则重建sections
  const processedDocument = useMemo(() => {
    if (!document) {return null;}

    // 如果已经有sections，直接使用
    if (document.sections && document.sections.length > 0) {
      return document;
    }

    // 如果没有sections但有images，重建sections
    if (document.images && document.images.length > 1) {
      const sections = document.images.slice(1).map((img: any, index: number) => {
        let sectionContent = '';
        let sectionHeading = img.alt || `Section ${index + 1}`;

        if (document.content) {
          const sections = document.content.split(/<h[1-6][^>]*>/i);
          if (sections.length > index + 1) {
            let rawSection = sections[index + 1];
            const titleMatch = rawSection.match(/^([^<]*)<\/h[1-6]>/i);
            if (titleMatch) {
              sectionHeading = titleMatch[1].trim();
              rawSection = rawSection.replace(/^[^<]*<\/h[1-6]>/i, '');
            }
            sectionContent = rawSection.replace(/<[^>]*>/g, '').trim();
          }
        }

        return {
          id: `section_${index + 1}`,
          heading: sectionHeading,
          content: sectionContent || `Section ${index + 1} content`,
          imageUrl: img.url,
          imageAlt: img.alt || '',
          layout: index % 2 === 0 ? 'imageLeft' : 'imageRight'
        };
      });

      return {
        ...document,
        sections,
        heroImageUrl: document.images[0]?.url || '',
        heroImageAlt: document.images[0]?.alt || ''
      };
    }

    return document;
  }, [document]);

  // 处理内容中的图片，确保正确显示
  const processContentImages = (content: string) => {
    if (!content) {return ''}
    return content.replace(/<img([^>]*)>/g, (_, attrs) => {
      return `<img${attrs} style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" loading="lazy" decoding="async" class="clickable-image">`
    })
  }

  // 收集所有文档图片用于画廊
  const collectDocumentImages = (): GalleryImage[] => {
    const images: GalleryImage[] = []

    // 添加Hero图片
    const heroImage = processedDocument?.heroImageUrl || processedDocument?.images?.[0]?.url
    const heroImageAlt = processedDocument?.heroImageAlt || processedDocument?.images?.[0]?.alt || processedDocument?.title
    if (heroImage) {
      images.push({
        url: heroImage,
        alt: heroImageAlt,
        title: processedDocument?.title,
        description: processedDocument?.summary
      })
    }

    // 添加其他所有图片（排除hero图片）
    // 使用原始的images数组，而不是sections，以确保所有图片都被包含
    if (processedDocument?.images && processedDocument.images.length > 1) {
      processedDocument.images.slice(1).forEach((img: any, index: number) => {
        images.push({
          url: img.url || img.imageUrl || img,
          alt: img.alt || img.imageAlt || `${t('admin.images.title')} ${index + 2}`,
          title: img.alt || img.imageAlt,
          description: img.description || ''
        })
      })
    }

    return images
  }

  // 打开图片画廊（通过索引）
  const openGallery = (startIndex: number = 0) => {
    const images = collectDocumentImages()
    setGalleryImages(images)
    setInitialImageIndex(startIndex)
    setGalleryOpen(true)
  }

  // 打开图片画廊（通过图片URL）
  const openGalleryByUrl = (imageUrl: string) => {
    const images = collectDocumentImages()
    const index = images.findIndex(img => img.url === imageUrl)
    setGalleryImages(images)
    setInitialImageIndex(index >= 0 ? index : 0)
    setGalleryOpen(true)
  }

  // 获取Hero图片
  const heroImage = processedDocument?.heroImageUrl || processedDocument?.images?.[0]?.url
  const heroImageAlt = processedDocument?.heroImageAlt || processedDocument?.images?.[0]?.alt || processedDocument?.title

  // 获取sections中的图片（排除hero图片）
  const sectionImages = processedDocument?.images?.slice(1) || []

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2 inline" />
          {t('knowledge.video.backToDocuments')}
        </button>
      </div>

      {/* Hero图片 - 可点击放大，高度自适应 */}
      {heroImage && (
        <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
          onClick={() => openGallery(0)}>
          <img
            src={heroImage}
            alt={heroImageAlt}
            className="w-full h-auto"
            loading="lazy"
          />
        </Card>
      )}

      {/* 文档头部信息 */}
      <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {processedDocument?.title || t('knowledge.noTitle')}
                </h1>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文档信息 */}
      <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* 文档元信息 */}
            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{t('knowledge.author')}: {processedDocument?.authorId?.username || processedDocument?.author || t('knowledge.technicalTeam')}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{t('knowledge.uploadTime')}: {processedDocument?.publishedAt ? new Date(processedDocument.publishedAt).toLocaleDateString('zh-CN') : processedDocument?.createdAt ? new Date(processedDocument.createdAt).toLocaleDateString('zh-CN') : 'N/A'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{t('knowledge.viewCount')}: {processedDocument?.views || 0}</span>
              </div>
            </div>

            {/* 文档摘要 */}
            {processedDocument?.summary && (
              <div>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{t('knowledge.summary')}</h4>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">{processedDocument.summary}</p>
              </div>
            )}

            {/* 文档内容 - 只在没有sections时显示 */}
            {(!processedDocument?.sections || !Array.isArray(processedDocument.sections) || processedDocument.sections.length === 0) && (
              <div>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{t('knowledge.articleContent')}</h4>
                {processedDocument?.content ? (
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-slate-800 dark:prose-strong:text-white prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-blue-100 dark:prose-code:bg-blue-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:text-gray-800 dark:prose-pre:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:hover:text-blue-500 dark:prose-a:hover:text-blue-300"
                    dangerouslySetInnerHTML={sanitizeHTMLForReact(processContentImages(processedDocument.content))}
                  />
                ) : (
                  <p className="text-slate-400 dark:text-gray-500 italic">{t('knowledge.noContent')}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 其他图片画廊（排除hero图片） - 只在没有sections时显示 */}
      {(!processedDocument?.sections || !Array.isArray(processedDocument.sections) || processedDocument.sections.length === 0) && sectionImages && sectionImages.length > 0 && (
        <Card className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('knowledge.relatedImages')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sectionImages.map((img: any, index: number) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700/30 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600/30 cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => openGalleryByUrl(img.url || img.imageUrl || img)}
                >
                  <img
                    src={img.url || img.imageUrl || img}
                    alt={img.alt || img.imageAlt || `${t('admin.images.title')} ${index + 2}`}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                  {(img.alt || img.imageAlt) && (
                    <div className="p-4">
                      <p className="text-sm text-slate-600 dark:text-gray-300">{img.alt || img.imageAlt}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 章节内容 - 图文并茂显示 */}
      {processedDocument?.sections && Array.isArray(processedDocument.sections) && processedDocument.sections.length > 0 && (
        <div className="space-y-8">
          {processedDocument.sections.map((section: any, index: number) => (
            <Card key={index} className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8">
                {/* 章节标题 */}
                {section.heading && (
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                    {section.heading || section.title || `${t('admin.documents.section')} ${index + 1}`}
                  </h2>
                )}

                {/* 图文布局：左图右文 或 左文右图 */}
                <div className={`flex flex-col ${section.layout === 'imageLeft' ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start`}>
                  {/* 图片部分 - 可点击放大 */}
                  {section.imageUrl && (
                    <div className="w-full md:w-1/2 flex-shrink-0">
                      <img
                        src={section.imageUrl}
                        alt={section.imageAlt || section.heading || `${t('admin.documents.section')} ${index + 1}`}
                        className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"
                        loading="lazy"
                        onClick={() => openGalleryByUrl(section.imageUrl)}
                      />
                      {section.imageAlt && (
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-2 text-center italic">
                          {section.imageAlt}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 文字部分 */}
                  <div className={`w-full ${section.imageUrl ? 'md:w-1/2' : 'md:w-full'} flex-grow`}>
                    {section.content && (
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-slate-800 dark:prose-strong:text-white prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-blue-100 dark:prose-code:bg-blue-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:text-gray-800 dark:prose-pre:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:hover:text-blue-500 dark:prose-a:hover:text-blue-300"
                        dangerouslySetInnerHTML={sanitizeHTMLForReact(processContentImages(section.content))}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 用户留言 */}
      <DocumentFeedback
        documentId={document._id || document.id}
        documentType="image-text"
        className="mt-6"
      />

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

export default GeneralDocumentViewer

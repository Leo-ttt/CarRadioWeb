import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import LazyRichTextEditor from '@/components/LazyRichTextEditor'
import CategorySelector from '@/components/CategorySelector'
import { saveDraft, loadDraft, deleteDraft } from '@/services/draftService'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { sanitizeHTMLForReact } from '@/utils/sanitize'

interface ContentSection {
  id: string
  layout: 'imageLeft' | 'imageRight'
  heading: string
  content: string
  imageUrl: string
  imageAlt: string
}

interface EnhancedDocument {
  id?: number
  title: string
  author: string
  summary: string
  heroImageUrl: string
  heroImageAlt: string
  sections: ContentSection[]
  type: 'enhanced-article'
  category?: string  // 分类名称
}

interface EnhancedGeneralDocumentEditorProps {
  document?: EnhancedDocument
  onSave: (document: EnhancedDocument) => void
  onCancel: () => void
}

const EnhancedGeneralDocumentEditor: React.FC<EnhancedGeneralDocumentEditorProps> = ({
  document,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [previewMode, setPreviewMode] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [autoSaving, setAutoSaving] = useState(false)
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [draftToRestore, setDraftToRestore] = useState<any>(null)

  // 定义编辑器的sections
  const sections = [
    { id: 'basic', title: t('admin.documents.basicInfo'), icon: 'info' },
    { id: 'hero', title: t('admin.documents.heroImage'), icon: 'image' },
    { id: 'content', title: t('admin.documents.imageTextContent'), icon: 'content' }
  ]

  const [formData, setFormData] = useState<EnhancedDocument>({
    title: document?.title || '',
    author: document?.author || 'Technical Team',
    summary: document?.summary || '',
    heroImageUrl: document?.heroImageUrl || '',
    heroImageAlt: document?.heroImageAlt || '',
    sections: document?.sections || [],
    type: 'enhanced-article',
    category: document?.category || 'general'
  })

  // 添加新内容段�?
  const addSection = () => {
    const newSection: ContentSection = {
      id: Date.now().toString(),
      layout: formData.sections.length % 2 === 0 ? 'imageLeft' : 'imageRight',
      heading: '',
      content: '',
      imageUrl: '',
      imageAlt: ''
    }
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }

  // 删除内容段落
  const removeSection = (id: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id)
    }))
  }

  // 移动段落位置
  const moveSectionUp = (index: number) => {
    if (index === 0) {return}
    const newSections = [...formData.sections]
    const temp = newSections[index]
    newSections[index] = newSections[index - 1]
    newSections[index - 1] = temp
    setFormData(prev => ({ ...prev, sections: newSections }))
  }

  const moveSectionDown = (index: number) => {
    if (index === formData.sections.length - 1) {return}
    const newSections = [...formData.sections]
    const temp = newSections[index]
    newSections[index] = newSections[index + 1]
    newSections[index + 1] = temp
    setFormData(prev => ({ ...prev, sections: newSections }))
  }

  // 切换段落布局
  const toggleSectionLayout = (id: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id
          ? { ...section, layout: section.layout === 'imageLeft' ? 'imageRight' : 'imageLeft' }
          : section
      )
    }))
  }

  // 更新段落内容
  const updateSection = (id: string, field: keyof ContentSection, value: string) => {
    console.log('🔧 updateSection:', { id, field, value: value.substring(0, 100) + '...' });
    setFormData(prev => {
      const newSections = prev.sections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      );
      console.log('📝 更新后的sections:', newSections.map(s => ({ id: s.id, content: s.content?.substring(0, 50) + '...' })));
      return {
        ...prev,
        sections: newSections
      };
    });
  }

  // 自动保存草稿（debounce 3秒）
  useEffect(() => {
    if (!formData.title && !document) {return}

    const timer = setTimeout(() => {
      setAutoSaving(true)
      saveDraft('general', formData, document?.id?.toString())
      setTimeout(() => setAutoSaving(false), 1000)
    }, 3000)

    return () => clearTimeout(timer)
  }, [formData, document])

  // 打开时检查草稿
  useEffect(() => {
    if (document) {return}

    const draft = loadDraft('general', undefined)
    if (draft) {
      setDraftToRestore(draft.formData)
      setShowDraftDialog(true)
    }
  }, [document])

  // 保存文档
  const handleSave = () => {
    if (!formData.title.trim()) {
      showToast({
        type: 'error',
        title: t('common.error'),
        description: t('knowledge.documentTitlePlaceholder')
      })
      return
    }

    if (!formData.heroImageUrl) {
      showToast({
        type: 'error',
        title: t('common.error'),
        description: t('admin.documents.heroImageRequired')
      })
      return
    }

    deleteDraft('general', document?.id?.toString())
    onSave({
      ...formData,
      id: document?.id
    })
  }

  // 预览模式渲染
  const renderPreview = () => (
    <div className="space-y-8">
      {/* 标题区域 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">{formData.title}</h1>
        {formData.summary && (
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto">{formData.summary}</p>
        )}
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {t('knowledge.author')}: {formData.author || t('knowledge.technicalTeam')}
        </div>
      </div>

      {/* 横幅图片 */}
      {formData.heroImageUrl && (
        <div className="w-full overflow-hidden rounded-xl">
          <img
            src={formData.heroImageUrl}
            alt={formData.heroImageAlt}
            className="w-full h-[300px] md:h-[500px] object-cover"
          />
        </div>
      )}

      {/* 内容段落 */}
      <div className="space-y-16">
        {formData.sections.map((section) => (
          <div key={section.id} className={`flex flex-col md:flex-row items-center gap-8 ${
            section.layout === 'imageRight' ? 'md:flex-row-reverse' : ''
          }`}>
            {section.imageUrl && (
              <div className="w-full md:w-1/2">
                <img
                  src={section.imageUrl}
                  alt={section.imageAlt}
                  className="w-full h-[300px] object-cover rounded-lg"
                />
              </div>
            )}
            <div className="w-full md:w-1/2 space-y-4">
              {section.heading && (
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {section.heading}
                </h2>
              )}
              <div className="prose max-w-none" dangerouslySetInnerHTML={sanitizeHTMLForReact(section.content)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 预览模式
  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('common.preview')}</h2>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              {t('common.backToEdit')}
            </Button>
            <Button onClick={handleSave}>
              {t('common.save')}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm">
          {renderPreview()}
        </div>
      </div>
    )
  }

  // 渲染当前活跃的section内容
  const renderCurrentSection = () => {
    switch (activeSection) {
      case 0:
        return renderBasicInfo()
      case 1:
        return renderHeroImage()
      case 2:
        return renderImageTextContent()
      default:
        return renderBasicInfo()
    }
  }

  // 渲染基本信息section
  const renderBasicInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.documents.basicInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('knowledge.documentTitle')} *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('knowledge.documentTitlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('knowledge.author')} *
            </label>
            <Input
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              placeholder={t('knowledge.authorPlaceholder')}
              className="border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('knowledge.summary')}
          </label>
          <Input
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            placeholder={t('knowledge.summaryPlaceholder')}
          />
        </div>

        {/* 分类选择 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('category.category')}
          </label>
          <CategorySelector
            selectedCategory={formData.category || ''}
            onCategoryChange={(category) => {
              console.log('📝 EnhancedEditor - 分类变化:', category);
              setFormData(prev => {
                const newData = { ...prev, category };
                console.log('📝 EnhancedEditor - 更新后的formData.category:', newData.category);
                return newData;
              });
            }}
            documentType="general"
            placeholder={t('category.selectOrCreateCategory')}
          />
        </div>
      </CardContent>
    </Card>
  )

  // 渲染横幅图片section
  const renderHeroImage = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.documents.heroImage')} *</CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          value={formData.heroImageUrl}
          onChange={(imageUrl) => setFormData(prev => ({ ...prev, heroImageUrl: imageUrl }))}
          placeholder={t('admin.images.uploadImage')}
          className="h-48 md:h-64"
          uploadFolder="documents"
          imageType="hero"
        />
        {formData.heroImageUrl && (
          <div className="mt-2">
            <Input
              value={formData.heroImageAlt}
              onChange={(e) => setFormData(prev => ({ ...prev, heroImageAlt: e.target.value }))}
              placeholder={t('admin.documents.imageDescription')}
              className="text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )

  // 渲染图文内容section - 正确的用户体验：添加按钮在底部
  const renderImageTextContent = () => (
    <div className="space-y-6">
      {/* 标题和提示 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {t('admin.documents.imageTextContent')}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formData.sections.length === 0 ? t('admin.documents.noSectionsHint') :
            `${formData.sections.length} ${t('admin.documents.section')}`}
        </p>
      </div>

      {/* 图文段落列表 */}
      {formData.sections.map((section, index) => (
        <Card key={section.id} className="overflow-hidden border-l-4 border-blue-500">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 py-3">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold text-slate-900 dark:text-white">
                {t('admin.documents.section')} {index + 1}
              </h4>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSectionLayout(section.id)}
                  className="text-xs"
                >
                  {section.layout === 'imageLeft' ? t('admin.documents.imageLeftTextRight') : t('admin.documents.textLeftImageRight')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveSectionUp(index)}
                  disabled={index === 0}
                  title={t('common.moveUp') || 'Move Up'}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveSectionDown(index)}
                  disabled={index === formData.sections.length - 1}
                  title={t('common.moveDown') || 'Move Down'}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSection(section.id)}
                  className="hover:bg-red-50"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('admin.documents.sectionImage')}
                </label>
                <ImageUpload
                  value={section.imageUrl}
                  onChange={(imageUrl) => updateSection(section.id, 'imageUrl', imageUrl)}
                  placeholder={t('admin.images.uploadImage')}
                  className="h-32 overflow-hidden"
                  uploadFolder="documents"
                  imageType="general"
                />
                {section.imageUrl && (
                  <Input
                    value={section.imageAlt}
                    onChange={(e) => updateSection(section.id, 'imageAlt', e.target.value)}
                    placeholder={t('admin.documents.imageDescription')}
                    className="text-sm mt-2"
                  />
                )}
              </div>

              {/* 段落标题 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('admin.documents.sectionTitle')}
                </label>
                <Input
                  value={section.heading}
                  onChange={(e) => updateSection(section.id, 'heading', e.target.value)}
                  placeholder={t('admin.documents.sectionTitlePlaceholder')}
                />
              </div>
            </div>

            {/* 段落内容 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.documents.sectionContent')}
              </label>
              <LazyRichTextEditor
                key={`section-${section.id}-content`}
                value={section.content}
                onChange={(value) => {
                  console.log('🔧 Section内容变化:', {
                    sectionId: section.id,
                    newValue: value.substring(0, 50) + '...',
                    oldValue: section.content?.substring(0, 50) + '...'
                  });
                  updateSection(section.id, 'content', value);
                }}
                placeholder={t('admin.documents.sectionContentPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 空状态提示或添加按钮 */}
      {formData.sections.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <p className="mb-4">{t('admin.documents.noSectionsHint')}</p>
          <Button onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.documents.addImageTextSection')}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.documents.addImageTextSection')}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 - 固定高度 */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {document ? t('admin.documents.editImageTextTutorial') : t('admin.documents.createImageTextTutorial')}
            </h2>
            {autoSaving && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>已自动保存</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(true)}
              className="h-10 px-4"
            >
              {t('common.preview')}
            </Button>
            <Button
              onClick={handleSave}
              className="h-10 px-4"
            >
              {t('common.save')}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="h-10 px-4"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>

      {/* 草稿恢复确认弹窗 */}
      <ConfirmDialog
        isOpen={showDraftDialog}
        onClose={() => {
          setShowDraftDialog(false)
          setDraftToRestore(null)
          deleteDraft('general', document?.id?.toString())
        }}
        onConfirm={() => {
          if (draftToRestore) {
            setFormData(draftToRestore)
          }
          setShowDraftDialog(false)
          setDraftToRestore(null)
        }}
        title="发现草稿"
        message="检测到未保存的草稿，是否恢复？"
        confirmText="恢复"
        cancelText="放弃"
      />

      {/* 主要内容区域：侧边栏导航 + 内容 - 可滚动 */}
      <div className="flex-1 flex min-h-0">
        {/* 侧边栏导航 - 固定宽度，可滚动 */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
          <div className="p-4">
            <nav className="space-y-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === index
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activeSection === index ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-500'
                    }`} />
                    <span className="font-medium">{section.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <div className="p-6">
            {renderCurrentSection()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedGeneralDocumentEditor

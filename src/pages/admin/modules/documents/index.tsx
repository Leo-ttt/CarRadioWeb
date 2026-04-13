/**
 * 文档管理模块主页面
 * 完全恢复原有核心功能
 * 支持三种文档类型：图文教程、视频教程、车型资料（结构化文章）
 */

import { useState, useEffect, useCallback } from 'react'
import { FileText, Video, Plus, Edit, Trash2, Eye, Car, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import EnhancedGeneralDocumentEditor from '@/components/EnhancedGeneralDocumentEditor'
import StructuredArticleEditor from '@/components/StructuredArticleEditor'
import StructuredDocumentViewer from '@/components/StructuredDocumentViewer'
import HierarchicalManager from '@/components/HierarchicalManager'
import DraftManager from '@/components/DraftManager'
import { sanitizeHTMLForReact } from '@/utils/sanitize'
import { saveDraft, loadDraft, deleteDraft } from '@/services/draftService'
import {
  createDocument,
  getDocuments,
  updateDocument,
  deleteDocument
} from '@/services/documentApi'
import { getCategoriesByDocumentType, type Category } from '@/services/categoryService'
import type { DataLanguage } from '../../hooks/useDataLanguage'

interface DocumentManagementProps {
  dataLanguage: DataLanguage
}

type DocumentTypeFilter = 'all' | 'structured' | 'video' | 'general'

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ dataLanguage }) => {
  const { showToast } = useToast()

  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>('all')

  // 草稿管理状态
  const [showDraftManager, setShowDraftManager] = useState(false)

  // 图文教程编辑器状态
  const [showEnhancedDocumentEditor, setShowEnhancedDocumentEditor] = useState(false)
  const [editingEnhancedDocument, setEditingEnhancedDocument] = useState<any>(null)

  // 视频教程编辑器状态
  const [showVideoEditModal, setShowVideoEditModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<any>(null)

  // 视频分类列表
  const [videoCategories, setVideoCategories] = useState<Category[]>([])

  // 视频教程草稿自动保存
  const [videoAutoSaveTimer, setVideoAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [videoCategoriesLoading, setVideoCategoriesLoading] = useState(false)
  const [showVideoDraftDialog, setShowVideoDraftDialog] = useState(false)
  const [videoDraftToRestore, setVideoDraftToRestore] = useState<any>(null)

  // 结构化文章编辑器状态
  const [showStructuredArticleEditor, setShowStructuredArticleEditor] = useState(false)
  const [editingStructuredArticle, setEditingStructuredArticle] = useState<any>(null)

  // 预览状态
  const [showPreview, setShowPreview] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<any>(null)

  // 删除确认弹窗状态
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; documentType: string }>({ open: false, id: '', documentType: '' })

  // 加载文档
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const [structuredResult, videoResult, generalResult] = await Promise.all([
        getDocuments({ documentType: 'structured', limit: 1000, language: dataLanguage }),
        getDocuments({ documentType: 'video', limit: 1000, language: dataLanguage }),
        getDocuments({ documentType: 'general', limit: 1000, language: dataLanguage })
      ])

      const allDocuments = [
        ...structuredResult.documents,
        ...videoResult.documents,
        ...generalResult.documents
      ]

      setDocuments(allDocuments)
    } catch (error) {
      console.error('加载文档失败:', error)
      showToast({ type: 'error', title: '加载失败' })
    } finally {
      setLoading(false)
    }
  }, [dataLanguage, showToast])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // 打开视频表单时加载分类列表
  useEffect(() => {
    if (!showVideoEditModal) {return}
    const loadVideoCategories = async () => {
      setVideoCategoriesLoading(true)
      try {
        const cats = await getCategoriesByDocumentType('video', dataLanguage)
        setVideoCategories(cats)
      } catch {
        setVideoCategories([])
      } finally {
        setVideoCategoriesLoading(false)
      }
    }
    loadVideoCategories()
  }, [showVideoEditModal, dataLanguage])

  // 视频教程草稿自动保存（debounce 3秒）
  useEffect(() => {
    if (!showVideoEditModal || !editingDocument) {
      if (videoAutoSaveTimer) {
        clearTimeout(videoAutoSaveTimer);
        setVideoAutoSaveTimer(null);
      }
      return;
    }

    // 打开时检查草稿（仅新建时）
    if (!editingDocument._id) {
      const draftData = loadDraft('video', undefined);
      if (draftData) {
        setVideoDraftToRestore(draftData.formData);
        setShowVideoDraftDialog(true);
      }
    }

    // 启动debounce自动保存
    const timer = setTimeout(() => {
      if (editingDocument && (editingDocument.title || editingDocument.summary)) {
        saveDraft('video', editingDocument, editingDocument._id);
      }
    }, 3000);

    setVideoAutoSaveTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [showVideoEditModal, editingDocument])

  // 处理删除文档
  const handleDeleteDocument = async (id: string, documentType: string) => {
    try {
      await deleteDocument(id, documentType as 'general' | 'video' | 'structured')
      showToast({ type: 'success', title: '删除成功' })
    } catch (error) {
      console.error('删除文档失败:', error)
      showToast({ type: 'error', title: '删除失败', description: error instanceof Error ? error.message : '未知错误' })
    } finally {
      // 无论成功失败都刷新列表，避免后端已删除但前端未同步
      loadDocuments()
    }
  }

  // 处理编辑文档
  const handleEditDocument = (doc: any) => {
    const docType = doc.documentType || doc.type

    if (docType === 'structured') {
      setEditingStructuredArticle(doc)
      setShowStructuredArticleEditor(true)
    } else if (docType === 'video') {
      setEditingDocument(doc)
      setShowVideoEditModal(true)
    } else {
      setEditingEnhancedDocument(doc)
      setShowEnhancedDocumentEditor(true)
    }
  }

  // 处理预览
  const handlePreviewDocument = (doc: any) => {
    setPreviewDocument(doc)
    setShowPreview(true)
  }

  // 保存图文教程
  const handleSaveEnhancedDocument = async (data: any) => {
    try {
      const documentData = {
        ...data,
        documentType: 'general',
        language: dataLanguage
      }

      if (editingEnhancedDocument) {
        await updateDocument(editingEnhancedDocument._id, documentData)
        showToast({ type: 'success', title: '更新成功' })
      } else {
        await createDocument(documentData)
        showToast({ type: 'success', title: '创建成功' })
      }

      setShowEnhancedDocumentEditor(false)
      setEditingEnhancedDocument(null)
      loadDocuments()
    } catch (error) {
      showToast({ type: 'error', title: editingEnhancedDocument ? '更新失败' : '创建失败' })
      throw error
    }
  }

  // 保存视频教程（已废弃，使用 EnhancedGeneralDocumentEditor）
  // const handleSaveVideoTutorial = async (data: any) => {
  //   try {
  //     const documentData = {
  //       ...data,
  //       documentType: 'video',
  //       language: dataLanguage
  //     }
  //
  //     if (editingDocument?._id) {
  //       await updateDocument(editingDocument._id, documentData)
  //       showToast({ type: 'success', title: '更新成功' })
  //     } else {
  //       await createDocument(documentData)
  //       showToast({ type: 'success', title: '创建成功' })
  //     }
  //
  //     setShowVideoEditModal(false)
  //     setEditingDocument(null)
  //     loadDocuments()
  //   } catch (error) {
  //     showToast({ type: 'error', title: editingDocument?._id ? '更新失败' : '创建失败' })
  //   }
  // }

  // 保存结构化文章
  const handleSaveStructuredArticle = async (data: any) => {
    try {
      const documentData = {
        ...data,
        documentType: 'structured',
        language: dataLanguage
      }

      if (editingStructuredArticle?._id) {
        await updateDocument(editingStructuredArticle._id, documentData)
        showToast({ type: 'success', title: '更新成功' })
      } else {
        await createDocument(documentData)
        showToast({ type: 'success', title: '创建成功' })
      }

      setShowStructuredArticleEditor(false)
      setEditingStructuredArticle(null)
      loadDocuments()
    } catch (error) {
      showToast({ type: 'error', title: editingStructuredArticle?._id ? '更新失败' : '创建失败' })
    }
  }

  const structuredDocs = documents.filter(d => (d.documentType || d.type) === 'structured')
  const videoDocs = documents.filter(d => (d.documentType || d.type) === 'video')
  const generalDocs = documents.filter(d => (d.documentType || d.type) === 'general')

  return (
    <div className="space-y-6">
      {/* 统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">文档总数</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{documents.length}</p>
            </div>
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">车型资料</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{structuredDocs.length}</p>
            </div>
            <div className="p-3 bg-green-600/20 rounded-xl border border-green-500/30">
              <Car className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">视频教程</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{videoDocs.length}</p>
            </div>
            <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30">
              <Video className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">图文教程</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{generalDocs.length}</p>
            </div>
            <div className="p-3 bg-orange-600/20 rounded-xl border border-orange-500/30">
              <BookOpen className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 类型筛选器 */}
      <div className="flex items-center justify-between gap-4 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-gray-300">显示:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-gray-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              全部 <span className="ml-1 opacity-75">({documents.length})</span>
            </button>
            <button
              onClick={() => setTypeFilter('structured')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                typeFilter === 'structured'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-slate-100 dark:bg-gray-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              <Car className="h-4 w-4" />
              车型资料 <span className="ml-1 opacity-75">({structuredDocs.length})</span>
            </button>
            <button
              onClick={() => setTypeFilter('video')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                typeFilter === 'video'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-100 dark:bg-gray-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              <Video className="h-4 w-4" />
              视频教程 <span className="ml-1 opacity-75">({videoDocs.length})</span>
            </button>
            <button
              onClick={() => setTypeFilter('general')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                typeFilter === 'general'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-100 dark:bg-gray-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              图文教程 <span className="ml-1 opacity-75">({generalDocs.length})</span>
            </button>
          </div>
        </div>

        {/* 创建按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setShowStructuredArticleEditor(true)
              setEditingStructuredArticle(null)
            }}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
          >
            创建车型资料
          </Button>
          <Button
            onClick={() => {
              setEditingDocument({
                title: '',
                summary: '',
                category: '',
                videos: [{ url: '', title: '', description: '', platform: 'custom', duration: '', order: 0 }],
              })
              setShowVideoEditModal(true)
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
          >
            创建视频教程
          </Button>
          <Button
            onClick={() => {
              setEditingEnhancedDocument(null)
              setShowEnhancedDocumentEditor(true)
            }}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            创建图文教程
          </Button>

          {/* 草稿箱按钮 */}
          <Button
            variant="outline"
            onClick={() => setShowDraftManager(true)}
            className="border-slate-300 dark:border-slate-600"
          >
            草稿箱
          </Button>
        </div>
      </div>

      {/* 草稿管理弹窗 */}
      <DraftManager
        isOpen={showDraftManager}
        onClose={() => setShowDraftManager(false)}
        onRestore={(draft) => {
          // 根据草稿类型打开对应编辑器
          if (draft.type === 'structured') {
            setEditingStructuredArticle(null);
            setShowStructuredArticleEditor(true);
            // 编辑器会自动检测并恢复草稿
          } else if (draft.type === 'video') {
            setEditingDocument(draft.data);
            setShowVideoEditModal(true);
          } else if (draft.type === 'general') {
            setEditingEnhancedDocument(draft.data);
            setShowEnhancedDocumentEditor(true);
          }
        }}
      />

      {/* 文档列表 */}
      <div className="space-y-6">
        {/* 结构化文章 - 车辆层级结构 */}
        {structuredDocs.length > 0 && (typeFilter === 'all' || typeFilter === 'structured') && (
          <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Car className="h-5 w-5 mr-2 text-blue-400" />
                车型资料（结构化文章）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HierarchicalManager
                items={structuredDocs}
                buildHierarchy={(docs) => {
                  const hierarchy: { [key: string]: any } = {}

                  docs.forEach((doc: any) => {
                    let brand = 'Unknown Brand'
                    let model = 'Unknown Model'
                    let year = 'Unknown Year'

                    if (doc.basicInfo && doc.basicInfo.brand) {
                      brand = doc.basicInfo.brand
                      model = doc.basicInfo.model || 'Unknown Model'
                      year = doc.basicInfo.yearRange || 'Unknown Year'
                    }

                    if (!hierarchy[brand]) {hierarchy[brand] = {}}
                    if (!hierarchy[brand][model]) {hierarchy[brand][model] = {}}
                    if (!hierarchy[brand][model][year]) {hierarchy[brand][model][year] = []}

                    hierarchy[brand][model][year].push(doc)
                  })

                  const buildNodes = (obj: any, path: string[] = [], type: string = 'brand'): any[] => {
                    return Object.entries(obj).map(([key, value]) => {
                      const nodeId = [...path, key].join('/')

                      if (Array.isArray(value)) {
                        return {
                          id: nodeId,
                          name: key,
                          type: 'document-group',
                          count: value.length,
                          data: value,
                          children: []
                        }
                      } else {
                        const children = buildNodes(value, [...path, key], getNextType(type))
                        const totalCount = children.reduce((sum, child) => sum + (child.count || 0), 0)

                        return {
                          id: nodeId,
                          name: key,
                          type,
                          count: totalCount,
                          children
                        }
                      }
                    })
                  }

                  const getNextType = (currentType: string): string => {
                    const typeMap: { [key: string]: string } = {
                      'brand': 'model',
                      'model': 'year',
                      'year': 'document-group'
                    }
                    return typeMap[currentType] || 'document-group'
                  }

                  return buildNodes(hierarchy)
                }}
                renderLeafNode={(node) => (
                  <div className="space-y-2">
                    {node.data?.map((doc: any) => (
                      <div key={doc.id || doc._id} className="bg-slate-100 dark:bg-gray-700/30 rounded-lg p-4 border border-slate-200 dark:border-gray-600/50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-slate-800 dark:text-white font-medium mb-2">{doc.title}</h4>
                            <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">
                              作者: {doc.author || '技术团队'}
                            </p>
                            {doc.summary && (
                              <p className="text-slate-500 dark:text-gray-400 text-sm">{doc.summary}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => handlePreviewDocument(doc)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditDocument(doc)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, id: doc._id || doc.id, documentType: 'structured' })}
                              className="text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* 视频教程 */}
        {videoDocs.length > 0 && (typeFilter === 'all' || typeFilter === 'video') && (
          <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Video className="h-5 w-5 mr-2 text-purple-400" />
                视频教程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {videoDocs.map((doc) => (
                  <div key={doc._id || doc.id} className="bg-slate-100 dark:bg-gray-700/30 rounded-lg p-4 border border-slate-200 dark:border-gray-600/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-slate-800 dark:text-white font-medium mb-2">{doc.title}</h4>
                        {doc.summary && <p className="text-slate-500 dark:text-gray-400 text-sm">{doc.summary}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handlePreviewDocument(doc)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditDocument(doc)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ open: true, id: doc._id || doc.id, documentType: 'video' })}
                          className="text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 图文教程 */}
        {generalDocs.length > 0 && (typeFilter === 'all' || typeFilter === 'general') && (
          <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-orange-400" />
                图文教程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generalDocs.map((doc) => (
                  <div key={doc._id || doc.id} className="bg-slate-100 dark:bg-gray-700/30 rounded-lg p-4 border border-slate-200 dark:border-gray-600/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-slate-800 dark:text-white font-medium mb-2">{doc.title}</h4>
                        {doc.summary && <p className="text-slate-500 dark:text-gray-400 text-sm">{doc.summary}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handlePreviewDocument(doc)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditDocument(doc)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm({ open: true, id: doc._id || doc.id, documentType: 'general' })}
                          className="text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {documents.length === 0 && !loading && (
          <Card className="bg-white/80 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
            <CardContent className="p-12 text-center text-slate-500 dark:text-gray-400">
              暂无文档，点击上方按钮创建
            </CardContent>
          </Card>
        )}
      </div>

      {/* 图文教程编辑器 */}
      {showEnhancedDocumentEditor && (
        <Modal
          isOpen={showEnhancedDocumentEditor}
          onClose={() => {
            setShowEnhancedDocumentEditor(false)
            setEditingEnhancedDocument(null)
          }}
          title={editingEnhancedDocument ? '编辑图文教程' : '创建图文教程'}
          size="xl"
        >
          <EnhancedGeneralDocumentEditor
            document={editingEnhancedDocument}
            onSave={handleSaveEnhancedDocument}
            onCancel={() => {
              setShowEnhancedDocumentEditor(false)
              setEditingEnhancedDocument(null)
            }}
          />
        </Modal>
      )}

      {/* 结构化文章编辑器 */}
      {showStructuredArticleEditor && (
        <Modal
          isOpen={showStructuredArticleEditor}
          onClose={() => {
            setShowStructuredArticleEditor(false)
            setEditingStructuredArticle(null)
          }}
          title={editingStructuredArticle ? '编辑车型资料' : '创建车型资料'}
          size="xl"
        >
          <StructuredArticleEditor
            article={editingStructuredArticle}
            onSave={handleSaveStructuredArticle}
            onCancel={() => {
              setShowStructuredArticleEditor(false)
              setEditingStructuredArticle(null)
            }}
          />
        </Modal>
      )}

      {/* 视频教程编辑器 - 使用 Modal 组件 */}
      <Modal
        isOpen={showVideoEditModal}
        onClose={() => {
          setShowVideoEditModal(false)
          setEditingDocument(null)
        }}
        title={editingDocument?._id ? '编辑视频教程' : '创建视频教程'}
        size="xl"
      >
        <div className="relative flex flex-col min-h-0">
          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">视频标题</label>
              <Input
                placeholder="输入视频标题"
                value={editingDocument?.title || ''}
                onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
              />
            </div>

            {/* 分类选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">分类</label>
              {videoCategoriesLoading ? (
                <p className="text-sm text-slate-400">加载分类中...</p>
              ) : videoCategories.length === 0 ? (
                <p className="text-sm text-slate-400">暂无可用分类，请先在分类管理中创建</p>
              ) : (
                <select
                  value={editingDocument?.category || ''}
                  onChange={(e) => setEditingDocument({ ...editingDocument, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
                  aria-label="选择视频分类"
                >
                  <option value="">请选择分类</option>
                  {videoCategories.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 视频链接 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">视频链接</label>
                <Button
                  size="sm"
                  onClick={() => {
                    const videos = editingDocument?.videos || []
                    setEditingDocument({
                      ...editingDocument,
                      videos: [...videos, { url: '', title: '', description: '', platform: 'custom', duration: '', order: videos.length }]
                    })
                  }}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  添加视频
                </Button>
              </div>

              {/* 视频列表 */}
              <div className="space-y-4">
                {(() => {
                  let videos = editingDocument?.videos || [];
                  if (videos.length === 0) {
                    videos = [{
                      url: '',
                      title: '',
                      description: '',
                      platform: 'custom',
                      duration: '',
                      order: 0
                    }];
                    setTimeout(() => {
                      setEditingDocument((prev: any) => ({ ...prev, videos }));
                    }, 0);
                  }
                  return videos.map((video: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">视频 {index + 1}</span>
                        {videos.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newVideos = editingDocument.videos.filter((_: any, i: number) => i !== index)
                              setEditingDocument({ ...editingDocument, videos: newVideos })
                            }}
                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">视频URL</label>
                          <Input
                            placeholder="输入YouTube、Bilibili或其他视频链接"
                            value={video.url || ''}
                            onChange={(e) => {
                              const newVideos = [...editingDocument.videos]
                              newVideos[index] = { ...newVideos[index], url: e.target.value }
                              setEditingDocument({ ...editingDocument, videos: newVideos })
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">视频说明</label>
                          <Input
                            placeholder="可选：添加视频说明"
                            value={video.description || ''}
                            onChange={(e) => {
                              const newVideos = [...editingDocument.videos]
                              newVideos[index] = { ...newVideos[index], description: e.target.value }
                              setEditingDocument({ ...editingDocument, videos: newVideos })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {editingDocument?.videos && editingDocument.videos.length > 1 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">已添加多个视频，将按顺序播放</p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">描述</label>
              <textarea
                placeholder="输入视频描述"
                value={editingDocument?.summary || editingDocument?.description || ''}
                onChange={(e) => setEditingDocument({
                  ...editingDocument,
                  summary: e.target.value,
                  description: e.target.value
                })}
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 固定在底部的操作按钮 */}
          <div className="flex justify-end gap-2 py-4 px-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
            <Button
              variant="outline"
              onClick={() => {
                setShowVideoEditModal(false)
                setEditingDocument(null)
              }}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (!editingDocument?.title?.trim()) {
                    showToast({ type: 'warning', title: '请输入标题' })
                    return
                  }

                  if (!editingDocument?.videos || editingDocument.videos.length === 0) {
                    showToast({ type: 'warning', title: '请至少添加一个视频' })
                    return
                  }

                  const hasInvalidVideo = editingDocument.videos.some((v: any) => !v.url?.trim())
                  if (hasInvalidVideo) {
                    showToast({ type: 'warning', title: '请填写所有视频URL' })
                    return
                  }

                  const processedVideos = editingDocument.videos.map((v: any, index: number) => ({
                    ...v,
                    title: v.title || v.description || `${editingDocument.title} - 视频 ${index + 1}`,
                    order: index
                  }))

                  const firstUrl = processedVideos[0].url.trim()
                  const detectedPlatform = firstUrl.includes('youtube.com') || firstUrl.includes('youtu.be')
                    ? 'youtube'
                    : firstUrl.includes('bilibili.com')
                      ? 'bilibili'
                      : 'custom'

                  const videoData = {
                    title: editingDocument.title.trim(),
                    videoUrl: firstUrl,
                    videos: processedVideos,
                    platform: detectedPlatform as 'youtube' | 'bilibili' | 'custom',
                    description: editingDocument.summary || editingDocument.title,
                    content: editingDocument.summary || editingDocument.title,
                    summary: editingDocument.summary || editingDocument.title,
                    category: editingDocument.category || '',
                    author: 'admin',
                    documentType: 'video' as const,
                    language: dataLanguage
                  }

                  if (editingDocument?._id) {
                    await updateDocument(editingDocument._id, videoData, 'video')
                    showToast({ type: 'success', title: '更新成功' })
                  } else {
                    await createDocument(videoData)
                    showToast({ type: 'success', title: '创建成功' })
                  }

                  deleteDraft('video', editingDocument?._id)
                  setShowVideoEditModal(false)
                  setEditingDocument(null)
                  loadDocuments()
                } catch (error) {
                  showToast({ type: 'error', title: '操作失败' })
                }
              }}
            >
              {editingDocument?._id ? '更新' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 视频教程草稿恢复确认弹窗 */}
      <ConfirmDialog
        open={showVideoDraftDialog}
        onClose={() => {
          setShowVideoDraftDialog(false)
          setVideoDraftToRestore(null)
          deleteDraft('video', undefined)
        }}
        onConfirm={() => {
          if (videoDraftToRestore) {
            setEditingDocument(videoDraftToRestore)
          }
          setShowVideoDraftDialog(false)
          setVideoDraftToRestore(null)
        }}
        title="发现草稿"
        message="检测到未保存的草稿，是否恢复？"
        confirmText="恢复"
        cancelText="放弃"
      />

      {/* 预览 */}
      {showPreview && previewDocument && (
        <Modal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setPreviewDocument(null)
          }}
          title="文档预览"
          size="xl"
        >
          {(previewDocument.documentType || previewDocument.type) === 'structured' ? (
            <StructuredDocumentViewer
              document={previewDocument}
              onBack={() => {
                setShowPreview(false)
                setPreviewDocument(null)
              }}
            />
          ) : (
            <div className="prose max-w-none">
              <h2>{previewDocument.title}</h2>
              {previewDocument.summary && <p className="lead">{previewDocument.summary}</p>}
              <div dangerouslySetInnerHTML={sanitizeHTMLForReact(previewDocument.content || '')} />
            </div>
          )}
        </Modal>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', documentType: '' })}
        onConfirm={async () => {
          const { id, documentType } = deleteConfirm
          setDeleteConfirm({ open: false, id: '', documentType: '' })
          await handleDeleteDocument(id, documentType)
        }}
        title="删除文档"
        message="确定要删除这个文档吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        danger
      />
    </div>
  )
}

export default DocumentManagement

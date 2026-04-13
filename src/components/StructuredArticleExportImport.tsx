import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Download, Upload, FileJson, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import {
  exportStructuredArticles,
  downloadExportedArticles,
  importFromFile,
  validateImportFile
} from '@/services/structuredArticleExportService'

interface StructuredArticleExportImportProps {
  onImportComplete?: () => void
}

export const StructuredArticleExportImport: React.FC<StructuredArticleExportImportProps> = ({
  onImportComplete
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 导出状态
  const [isExporting, setIsExporting] = useState(false)
  const [exportStats, setExportStats] = useState<{
    count: number
    date: string
  } | null>(null)

  // 导入状态
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importConfirm, setImportConfirm] = useState<{ show: boolean; file: File | null }>({ show: false, file: null })
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: Array<{ article: string; error: string }>
  } | null>(null)
  const [showImportResults, setShowImportResults] = useState(false)

  /**
   * 处理导出
   */
  const handleExport = async () => {
    try {
      setIsExporting(true)

      showToast({
        type: 'info',
        title: t('common.processing') || 'Processing',
        description: t('admin.structuredArticle.export.processing') || 'Exporting articles...'
      })

      // 获取导出数据
      const exportData = await exportStructuredArticles()

      // 设置统计信息
      setExportStats({
        count: exportData.totalCount,
        date: exportData.exportDate
      })

      // 触发下载
      await downloadExportedArticles('structured-articles')

      showToast({
        type: 'success',
        title: t('common.success') || 'Success',
        description: t('admin.structuredArticle.export.success', { count: exportData.totalCount }) ||
                     `Successfully exported ${exportData.totalCount} articles`
      })
    } catch (error) {
      console.error('Export failed:', error)
      showToast({
        type: 'error',
        title: t('common.error') || 'Error',
        description: error instanceof Error ? error.message : 'Export failed'
      })
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * 处理导入文件选择
   */
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {return}

    // 验证文件
    const validation = validateImportFile(file)
    if (!validation.valid) {
      showToast({
        type: 'error',
        title: t('common.error') || 'Error',
        description: validation.message
      })
      return
    }

    // 通过 ConfirmDialog 确认导入
    setImportConfirm({ show: true, file })
  }

  /**
   * 执行导入（ConfirmDialog 确认后调用）
   */
  const executeImport = async () => {
    const file = importConfirm.file
    setImportConfirm({ show: false, file: null })
    if (!file) {return}

    try {
      setIsImporting(true)
      setImportProgress({ current: 0, total: 0 })
      setImportResults(null)

      showToast({
        type: 'info',
        title: t('common.processing') || 'Processing',
        description: t('admin.structuredArticle.import.processing') || 'Importing articles...'
      })

      // 执行导入
      const results = await importFromFile(file, (current, total) => {
        setImportProgress({ current, total })
      })

      setImportResults(results)
      setShowImportResults(true)

      if (results.failed === 0) {
        showToast({
          type: 'success',
          title: t('common.success') || 'Success',
          description: t('admin.structuredArticle.import.success', { count: results.success }) ||
                       `Successfully imported ${results.success} articles`
        })
        onImportComplete?.()
      } else {
        showToast({
          type: 'warning',
          title: t('admin.structuredArticle.import.partialSuccess') || 'Partial Success',
          description: t('admin.structuredArticle.import.partialSuccessDesc',
                       { success: results.success, failed: results.failed }) ||
                       `Imported ${results.success} articles, ${results.failed} failed`
        })
      }
    } catch (error) {
      console.error('Import failed:', error)
      showToast({
        type: 'error',
        title: t('common.error') || 'Error',
        description: error instanceof Error ? error.message : 'Import failed'
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /**
   * 触发文件选择
   */
  const triggerFileSelection = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary-300" />
            {t('admin.structuredArticle.exportImport.title') || 'Export & Import'}
          </CardTitle>
          <CardDescription>
            {t('admin.structuredArticle.exportImport.description') ||
             'Export all structured articles as JSON or import from a JSON file'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 导出部分 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">
              {t('admin.structuredArticle.export.title') || 'Export Articles'}
            </h3>
            <p className="text-sm text-gray-400">
              {t('admin.structuredArticle.export.description') ||
               'Download all structured articles as a JSON file for backup or migration'}
            </p>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
            >
              {isExporting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.exporting') || 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin.structuredArticle.export.button') || 'Export All Articles'}
                </>
              )}
            </Button>

            {exportStats && (
              <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary-300 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-primary-100">
                  <p className="font-medium">
                    {t('admin.structuredArticle.export.lastExport') || 'Last Export'}
                  </p>
                  <p className="text-xs text-primary-200 mt-1">
                    {exportStats.count} {t('admin.structuredArticle.export.articles') || 'articles'} •
                    {new Date(exportStats.date).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700"></div>

          {/* 导入部分 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">
              {t('admin.structuredArticle.import.title') || 'Import Articles'}
            </h3>
            <p className="text-sm text-gray-400">
              {t('admin.structuredArticle.import.description') ||
               'Import structured articles from a previously exported JSON file'}
            </p>

            <div className="flex gap-3">
              <Button
                onClick={triggerFileSelection}
                disabled={isImporting}
                variant="outline"
                className="hover:bg-gray-700/50"
              >
                {isImporting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.importing') || 'Importing...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t('admin.structuredArticle.import.button') || 'Import from File'}
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelected}
                className="hidden"
                disabled={isImporting}
              />
            </div>

            {/* 导入进度 */}
            {isImporting && importProgress.total > 0 && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-purple-200">
                    {t('admin.structuredArticle.import.progress') || 'Progress'}
                  </p>
                  <p className="text-sm text-purple-300">
                    {importProgress.current} / {importProgress.total}
                  </p>
                </div>
                <div className="w-full bg-purple-900/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(importProgress.current / importProgress.total) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* 导入结果 */}
            {showImportResults && importResults && (
              <div className={`rounded-lg p-4 space-y-3 ${
                importResults.failed === 0
                  ? 'bg-green-900/20 border border-green-500/30'
                  : importResults.success > 0
                  ? 'bg-yellow-900/20 border border-yellow-500/30'
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {importResults.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      importResults.failed === 0
                        ? 'text-green-100'
                        : 'text-yellow-100'
                    }`}>
                      {t('admin.structuredArticle.import.results') || 'Import Results'}
                    </p>
                    <div className="text-sm mt-2 space-y-1">
                      <p className={
                        importResults.failed === 0
                          ? 'text-green-200'
                          : 'text-yellow-200'
                      }>
                        ✅ {importResults.success} {t('admin.structuredArticle.import.successful') || 'successful'}
                      </p>
                      {importResults.failed > 0 && (
                        <p className="text-red-200">
                          ❌ {importResults.failed} {t('admin.structuredArticle.import.failed') || 'failed'}
                        </p>
                      )}
                    </div>

                    {/* 错误详情 */}
                    {importResults.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-gray-300 cursor-pointer hover:text-gray-200">
                          {t('admin.structuredArticle.import.errorDetails') || 'Error Details'} ({importResults.errors.length})
                        </summary>
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                          {importResults.errors.map((err, idx) => (
                            <div key={idx} className="text-xs text-gray-400 bg-black/30 p-2 rounded">
                              <p className="font-medium">{err.article}</p>
                              <p className="text-red-300">{err.error}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 导入注意事项 */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
              <p className="font-medium text-gray-300">{t('common.notes') || 'Notes'}:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('admin.structuredArticle.import.note1') || 'Only supports JSON files exported from this system'}</li>
                <li>{t('admin.structuredArticle.import.note2') || 'Maximum file size: 50MB'}</li>
                <li>{t('admin.structuredArticle.import.note3') || 'Duplicate articles will be created as new entries'}</li>
                <li>{t('admin.structuredArticle.import.note4') || 'Images and media are imported as URL references'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={importConfirm.show}
        onClose={() => {
          setImportConfirm({ show: false, file: null })
          if (fileInputRef.current) {fileInputRef.current.value = ''}
        }}
        onConfirm={executeImport}
        title={t('admin.structuredArticle.import.title') || 'Import Articles'}
        message={
          t('admin.structuredArticle.import.confirm') ||
          `Are you sure you want to import articles from "${importConfirm.file?.name ?? ''}"?`
        }
        confirmText={t('common.confirm') || '确认'}
        cancelText={t('common.cancel') || '取消'}
        type="warning"
      />
    </div>
  )
}

export default StructuredArticleExportImport

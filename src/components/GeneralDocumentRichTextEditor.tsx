import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Link,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { compressImage } from '@/utils/imageCompression'
import { useToast } from '@/components/ui/Toast'

interface GeneralDocumentRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * 专门用于通用文档的富文本编辑器
 * 确保图片使用高质量压缩，便于用户清晰辨认
 */
const GeneralDocumentRichTextEditor: React.FC<GeneralDocumentRichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = ""
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  const defaultPlaceholder = placeholder || t('knowledge.articleContentPlaceholder')
  const editorRef = useRef<HTMLDivElement>(null)

  const handleInputChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement
    onChange(target.innerHTML)
  }, [onChange])

  const handleBlurChange = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement
    onChange(target.innerHTML)
  }, [onChange])

  // 同步外部value变化 - 只在初始化或编辑器未聚焦时同步
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML
      const isFocused = document.activeElement === editorRef.current

      // 初始化时必须同步
      if (isInitialMount.current) {
        editorRef.current.innerHTML = value
        isInitialMount.current = false
        return
      }

      // 非初始化时：只有当编辑器不在焦点且内容确实不同时才更新
      // 这避免了在用户输入时被外部更新覆盖
      if (!isFocused && currentContent !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  // Ensure editor gets focus
  const ensureFocus = () => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  // 保存当前选区
  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {return}
    const range = selection.getRangeAt(0)
    if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range
    }
  }, [])

  // 恢复选区
  const restoreSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges()
      selection.addRange(savedRangeRef.current)
    } else {
      if (editorRef.current) {
        editorRef.current.focus()
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [])

  // 执行命令
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    ensureFocus()
  }, [])

  // 将 dataURL 转为 File
  const dataURLToFile = (dataUrl: string, name: string): File => {
    const arr = dataUrl.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {u8arr[n] = bstr.charCodeAt(n)}
    return new File([u8arr], name, { type: mime })
  }

  // 上传到后端
  const uploadToBackend = async (file: File, folder?: string): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    if (folder) {formData.append('folder', folder)}

    const res = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()
    if (!res.ok || !json?.success || !json?.url) {
      throw new Error(json?.error || 'Upload failed')
    }
    return json.url as string
  }

  // 处理文件 → 高质量压缩 → 上传 → 插入
  const handleFilesAndInsert = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (list.length === 0) {return}
    setIsUploading(true)
    try {
      restoreSelection()
      for (const file of list) {
        // 为通用文档中的图片使用高质量压缩，确保清晰可辨
        const compressedDataUrl = await compressImage(file, {
          compressionLevel: 'low', // 高质量压缩：1200x900, 90%质量
          format: 'jpeg'
        })
        const uploadFile = dataURLToFile(
          compressedDataUrl,
          file.name.replace(/\.[^.]+$/, '.jpg')
        )
        const url = await uploadToBackend(uploadFile, 'documents')
        restoreSelection()
        execCommand('insertImage', url)
        execCommand('insertHTML', '<br/>')
      }
    } catch (e) {
      showToast({ type: 'error', title: t('errors.serverError') })
    } finally {
      setIsUploading(false)
    }
  }, [restoreSelection, showToast, t, execCommand])

  // 打开文件选择
  const openFilePicker = useCallback(() => {
    saveSelection()
    fileInputRef.current?.click()
  }, [saveSelection])

  // 选择文件回调
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesAndInsert(files)
      e.currentTarget.value = ''
    }
  }, [handleFilesAndInsert])

  // 处理粘贴图片
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) {return}
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile()
        if (f) {imageFiles.push(f)}
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      saveSelection()
      handleFilesAndInsert(imageFiles)
    }
  }, [handleFilesAndInsert, saveSelection])

  // 处理拖拽图片
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) {return}
    const hasImage = Array.from(files).some(f => f.type.startsWith('image/'))
    if (hasImage) {
      e.preventDefault()
      e.stopPropagation()
      saveSelection()
      handleFilesAndInsert(files)
    }
  }, [handleFilesAndInsert, saveSelection])

  // 通过 URL 插入图片
  const insertImageByUrl = useCallback(() => {
    const url = prompt(t('documentEditor.videoLinkPlaceholder'))
    if (url) {
      saveSelection()
      execCommand('insertImage', url)
    }
  }, [saveSelection, execCommand])

  // Toolbar button
  const ToolbarButton = ({
    icon: Icon,
    command,
    value,
    onClick
  }: {
    icon: any
    command?: string
    value?: string
    onClick?: () => void
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onMouseDown={saveSelection}
      onClick={(e) => {
        e.preventDefault()
        if (command) {
          execCommand(command, value)
        }
        if (onClick) {
          onClick()
        }
      }}
      disabled={isUploading && !command}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* 工具栏 */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50">
        <ToolbarButton icon={Bold} command="bold" />
        <ToolbarButton icon={Italic} command="italic" />
        <ToolbarButton icon={Underline} command="underline" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" />
        <ToolbarButton icon={Quote} command="formatBlock" value="<blockquote>" />
        <ToolbarButton icon={Code} command="formatBlock" value="<pre>" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton icon={AlignLeft} command="justifyLeft" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" />
        <ToolbarButton icon={AlignRight} command="justifyRight" />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton icon={Image} onClick={openFilePicker} />
        <ToolbarButton icon={Image} onClick={insertImageByUrl} />
        <ToolbarButton icon={Link} onClick={() => {
          const url = prompt(t('ai.settingsPanel.tip'))
          if (url) {execCommand('createLink', url)}
        }} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* 编辑区 */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[200px] focus:outline-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400 [&:empty:before]:pointer-events-none whitespace-pre-wrap break-words overflow-wrap-anywhere"
        data-placeholder={defaultPlaceholder}
        onInput={handleInputChange}
        onBlur={handleBlurChange}
        onPaste={handlePaste}
        onDrop={handleDrop}
      />
    </div>
  )
}

export default GeneralDocumentRichTextEditor

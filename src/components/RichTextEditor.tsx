// RichTextEditor 组件
import React, { useRef, useEffect } from 'react'
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
// 新增：上传/压缩与提示
import { useState, useCallback } from 'react'
import { compressImage } from '@/utils/imageCompression'
import { useToast } from '@/components/ui/Toast'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Rich Text Editor Component
 * Using simpler and more reliable methods
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = ""
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 保存当前编辑器选区，确保异步上传后能在正确位置插入
  const savedRangeRef = useRef<Range | null>(null)

  const defaultPlaceholder = placeholder || t('knowledge.articleContentPlaceholder')
  const editorRef = useRef<HTMLDivElement>(null)

  // 新增：分别兼容 onInput / onBlur 的事件签名，避免类型报错，并使用事件对象
  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const newContent = target.innerHTML
    onChange(newContent)
  }

  const handleBlurChange = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const newContent = target.innerHTML
    onChange(newContent)
  }

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

  // 保存当前选区（仅当选区在编辑器内部时）
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
      // 如果没有保存的选区，则将光标移到内容末尾
      if (editorRef.current) {
        editorRef.current.focus()
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
        savedRangeRef.current = range
      }
    }
  }, [])

  // 执行命令插入，并触发变更
  const execCommand = (command: string, value?: string) => {
    ensureFocus()
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // 通过 URL 插入图片（保留原有功能）
  const insertImageByUrl = () => {
    const url = prompt(t('documentEditor.videoLinkPlaceholder'))
    if (url) {
      execCommand('insertImage', url)
    }
  }

  // 数据 URL 转 File（用于上传）
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

  // 上传到后端并返回 URL（与 ImageUpload 逻辑一致）
  const uploadToBackend = async (file: File, folder: string = 'documents', customName?: string): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    if (folder) {formData.append('folder', folder)}
    if (customName) {formData.append('fileName', customName)}

    const res = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()
    if (!res.ok || !json?.success || !json?.url) {
      throw new Error(json?.error || t('errors.uploadFailed'))
    }
    return json.url as string
  }

  // 处理文件 → 压缩 → 上传 → 插入（顺序处理保证多图顺序）
  const handleFilesAndInsert = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (list.length === 0) {return}
    setIsUploading(true)
    try {
      // 插入前恢复到用户上次的光标处
      restoreSelection()
      for (const file of list) {
        // 为文档内容中的图片使用高质量压缩，确保清晰可辨
        const compressedDataUrl = await compressImage(file, {
          compressionLevel: 'low', // 高质量压缩：1200x900, 90%质量
          format: 'jpeg'
        })
        // 统一 .jpg 扩展
        const uploadFile = dataURLToFile(
          compressedDataUrl,
          file.name.replace(/\.[^.]+$/, '.jpg')
        )
        // 上传
        const url = await uploadToBackend(uploadFile, 'documents')
        // 每次上传成功后恢复选区并插入（避免用户在等待时移动光标导致错位）
        restoreSelection()
        execCommand('insertImage', url)
        // 每张图片后追加一个换行，增强排版可读性
        execCommand('insertHTML', '<br/>')
      }
    } catch (e) {
      showToast({ type: 'error', title: t('errors.serverError') })
    } finally {
      setIsUploading(false)
    }
  }, [restoreSelection, showToast, t])

  // 打开文件选择
  const openFilePicker = useCallback(() => {
    // 先保存选区，防止点击按钮导致选区丢失
    saveSelection()
    fileInputRef.current?.click()
  }, [saveSelection])

  // 选择文件回调
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesAndInsert(files)
      // 重置 input 以便下次选择同一文件也能触发 onChange
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
        {/* 改造：图片按钮 → 打开文件选择（支持多图、粘贴/拖拽也支持） */}
        <ToolbarButton icon={Image} onClick={openFilePicker} />
        {/* 保留：通过 URL 插入图片 */}
        <ToolbarButton icon={Image} onClick={insertImageByUrl} />
        <ToolbarButton icon={Link} onClick={() => {
          const url = prompt(t('documentEditor.videoLinkPlaceholder'))
          if (url) {execCommand('createLink', url)}
        }} />
        {/* 隐藏文件 input */}
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

export default RichTextEditor
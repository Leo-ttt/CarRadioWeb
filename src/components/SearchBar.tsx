import React, { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Package, HelpCircle, Download, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { globalSearch, type SearchResult as GlobalSearchResult, type SearchResultType } from '@/services/searchService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import { useLanguage } from '@/hooks/useLanguage'

interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  icon: React.ElementType
  href: string
  views?: number
  date?: string
}

interface SearchBarProps {
  className?: string
  placeholder?: string
  onResultClick?: (result: SearchResult) => void
  /** 紧凑模式：只显示搜索图标，点击展开 */
  compact?: boolean
}

// Icon mapping for search result types
const RESULT_TYPE_ICONS: Record<SearchResultType, React.ElementType> = {
  product: Package,
  document: FileText,
  faq: HelpCircle,
  software: Download,
  manual: BookOpen
}

/**
 * 搜索栏组件
 * 支持全局搜索：产品、文档、FAQ、软件、手册
 */
const SearchBar: React.FC<SearchBarProps> = ({
  className = "",
  placeholder,
  onResultClick,
  compact = false
}) => {
  const { t } = useTranslation()
  const { contentLanguage } = useContentLanguage()
  const { getLocalizedPath } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 搜索逻辑
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const response = await globalSearch(searchQuery, contentLanguage)

      // Transform global search results to SearchBar format
      const transformedResults: SearchResult[] = (response.results || []).map((result: GlobalSearchResult) => ({
        id: result.id,
        type: result.type,
        title: result.title,
        subtitle: result.description || t(`search.type.${result.type}`),
        icon: RESULT_TYPE_ICONS[result.type] || FileText,
        href: getLocalizedPath(result.url)
      }))

      setResults(transformedResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, contentLanguage])

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (compact) {
          setIsExpanded(false)
          setQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [compact])

  // 处理结果点击
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    }
    setIsOpen(false)
    setQuery('')
  }

  // 清空搜索
  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (compact) {
      setIsExpanded(false)
    }
  }

  // 展开搜索框
  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // 紧凑模式：只显示图标按钮
  if (compact && !isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        title={t('search.placeholder')}
      >
        <Search className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div ref={searchRef} className={`relative ${className} ${compact ? 'w-64' : ''}`}>
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || t('search.placeholder')}
          className="w-full pl-10 pr-10 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      {isOpen && (query || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg dark:shadow-xl dark:shadow-black/20 z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 dark:text-gray-400">
              <LoadingSpinner size="md" className="mb-2" />
              <p>{t('search.loading')}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <result.icon className="h-5 w-5 text-slate-400 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-800 dark:text-white line-clamp-2 mb-1">
                        {result.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-1">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-gray-500 uppercase flex-shrink-0">
                      {t(`search.type.${result.type}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : query && query.length >= 2 ? (
            <div className="p-4 text-center text-slate-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-gray-500" />
              <p>{t('search.noResults')}</p>
              <p className="text-sm mt-1">{t('common.tryDifferentSearch')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SearchBar

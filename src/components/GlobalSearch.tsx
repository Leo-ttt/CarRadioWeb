/**
 * Global Search Component
 * Search modal with results from products, documents, FAQ, software, and manuals
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, X, FileText, Package, HelpCircle, Loader2, Download, BookOpen } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLanguage } from '@/hooks/useLanguage'
import { useContentLanguage } from '@/contexts/ContentLanguageContext'
import { globalSearch, type SearchResult, type SearchResultType } from '@/services/searchService'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

const RESULT_TYPE_ICONS: Record<SearchResultType, React.ElementType> = {
  product: Package,
  document: FileText,
  faq: HelpCircle,
  software: Download,
  manual: BookOpen
}

const RESULT_TYPE_COLORS: Record<SearchResultType, string> = {
  product: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  document: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  faq: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  software: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
  manual: 'text-teal-500 bg-teal-50 dark:bg-teal-900/30'
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getLocalizedPath } = useLanguage()
  const { contentLanguage } = useContentLanguage()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await globalSearch(query, contentLanguage)
        setResults(response.results)
        setSelectedIndex(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, contentLanguage])

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    navigate(getLocalizedPath(result.url))
    onClose()
  }, [navigate, getLocalizedPath, onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }, [results, selectedIndex, handleSelect, onClose])

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) {return null}

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 outline-none text-lg"
          />
          {loading && <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length >= MIN_QUERY_LENGTH && results.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 dark:text-gray-400">
              {t('search.noResults')}
            </div>
          )}

          {results.length > 0 && (
            <ul className="py-2">
              {results.map((result, index) => {
                const Icon = RESULT_TYPE_ICONS[result.type]
                const colorClass = RESULT_TYPE_COLORS[result.type]
                const isSelected = index === selectedIndex

                return (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'bg-slate-100 dark:bg-gray-700'
                          : 'hover:bg-slate-50 dark:hover:bg-gray-700/50'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 dark:text-white truncate">
                          {result.title}
                        </div>
                        {result.description && (
                          <div className="text-sm text-slate-500 dark:text-gray-400 truncate">
                            {result.description}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-gray-500 uppercase">
                        {t(`search.type.${result.type}`)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Keyboard hints */}
          {results.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 dark:border-gray-700 text-xs text-slate-400">
              <span>↑↓ {t('search.navigate')}</span>
              <span>↵ {t('search.select')}</span>
              <span>esc {t('search.close')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalSearch

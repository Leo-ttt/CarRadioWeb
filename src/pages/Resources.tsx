/**
 * Public resources page — Pintree-inspired design
 * Sidebar category nav + card grid + search + dark mode
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Search, Globe, ChevronRight } from 'lucide-react'
import { getPublicResources, type ResourceGroup } from '@/services/resourceLinkService'
import SEOHead from '@/components/seo/SEOHead'

// ==================== Constants ====================

const FAVICON_SIZE = 20
const SCROLL_OFFSET = 80

// ==================== Helpers ====================

const getFaviconUrl = (url: string, customFavicon?: string): string => {
  if (customFavicon) {return customFavicon}
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${FAVICON_SIZE * 2}`
  } catch {
    return ''
  }
}

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// ==================== Sub-components ====================

interface CategoryNavProps {
  groups: ResourceGroup[]
  activeCategoryId: string
  onCategoryClick: (id: string) => void
}

function CategoryNav({ groups, activeCategoryId, onCategoryClick }: CategoryNavProps) {
  return (
    <nav className="space-y-1" aria-label="Resource categories">
      {groups.map(g => {
        const isActive = activeCategoryId === g.category._id
        return (
          <button
            key={g.category._id}
            type="button"
            onClick={() => onCategoryClick(g.category._id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              isActive
                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-medium'
                : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800/50 hover:text-slate-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="truncate">{g.category.name}</span>
            <span className={`text-xs tabular-nums ${
              isActive ? 'text-sky-500' : 'text-slate-400 dark:text-gray-500'
            }`}>
              {g.links.length}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

interface LinkCardProps {
  title: string
  url: string
  description: string
  favicon: string
}

function LinkCard({ title, url, description, favicon }: LinkCardProps) {
  const [imgError, setImgError] = useState(false)
  const faviconSrc = getFaviconUrl(url, favicon)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-start gap-3.5 p-4 rounded-xl
        border border-slate-200/80 dark:border-gray-700/50
        bg-white dark:bg-gray-800/40
        hover:border-sky-300/70 dark:hover:border-sky-600/50
        hover:shadow-lg hover:shadow-sky-500/5 dark:hover:shadow-sky-400/5
        transition-all duration-300 ease-out"
    >
      {/* Favicon */}
      <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700/60 flex items-center justify-center overflow-hidden">
        {faviconSrc && !imgError ? (
          <img
            src={faviconSrc}
            alt=""
            width={FAVICON_SIZE}
            height={FAVICON_SIZE}
            className="rounded"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Globe className="w-4 h-4 text-slate-400 dark:text-gray-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-slate-800 dark:text-gray-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {title}
          </span>
          <ExternalLink className="w-3 h-3 text-slate-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <span className="text-[11px] text-slate-400 dark:text-gray-500 mt-1.5 block truncate">
          {extractDomain(url)}
        </span>
      </div>
    </a>
  )
}

// ==================== Main ====================

const Resources = () => {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<ResourceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    getPublicResources()
      .then(data => {
        setGroups(data)
        if (data.length > 0) {setActiveCategoryId(data[0].category._id)}
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? groups.map(g => ({
        ...g,
        links: g.links.filter(l =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.description?.toLowerCase().includes(search.toLowerCase()) ||
          l.url.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.links.length > 0)
    : groups

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategoryId(id)
    const el = sectionRefs.current[id]
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  // Intersection observer for active category tracking
  useEffect(() => {
    if (filtered.length === 0) {return}

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id.replace('section-', ''))
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    Object.values(sectionRefs.current).forEach(el => {
      if (el) {observer.observe(el)}
    })

    return () => observer.disconnect()
  }, [filtered])

  if (loading) {
    return (
      <div className="page-container-deep flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-sky-500" />
      </div>
    )
  }

  const totalLinks = groups.reduce((sum, g) => sum + g.links.length, 0)

  return (
    <div className="page-container-deep">
      <SEOHead
        title={t('resources.title', 'Resources')}
        description={t('resources.subtitle', 'Curated collection of useful automotive industry resources and tools.')}
        keywords={['resources', 'tools', 'automotive industry', 'useful links']}
      />
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            {t('resources.title', 'Resources')}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm max-w-xl">
            {t('resources.subtitle', 'Curated collection of useful automotive industry resources and tools.')}
          </p>
          {totalLinks > 0 && (
            <span className="inline-block mt-2 text-xs text-slate-400 dark:text-gray-500">
              {t('resources.totalCount', '{{count}} resources across {{categories}} categories', {
                count: totalLinks,
                categories: groups.length,
              })}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('resources.searchPlaceholder', 'Search resources...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
              border border-slate-200 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-slate-800 dark:text-white
              placeholder-slate-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500
              transition-colors"
            aria-label={t('resources.searchPlaceholder', 'Search resources...')}
          />
        </div>

        {/* Layout: sidebar + content */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-gray-500 text-sm">
            {search
              ? t('resources.noResults', 'No matching resources found.')
              : t('resources.empty', 'No resources available yet.')}
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Sidebar — hidden on mobile */}
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                  {t('resources.categories', 'Categories')}
                </h3>
                <CategoryNav
                  groups={filtered}
                  activeCategoryId={activeCategoryId}
                  onCategoryClick={scrollToCategory}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-10">
              {filtered.map(group => (
                <section
                  key={group.category._id}
                  id={`section-${group.category._id}`}
                  ref={el => { sectionRefs.current[group.category._id] = el }}
                >
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-4">
                    <ChevronRight className="w-4 h-4 text-sky-500" />
                    <h2 className="text-base font-semibold text-slate-700 dark:text-gray-200">
                      {group.category.name}
                    </h2>
                    <span className="text-xs text-slate-400 dark:text-gray-500">
                      ({group.links.length})
                    </span>
                  </div>
                  {group.category.description && (
                    <p className="text-xs text-slate-400 dark:text-gray-500 mb-4 -mt-2 ml-6">
                      {group.category.description}
                    </p>
                  )}

                  {/* Card grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.links.map(link => (
                      <LinkCard
                        key={link._id}
                        title={link.title}
                        url={link.url}
                        description={link.description}
                        favicon={link.favicon}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {filtered.length > 0 && (
          <p className="mt-14 text-[11px] text-slate-300 dark:text-gray-600 text-center">
            {t('resources.disclaimer', 'These are third-party resources for reference only. We are not affiliated with any of these websites.')}
          </p>
        )}
      </div>
    </div>
  )
}

export default Resources

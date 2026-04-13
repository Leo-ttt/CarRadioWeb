/**
 * Article JSON-LD structured data
 * Generates article rich results in Google Search for document detail pages
 */

import { useEffect } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const SCHEMA_SCRIPT_ID = 'ld-json-article'
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin

interface ArticleSchemaProps {
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  authorName?: string
}

/** Resolve relative image URLs to absolute */
function resolveImageUrl(url: string | undefined): string {
  if (!url) {return `${SITE_URL}/images/og-default.jpg`}
  if (url.startsWith('http')) {return url}
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export const ArticleSchema: React.FC<ArticleSchemaProps> = ({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
}) => {
  const { siteSettings } = useSiteSettings()
  const resolvedAuthor = authorName || siteSettings?.siteName || 'Organization'
  useEffect(() => {
    if (!title) {return}

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
      image: resolveImageUrl(image),
      author: {
        '@type': 'Organization',
        name: resolvedAuthor,
      },
      publisher: {
        '@type': 'Organization',
        name: resolvedAuthor,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/images/logo.png`,
        },
      },
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
    }

    let script = document.getElementById(SCHEMA_SCRIPT_ID)
    if (!script) {
      script = document.createElement('script')
      script.id = SCHEMA_SCRIPT_ID
      script.setAttribute('type', 'application/ld+json')
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schema)

    return () => {
      const el = document.getElementById(SCHEMA_SCRIPT_ID)
      el?.remove()
    }
  }, [title, description, url, image, datePublished, dateModified, resolvedAuthor])

  return null
}

export default ArticleSchema

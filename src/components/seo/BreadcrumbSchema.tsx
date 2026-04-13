/**
 * BreadcrumbList JSON-LD structured data
 * Generates breadcrumb rich results in Google Search
 */

import { useEffect } from 'react'

const SCHEMA_SCRIPT_ID = 'ld-json-breadcrumb'
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin

interface BreadcrumbItem {
  name: string
  path: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({ items }) => {
  useEffect(() => {
    if (items.length === 0) {return}

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
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
  }, [items])

  return null
}

export default BreadcrumbSchema

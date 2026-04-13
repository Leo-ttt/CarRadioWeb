/**
 * Organization JSON-LD structured data
 * Injected on the homepage to provide company info to search engines
 */

import { useEffect } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const SCHEMA_SCRIPT_ID = 'ld-json-organization'
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin

export const OrganizationSchema: React.FC = () => {
  const { siteSettings } = useSiteSettings()

  useEffect(() => {
    const siteName = siteSettings?.siteName || 'Organization'

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`,
      image: `${SITE_URL}/images/og-default.jpg`,
      description: 'Professional automotive electronics manufacturer specializing in CarPlay, Android Auto, and car multimedia systems.',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: `${SITE_URL}/contact`,
        availableLanguage: ['English'],
      },
      sameAs: [],
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
  }, [siteSettings])

  return null
}

export default OrganizationSchema

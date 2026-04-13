/**
 * Product JSON-LD structured data
 * Generates product rich results in Google Search
 */

import { useEffect } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const SCHEMA_SCRIPT_ID = 'ld-json-product'
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin

interface ProductSchemaItem {
  name: string
  description: string
  image: string
  category?: string
}

interface ProductSchemaProps {
  products: ProductSchemaItem[]
  brandName?: string
}

/** Resolve relative image URLs to absolute */
function resolveImageUrl(url: string): string {
  if (!url) {return `${SITE_URL}/images/og-default.jpg`}
  if (url.startsWith('http')) {return url}
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export const ProductSchema: React.FC<ProductSchemaProps> = ({
  products,
  brandName,
}) => {
  const { siteSettings } = useSiteSettings()
  const resolvedBrand = brandName || siteSettings?.siteName || 'Organization'
  useEffect(() => {
    if (products.length === 0) {return}

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${resolvedBrand} Products`,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: resolveImageUrl(product.image),
          brand: {
            '@type': 'Brand',
            name: resolvedBrand,
          },
          ...(product.category ? { category: product.category } : {}),
        },
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
  }, [products, brandName, resolvedBrand])

  return null
}

export default ProductSchema

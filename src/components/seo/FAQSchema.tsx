/**
 * FAQPage JSON-LD structured data
 * Generates FAQ rich results in Google Search
 */

import { useEffect } from 'react'

const SCHEMA_SCRIPT_ID = 'ld-json-faq'

interface FAQEntry {
  question: string
  answer: string
}

interface FAQSchemaProps {
  items: FAQEntry[]
}

export const FAQSchema: React.FC<FAQSchemaProps> = ({ items }) => {
  useEffect(() => {
    if (items.length === 0) {return}

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
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
  }, [items])

  return null
}

export default FAQSchema

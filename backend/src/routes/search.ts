/**
 * Global Search API Route
 * Search across products, documents, FAQ, software, and user manuals
 */

import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import Product from '../models/Product'
import Document from '../models/Document'
import Software from '../models/Software'
import logger from '../utils/logger'

const router = Router()

const MAX_RESULTS_PER_TYPE = 5
const MIN_QUERY_LENGTH = 2

// PDF directory for user manuals
const PDF_DIR = path.join(__dirname, '../../../public/PDF')

type SearchResultType = 'product' | 'document' | 'faq' | 'software' | 'manual'

interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  description?: string
  url: string
  image?: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

/**
 * Search user manual PDF files
 */
function searchUserManuals(searchRegex: RegExp): SearchResult[] {
  const results: SearchResult[] = []
  
  try {
    if (!fs.existsSync(PDF_DIR)) {
      return results
    }
    
    const files = fs.readdirSync(PDF_DIR)
    const pdfFiles = files.filter(file => 
      path.extname(file).toLowerCase() === '.pdf' && 
      searchRegex.test(file)
    )
    
    pdfFiles.slice(0, MAX_RESULTS_PER_TYPE).forEach(file => {
      results.push({
        type: 'manual',
        id: `manual-${file}`,
        title: file.replace('.pdf', ''),
        description: 'PDF User Manual',
        url: '/user-manual'
      })
    })
  } catch (error) {
    logger.warn({ error }, 'Failed to search user manuals')
  }
  
  return results
}

/**
 * GET /api/search
 * Global search endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, lang: langParam = 'en' } = req.query
    const lang = String(langParam)
    const query = String(q || '').trim()

    if (query.length < MIN_QUERY_LENGTH) {
      return res.json({ results: [], total: 0, query })
    }

    // Escape special regex characters to prevent ReDoS attacks
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedQuery, 'i')
    const results: SearchResult[] = []

    // Search products
    const products = await Product.find({
      $or: [
        { [`name.${lang}`]: searchRegex },
        { [`description.${lang}`]: searchRegex }
      ],
      isActive: true
    })
      .limit(MAX_RESULTS_PER_TYPE)
      .select('name description slug images')
      .lean()

    products.forEach((product) => {
      const typedProduct = product as unknown as {
        _id: unknown
        name?: Record<string, string>
        description?: Record<string, string>
        slug?: string
        images?: string[]
      }
      results.push({
        type: 'product',
        id: String(typedProduct._id),
        title: typedProduct.name?.[lang] || typedProduct.name?.en || '',
        description: typedProduct.description?.[lang] || typedProduct.description?.en || '',
        url: `/products/${typedProduct.slug}`,
        image: typedProduct.images?.[0]
      })
    })

    // Search documents (general and video tutorials)
    const documents = await Document.find({
      $or: [
        { [`title.${lang}`]: searchRegex },
        { [`content.${lang}`]: searchRegex }
      ],
      status: 'published',
      documentType: { $in: ['general', 'video'] }
    })
      .limit(MAX_RESULTS_PER_TYPE)
      .select('title documentType slug heroImage')
      .lean()

    documents.forEach((doc) => {
      const typedDoc = doc as unknown as {
        _id: unknown
        title?: Record<string, string>
        documentType?: string
        slug?: string
        heroImage?: string
      }
      results.push({
        type: 'document',
        id: String(typedDoc._id),
        title: typedDoc.title?.[lang] || typedDoc.title?.en || '',
        url: `/knowledge/document/${typedDoc.slug || typedDoc._id}`,
        image: typedDoc.heroImage
      })
    })

    // Search structured documents (title match)
    const structuredDocs = await Document.find({
      [`title.${lang}`]: searchRegex,
      status: 'published',
      documentType: 'structured'
    })
      .limit(MAX_RESULTS_PER_TYPE)
      .select('title slug heroImage')
      .lean()

    structuredDocs.forEach((doc) => {
      const typedDoc = doc as unknown as {
        _id: unknown
        title?: Record<string, string>
        slug?: string
        heroImage?: string
      }
      results.push({
        type: 'document',
        id: String(typedDoc._id),
        title: typedDoc.title?.[lang] || typedDoc.title?.en || '',
        url: `/knowledge/document/${typedDoc.slug || typedDoc._id}`,
        image: typedDoc.heroImage
      })
    })

    // Search FAQ (structured documents with FAQ sections)
    const faqDocs = await Document.find({
      documentType: 'structured',
      'structuredContent.faqs': { $exists: true, $ne: [] },
      status: 'published'
    })
      .limit(MAX_RESULTS_PER_TYPE * 2)
      .select('title structuredContent slug')
      .lean()

    faqDocs.forEach((doc) => {
      const typedDoc = doc as unknown as {
        _id: unknown
        title?: Record<string, string>
        structuredContent?: {
          faqs?: Array<{
            question?: Record<string, string>
            answer?: Record<string, string>
          }>
        }
        slug?: string
      }
      const faqs = typedDoc.structuredContent?.faqs || []
      faqs.forEach((faq, idx) => {
        const question = faq.question?.[lang] || faq.question?.en || ''
        if (searchRegex.test(question)) {
          results.push({
            type: 'faq',
            id: `${typedDoc._id}-faq-${idx}`,
            title: question,
            url: `/knowledge/document/${typedDoc.slug || typedDoc._id}#faq-${idx}`
          })
        }
      })
    })

    // Search software downloads
    const contentLang = 'en'
    const software = await Software.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ],
      language: contentLang
    })
      .limit(MAX_RESULTS_PER_TYPE)
      .select('name description')
      .lean()

    software.forEach((sw) => {
      const typedSw = sw as unknown as {
        _id: unknown
        name?: string
        description?: string
      }
      results.push({
        type: 'software',
        id: String(typedSw._id),
        title: typedSw.name || '',
        description: typedSw.description || '',
        url: '/software-downloads'
      })
    })

    // Search user manuals (PDF files)
    const manualResults = searchUserManuals(searchRegex)
    results.push(...manualResults)

    // Deduplicate by id
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex(r => r.id === result.id)
    )

    // Limit total results
    const limitedResults = uniqueResults.slice(0, MAX_RESULTS_PER_TYPE * 4)

    const response: SearchResponse = {
      results: limitedResults,
      total: limitedResults.length,
      query
    }

    res.json(response)
  } catch (error: unknown) {
    logger.error({ err: error }, 'Search error')
    res.status(500).json({ success: false, message: 'Search failed' })
  }
})

export default router

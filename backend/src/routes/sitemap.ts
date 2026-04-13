/**
 * Dynamic sitemap.xml generator
 * Generates sitemap from static routes + dynamic document slugs
 */

import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { createLogger } from '../utils/logger'

const logger = createLogger('sitemap-route')

const router = Router()

const SITE_URL = process.env.SITE_URL || 'https://protonavi.com'
const SUPPORTED_LANGS = ['en'] as const

/** Static page paths with their change frequency and priority */
const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: number }> = [
  { path: '', changefreq: 'daily', priority: 1.0 },
  { path: 'products', changefreq: 'weekly', priority: 0.9 },
  { path: 'knowledge', changefreq: 'weekly', priority: 0.8 },
  { path: 'knowledge/vehicle-data', changefreq: 'weekly', priority: 0.7 },
  { path: 'knowledge/video-tutorials', changefreq: 'weekly', priority: 0.7 },
  { path: 'knowledge/tutorials', changefreq: 'weekly', priority: 0.7 },
  { path: 'knowledge/canbus-settings', changefreq: 'weekly', priority: 0.7 },
  { path: 'about', changefreq: 'monthly', priority: 0.7 },
  { path: 'quality', changefreq: 'monthly', priority: 0.7 },
  { path: 'contact', changefreq: 'monthly', priority: 0.6 },
  { path: 'faq', changefreq: 'monthly', priority: 0.6 },
  { path: 'news', changefreq: 'weekly', priority: 0.7 },
  { path: 'resources', changefreq: 'weekly', priority: 0.6 },
  { path: 'software-downloads', changefreq: 'weekly', priority: 0.6 },
  { path: 'user-manual', changefreq: 'monthly', priority: 0.5 },
]

/** Build a single <url> entry */
function buildUrlEntry(loc: string, lastmod: string, changefreq: string, priority: number): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`
}

/** Fetch published documents with slugs from DB */
async function fetchDocumentSlugs(): Promise<Array<{ type: string; slug: string; updatedAt: string }>> {
  try {
    if (mongoose.connection.readyState !== 1) return []

    const Document = mongoose.model('Document')
    const docs = await Document.find(
      { status: 'published', slug: { $exists: true, $ne: '' } },
      { slug: 1, type: 1, updatedAt: 1 }
    ).lean()

    return (docs as unknown as Array<{ slug: string; type: string; updatedAt: Date }>).map(d => ({
      type: d.type || 'article',
      slug: d.slug,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }))
  } catch {
    return []
  }
}

/** GET /sitemap.xml */
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const entries: string[] = []

    // Static pages — generate for each supported language
    for (const lang of SUPPORTED_LANGS) {
      for (const page of STATIC_PAGES) {
        const pagePath = page.path ? `/${lang}/${page.path}` : `/${lang}`
        entries.push(buildUrlEntry(`${SITE_URL}${pagePath}`, today, page.changefreq, page.priority))
      }
    }

    // Dynamic document pages
    const documents = await fetchDocumentSlugs()
    for (const doc of documents) {
      for (const lang of SUPPORTED_LANGS) {
        const docPath = `/${lang}/knowledge/${doc.type}/${doc.slug}`
        entries.push(buildUrlEntry(`${SITE_URL}${docPath}`, doc.updatedAt, 'weekly', 0.6))
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.set('Cache-Control', 'public, max-age=3600') // 1 hour cache
    res.send(xml)
  } catch (error) {
    logger.error({ error }, 'Sitemap generation failed')
    res.status(500).set('Content-Type', 'text/plain').send('Sitemap generation failed')
  }
})

export default router

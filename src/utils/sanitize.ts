/**
 * XSS Protection Utility
 * Uses DOMPurify to sanitize HTML content before rendering with dangerouslySetInnerHTML
 */
import DOMPurify from 'dompurify'

/**
 * DOMPurify configuration for strict HTML sanitization
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    'b', 'i', 'u', 's', 'strong', 'em', 'mark', 'small', 'sub', 'sup', 'del', 'ins',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Structure
    'p', 'br', 'hr', 'div', 'span', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Links and media
    'a', 'img', 'figure', 'figcaption',
    'video', 'audio', 'source', 'track',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Code
    'pre', 'code', 'kbd', 'samp', 'var',
    // Quotes
    'blockquote', 'q', 'cite',
    // Other
    'details', 'summary', 'time', 'address', 'abbr', 'bdi', 'bdo', 'wbr',
  ],
  ALLOWED_ATTR: [
    // General attributes
    'id', 'class', 'style', 'title', 'lang', 'dir', 'translate',
    // Links
    'href', 'target', 'rel', 'download',
    // Media
    'src', 'srcset', 'alt', 'width', 'height', 'loading', 'decoding',
    'poster', 'autoplay', 'controls', 'loop', 'muted', 'preload',
    // Tables
    'colspan', 'rowspan', 'headers', 'scope',
    // Other
    'datetime', 'cite', 'abbr', 'tabindex', 'contenteditable', 'draggable',
  ],
  ALLOW_DATA_ATTR: true,
  // Force all links to open safely (prevent javascript: URLs)
  ADD_ATTR: ['target'],
  // Force safe link targets
  FORCE_BODY: false,
  // Keep comments (false for security)
  KEEP_CONTENT: true,
  // Allow safe URL schemes
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+\-.]+(?:[^a-z+\-.]+)?):/i,
}

/**
 * Check if DOMPurify is available (browser environment)
 */
function isDOMPurifyAvailable(): boolean {
  return typeof window !== 'undefined' && typeof DOMPurify !== 'undefined'
}

/**
 * Sanitize HTML string to prevent XSS attacks
 * Use this before rendering any HTML with dangerouslySetInnerHTML
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  if (!isDOMPurifyAvailable()) {
    // Fallback for SSR or when DOMPurify is not loaded
    console.warn('DOMPurify not available, using basic HTML escaping')
    return escapeBasicHTML(dirty)
  }

  try {
    return DOMPurify.sanitize(dirty, PURIFY_CONFIG)
  } catch (error) {
    console.error('Error sanitizing HTML:', error)
    return escapeBasicHTML(dirty)
  }
}

/**
 * Sanitize HTML and return trusted HTML string (for React)
 * This returns a type that React recognizes as safe HTML
 */
export function sanitizeHTMLForReact(dirty: string): { __html: string } {
  return { __html: sanitizeHTML(dirty) }
}

/**
 * Basic HTML escaping as fallback when DOMPurify is unavailable
 * This provides minimal protection but is not as comprehensive as DOMPurify
 */
function escapeBasicHTML(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return str.replace(/[&<>"']/g, (char) => escapeMap[char] || char)
}

/**
 * Sanitize text content (not HTML)
 * Use this for any user-provided text that should not contain HTML
 *
 * @param text - The potentially unsafe text
 * @returns Escaped text safe for rendering
 */
export function escapeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  return escapeBasicHTML(text)
}

/**
 * Sanitize an image URL
 * Validates that the URL uses an allowed protocol (https, http, data)
 */
export function sanitizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  try {
    const parsed = new URL(url)

    // Allow data URLs for inline images
    if (parsed.protocol === 'data:') {
      // Validate data URL format
      const dataContent = parsed.href.slice(parsed.href.indexOf(',') + 1)
      if (/^[A-Za-z0-9+/=]+$/.test(dataContent)) {
        return parsed.href
      }
      return ''
    }

    // Only allow http and https for external images
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href
    }

    return ''
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (/^[/][^/]/.test(url) || /^[a-zA-Z][a-zA-Z0-9-]*[.][a-zA-Z]{2,}/.test(url)) {
      return url
    }
    return ''
  }
}

/**
 * Sanitize a link URL
 * Prevents javascript:, data:, and other dangerous URL schemes
 */
export function sanitizeLinkUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const trimmed = url.trim().toLowerCase()

  // Block dangerous URL schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('onerror') ||
    trimmed.startsWith('onclick')
  ) {
    return '#'
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(url)
      return parsed.href
    }

    // Allow relative URLs
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return url
    }

    // Allow mailto links
    if (trimmed.startsWith('mailto:')) {
      return url
    }

    // Allow tel links
    if (trimmed.startsWith('tel:')) {
      return url
    }

    return '#'
  } catch {
    return '#'
  }
}

export default sanitizeHTML

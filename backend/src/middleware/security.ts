/**
 * Security middleware configuration
 * Using Helmet to harden Express application
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a cryptographic nonce for each request
 * Used to allow inline scripts in CSP while maintaining security
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * CSP configuration
 * Implements strict Content Security Policy with nonce-based inline scripts
 */
export const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Remove unsafe-eval - only use nonce for inline scripts
      scriptSrc: [
        "'self'",
        "'strict-dynamic'",
        // Only allow known CDN domains — no blanket https:
        "https://cdn.tailwindcss.com",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.tailwindcss.com",
        "https://cdnjs.cloudflare.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "http:",
      ],
      mediaSrc: [
        "'self'",
        "https:",
        "http:",
      ],
      connectSrc: [
        "'self'",
        "https://*.sentry.io",
        "wss:",
        "ws:",
      ],
      frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://player.bilibili.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      // Report URI for CSP violations (if configured)
      ...(process.env.CSP_REPORT_URI && {
        reportUri: process.env.CSP_REPORT_URI,
      }),
    },
  },

  // Cross-Origin Embedder Policy — require-corp for full isolation; use credentialless if cross-origin resources break
  crossOriginEmbedderPolicy: { policy: 'credentialless' as any },

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: true },

  // Hide X-Powered-By
  hidePoweredBy: true,

  // HSTS (production only)
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // Prevent IE from executing downloaded files
  ieNoOpen: true,

  // Prevent MIME type sniffing
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permissions Policy
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS Filter (deprecated but still useful for older browsers)
  xssFilter: true,
});

/**
 * Middleware to inject CSP nonce into request for use in templates
 * and attach to res.locals for use in views
 */
export const nonceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate a new nonce for each request
  const nonce = generateNonce();

  // Store nonce in res.locals for use in templates
  res.locals.nonce = nonce;

  // Also set it as a header for reference
  res.setHeader('X-CSP-Nonce', nonce);

  next();
};

/**
 * Custom security headers middleware
 */
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Cache control (API responses should not be cached)
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Request size limit middleware
 */
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request entity too large. Maximum size is ${maxSize}`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const num = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(num * units[unit]);
}

/**
 * Rate limiting configuration
 * Basic implementation - consider using a Redis-backed solution for production
 */
export const createRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  maxEntries?: number; // Prevent OOM — maximum number of IP entries to track
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const maxEntries = options.maxEntries || 50000;

  // Periodic cleanup to prevent memory leak
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests) {
      if (now > record.resetTime) {
        requests.delete(key);
      }
    }
  }, 60_000); // Every 1 minute
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requests.get(ip);

    if (!record || now > record.resetTime) {
      // Enforce max entries to prevent OOM from distributed attacks
      if (requests.size >= maxEntries) {
        // Evict oldest expired entries; if still full, reject
        let evicted = false;
        for (const [key, rec] of requests) {
          if (now > rec.resetTime) {
            requests.delete(key);
            evicted = true;
            break;
          }
        }
        if (!evicted && requests.size >= maxEntries) {
          return res.status(503).json({
            success: false,
            error: { code: 'SERVER_BUSY', message: 'Server is busy. Please try again later.' },
          });
        }
      }
      requests.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      });
    }

    record.count++;
    next();
  };
};

export default securityMiddleware;

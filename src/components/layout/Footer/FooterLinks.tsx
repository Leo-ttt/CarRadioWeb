/**
 * Footer links component
 * Compact single-row layout inspired by mainstream automotive sites
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useLanguage } from '@/hooks/useLanguage'
import type { SocialLinks } from '@/services/siteSettingsService'
import { getApiBaseUrl } from '@/services/apiClient'

const ICON_SIZE = 'w-7 h-7'

const SOCIAL_ICONS: Record<keyof SocialLinks, { label: string; icon: React.ReactNode }> = {
  youtube: {
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <rect width="24" height="24" rx="4" fill="#FF0000" />
        <path d="M9.5 16.5v-9l7 4.5-7 4.5z" fill="white" />
      </svg>
    ),
  },
  telegram: {
    label: 'Telegram',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <rect width="24" height="24" rx="4" fill="#26A5E4" />
        <path d="M7.5 12.2l2.1 1.5 1 3.1.7-.6 1.7 1.3 3.5-9.5-9 4.2zm2.8.7l4.5-2.8-3.5 3.1-.3 1.5-.7-1.8z" fill="white" />
      </svg>
    ),
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <rect width="24" height="24" rx="4" fill="#25D366" />
        <path d="M12 4.5a7.5 7.5 0 0 0-6.5 11.2L4.5 19.5l3.9-1a7.5 7.5 0 1 0 3.6-14zm0 13.5a6 6 0 0 1-3.1-.8l-.2-.1-2.2.6.6-2.1-.2-.2A6 6 0 1 1 12 18zm3.3-4.5c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.4.1l-.6.7c-.1.1-.2.1-.4 0-.2-.1-.8-.3-1.5-.9-.6-.5-.9-1.1-1-1.3-.1-.2 0-.3.1-.4l.3-.3.1-.2v-.3l-.5-1.2c-.1-.3-.3-.3-.4-.3h-.4c-.1 0-.3.1-.5.2-.2.2-.6.6-.6 1.4s.6 1.6.7 1.7c.1.1 1.2 1.9 3 2.6.4.2.7.3 1 .3.4.1.8 0 1.1-.1.3-.1 1-.4 1.1-.8.1-.4.1-.7.1-.8-.1 0-.2-.1-.4-.2z" fill="white" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <rect width="24" height="24" rx="4" fill="#1877F2" />
        <path d="M16.5 12.5h-2.5v8h-3v-8H9v-2.5h2v-1.8c0-2 1.2-3.2 3-3.2.9 0 1.7.1 1.7.1v2h-1c-.9 0-1.2.6-1.2 1.2V10h2.3l-.3 2.5z" fill="white" />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFDC80" />
            <stop offset="25%" stopColor="#F77737" />
            <stop offset="50%" stopColor="#E1306C" />
            <stop offset="75%" stopColor="#C13584" />
            <stop offset="100%" stopColor="#833AB4" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="4" fill="url(#ig-grad)" />
        <rect x="6" y="6" width="12" height="12" rx="3.5" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="16" cy="8" r="1" fill="white" />
      </svg>
    ),
  },
  tiktok: {
    label: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <rect width="24" height="24" rx="4" fill="#010101" />
        <path d="M16.5 4.5h-2v9.5a2.5 2.5 0 1 1-2-2.45V9a5 5 0 1 0 4.5 5V9.5a5.5 5.5 0 0 0 3 .9V8a3.5 3.5 0 0 1-3.5-3.5z" fill="white" />
        <path d="M16.5 4.5h-2v9.5a2.5 2.5 0 1 1-2-2.45V9a5 5 0 1 0 4.5 5V9.5a5.5 5.5 0 0 0 3 .9V8a3.5 3.5 0 0 1-3.5-3.5z" fill="#25F4EE" opacity="0.5" transform="translate(-0.5, -0.5)" />
        <path d="M16.5 4.5h-2v9.5a2.5 2.5 0 1 1-2-2.45V9a5 5 0 1 0 4.5 5V9.5a5.5 5.5 0 0 0 3 .9V8a3.5 3.5 0 0 1-3.5-3.5z" fill="#FE2C55" opacity="0.5" transform="translate(0.5, 0.5)" />
      </svg>
    ),
  },
  vk: {
    label: 'VK',
    icon: (
      <svg viewBox="0 0 24 24" className={ICON_SIZE}>
        <rect width="24" height="24" rx="4" fill="#0077FF" />
        <path d="M12.8 16.5c-4.5 0-7.1-3.1-7.2-8.2h2.3c.1 3.8 1.7 5.4 3 5.7V8.3h2.2v3.3c1.3-.1 2.6-1.6 3.1-3.3h2.2c-.4 2-1.8 3.5-2.8 4.1 1 .5 2.6 1.8 3.2 4.1h-2.4c-.5-1.5-1.7-2.7-3.3-2.8v2.8h-.3z" fill="white" />
      </svg>
    ),
  },
}

/** Collect active social entries */
function getActiveSocials(socialLinks?: SocialLinks): (keyof SocialLinks)[] {
  if (!socialLinks) {return []}
  return (Object.keys(SOCIAL_ICONS) as (keyof SocialLinks)[])
    .filter((key) => socialLinks[key]?.trim())
}

export const FooterLinks: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { siteSettings } = useSiteSettings()
  const { getLocalizedPath } = useLanguage()

  const legalLinks = [
    { key: 'privacy' as const, path: siteSettings.legalPrivacyPath || '/privacy' },
    { key: 'terms' as const, path: siteSettings.legalTermsPath || '/terms' },
    { key: 'disclaimer' as const, path: siteSettings.legalDisclaimerPath || '/disclaimer' },
  ]

  const copyrightText = siteSettings.copyright?.trim()
    || `\u00A9 ${new Date().getFullYear()} ${siteSettings.logoText || t('layout.logo')}. All rights reserved.`

  const socialEntries = getActiveSocials(siteSettings.socialLinks)

  return (
    <div className="container mx-auto px-4 py-5">
      {/* Main row: tagline (left) | social icons (center) | legal links (right) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
        {/* Left: tagline */}
        <span className="text-xs text-slate-500 dark:text-gray-500 md:w-1/3">
          {t('layout.footer.tagline')}
        </span>

        {/* Center: social icons */}
        <div className="flex items-center justify-center gap-3 md:w-1/3">
          {socialEntries.map((key) => {
            const meta = SOCIAL_ICONS[key]
            return (
              <a
                key={key}
                href={siteSettings.socialLinks![key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={meta.label}
                className="hover:scale-110 transition-transform duration-200 opacity-90 hover:opacity-100"
              >
                {meta.icon}
              </a>
            )
          })}
        </div>

        {/* Right: legal links */}
        <div className="flex items-center justify-end gap-3 text-xs text-slate-500 dark:text-gray-500 md:w-1/3">
          {legalLinks.map((link, idx) => (
            <React.Fragment key={link.key}>
              {idx > 0 && <span className="text-slate-300 dark:text-gray-600">{'\u2022'}</span>}
              <button
                onClick={() => {
                  const mainOrigin = getApiBaseUrl()
                  const path = getLocalizedPath(link.path)
                  if (mainOrigin) {
                    window.location.href = mainOrigin + path
                  } else {
                    navigate(path)
                  }
                }}
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
              >
                {t(`layout.footer.${link.key}`)}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bottom: copyright */}
      <div className="border-t border-gray-200 dark:border-gray-700/40 pt-3">
        <p className="text-center text-xs text-slate-400 dark:text-gray-500">
          {copyrightText}
        </p>
      </div>
    </div>
  )
}

export default FooterLinks
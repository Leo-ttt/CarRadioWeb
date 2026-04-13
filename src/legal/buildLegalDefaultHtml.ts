/**
 * 法律页「语言包默认正文」→ HTML，与前台 Privacy / Terms / Disclaimer 在无自定义稿时的结构一致。
 * 用于后台合规中心：数据库无内容时预填，便于在原文基础上编辑并保存。
 */
import i18n from '@/i18n'
import type { LegalDocType } from '@/services/legalVersionService'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function listItems(t: (k: string, o?: object) => unknown, key: string): string {
  const raw = t(key, { returnObjects: true })
  if (!Array.isArray(raw)) {return ''}
  return raw.map((item) => `<li>${esc(String(item))}</li>`).join('')
}

function contactBlock(t: (k: string) => string): string {
  return `<div class="mt-4 rounded-lg border border-slate-200 bg-white/60 p-4"><a href="/contact" class="font-semibold text-blue-700">${esc(t('legal.visitContact'))}</a></div>`
}

function buildPrivacyHtml(t: (k: string, o?: object) => string): string {
  const sections: string[] = []
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.intro.title'))}</h2><p class="leading-relaxed">${esc(t('legal.privacy.intro.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.collection.title'))}</h2>` +
      `<div class="space-y-4">` +
      `<div><h3 class="text-lg font-semibold text-slate-800 mb-2">${esc(t('legal.privacy.collection.provided.title'))}</h3>` +
      `<p>${esc(t('legal.privacy.collection.provided.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-1">${listItems(t, 'legal.privacy.collection.provided.items')}</ul></div>` +
      `<div><h3 class="text-lg font-semibold text-slate-800 mb-2">${esc(t('legal.privacy.collection.automatic.title'))}</h3>` +
      `<p>${esc(t('legal.privacy.collection.automatic.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-1">${listItems(t, 'legal.privacy.collection.automatic.items')}</ul></div>` +
      `</div></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.usage.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.usage.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.privacy.usage.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.security.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.security.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.privacy.security.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.sharing.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.sharing.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.privacy.sharing.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.cookies.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.cookies.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.rights.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.rights.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.privacy.rights.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.contact.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.contact.content'))}</p>${contactBlock(t)}</section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.privacy.changes.title'))}</h2>` +
      `<p>${esc(t('legal.privacy.changes.content'))}</p></section>`
  )
  return `<div class="space-y-10 text-slate-700">${sections.join('')}</div>`
}

function buildTermsHtml(t: (k: string, o?: object) => string): string {
  const sections: string[] = []
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.acceptance.title'))}</h2>` +
      `<p class="leading-relaxed">${esc(t('legal.terms.acceptance.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.license.title'))}</h2>` +
      `<p>${esc(t('legal.terms.license.intro'))}</p>` +
      `<p class="mt-4">${esc(t('legal.terms.license.allowedTitle'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.terms.license.allowed')}</ul>` +
      `<p class="mt-4">${esc(t('legal.terms.license.prohibitedTitle'))}</p>` +
      `<ul class="list-disc list-inside space-y-2">${listItems(t, 'legal.terms.license.prohibited')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.ip.title'))}</h2>` +
      `<p>${esc(t('legal.terms.ip.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.asIs.title'))}</h2>` +
      `<p>${esc(t('legal.terms.asIs.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.liability.title'))}</h2>` +
      `<p>${esc(t('legal.terms.liability.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.thirdParty.title'))}</h2>` +
      `<p>${esc(t('legal.terms.thirdParty.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.conduct.title'))}</h2>` +
      `<p>${esc(t('legal.terms.conduct.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.terms.conduct.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.account.title'))}</h2>` +
      `<p>${esc(t('legal.terms.account.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.termination.title'))}</h2>` +
      `<p>${esc(t('legal.terms.termination.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.law.title'))}</h2>` +
      `<p>${esc(t('legal.terms.law.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.terms.contact.title'))}</h2>` +
      `<p>${esc(t('legal.terms.contact.content'))}</p>${contactBlock(t)}</section>`
  )
  return `<div class="space-y-10 text-slate-700">${sections.join('')}</div>`
}

function buildDisclaimerHtml(t: (k: string, o?: object) => string): string {
  const sections: string[] = []
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.general.title'))}</h2>` +
      `<p class="leading-relaxed">${esc(t('legal.disclaimer.general.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.technical.title'))}</h2>` +
      `<p class="leading-relaxed">${esc(t('legal.disclaimer.technical.content'))}</p>` +
      `<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">` +
      `<p class="text-sm text-amber-800"><strong>${esc(t('legal.disclaimer.technical.warning'))}</strong></p></div></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.installation.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.installation.desc'))}</p>` +
      `<ul class="list-disc list-inside mt-2 space-y-2">${listItems(t, 'legal.disclaimer.installation.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.thirdParty.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.thirdParty.content1'))}</p>` +
      `<p class="mt-4">${esc(t('legal.disclaimer.thirdParty.content2'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.professional.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.professional.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.warranty.title'))}</h2>` +
      `<p class="mb-4">${esc(t('legal.disclaimer.warranty.desc'))}</p>` +
      `<ul class="list-disc list-inside space-y-2">${listItems(t, 'legal.disclaimer.warranty.items')}</ul></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.liability.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.liability.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.assumption.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.assumption.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.law.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.law.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.modifications.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.modifications.content'))}</p></section>`
  )
  sections.push(
    `<section class="mb-10"><h2 class="text-2xl font-semibold text-slate-800 mb-4">${esc(t('legal.disclaimer.contact.title'))}</h2>` +
      `<p>${esc(t('legal.disclaimer.contact.content'))}</p>${contactBlock(t)}</section>`
  )
  return `<div class="space-y-10 text-slate-700">${sections.join('')}</div>`
}

export function buildLegalDefaultHtml(docType: LegalDocType, locale: 'en' | 'zh'): string {
  const t = i18n.getFixedT(locale, 'translation') as (key: string, opts?: object) => string
  switch (docType) {
    case 'privacy':
      return buildPrivacyHtml(t)
    case 'terms':
      return buildTermsHtml(t)
    case 'disclaimer':
      return buildDisclaimerHtml(t)
    default:
      return ''
  }
}

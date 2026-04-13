import express from 'express'
import { getSiteSettings, updateSiteSettings } from '../services/siteSettingsService'
import { authenticateUser, requirePermission } from '../middleware/auth'
import { PERMISSIONS } from '../config/permissions'
import { createLogger } from '../utils/logger'

const logger = createLogger('site-settings-route')

const router = express.Router()

/**
 * GET /api/site-settings
 * 获取网站设置
 */
router.get('/', async (req, res) => {
  try {
    const { language = 'en' } = req.query
    const settings = await getSiteSettings(language as string)
    res.json({ success: true, data: settings })
  } catch (error) {
    logger.error({ error }, '获取网站设置错误')
    res.status(500).json({ 
      success: false, 
      error: '服务器错误' 
    })
  }
})

/**
 * PUT /api/site-settings
 * 更新网站设置 - 需要认证
 */
router.put('/', authenticateUser, requirePermission(PERMISSIONS.settings.update), async (req, res) => {
  try {
    const { 
      language = 'en', 
      siteName, 
      logoText, 
      mapLat,
      mapLng,
      mapZoom,
      mapAddress,
      logoFontFamily,
      logoColorType,
      logoColor,
      logoGradientStart,
      logoGradientEnd,
      multiDataModeEnabled,
      enableChineseUI,
      dataLanguageScopes,
      cookieBannerEnabled,
      cookieConsentPromptVersion,
      legalPrivacyPath,
      legalTermsPath,
      legalDisclaimerPath,
      newsletterEnabled,
      newsletterSmtp,
      externalLinks, 
      socialLinks, 
      siteDescription, 
      copyright 
    } = req.body
    
    const settingsData: Record<string, unknown> = {}
    if (siteName !== undefined) settingsData.siteName = siteName
    if (logoText !== undefined) settingsData.logoText = logoText
    if (mapLat !== undefined) settingsData.mapLat = mapLat
    if (mapLng !== undefined) settingsData.mapLng = mapLng
    if (mapZoom !== undefined) settingsData.mapZoom = mapZoom
    if (mapAddress !== undefined) settingsData.mapAddress = mapAddress
    if (logoFontFamily !== undefined) settingsData.logoFontFamily = logoFontFamily
    if (logoColorType !== undefined) settingsData.logoColorType = logoColorType
    if (logoColor !== undefined) settingsData.logoColor = logoColor
    if (logoGradientStart !== undefined) settingsData.logoGradientStart = logoGradientStart
    if (logoGradientEnd !== undefined) settingsData.logoGradientEnd = logoGradientEnd
    if (multiDataModeEnabled !== undefined) settingsData.multiDataModeEnabled = multiDataModeEnabled
    if (enableChineseUI !== undefined) settingsData.enableChineseUI = enableChineseUI
    if (dataLanguageScopes !== undefined) settingsData.dataLanguageScopes = dataLanguageScopes
    if (cookieBannerEnabled !== undefined) settingsData.cookieBannerEnabled = cookieBannerEnabled
    if (cookieConsentPromptVersion !== undefined) settingsData.cookieConsentPromptVersion = cookieConsentPromptVersion
    if (legalPrivacyPath !== undefined) settingsData.legalPrivacyPath = legalPrivacyPath
    if (legalTermsPath !== undefined) settingsData.legalTermsPath = legalTermsPath
    if (legalDisclaimerPath !== undefined) settingsData.legalDisclaimerPath = legalDisclaimerPath
    if (newsletterEnabled !== undefined) settingsData.newsletterEnabled = newsletterEnabled
    if (newsletterSmtp !== undefined) settingsData.newsletterSmtp = newsletterSmtp
    if (externalLinks !== undefined) settingsData.externalLinks = externalLinks
    if (socialLinks !== undefined) settingsData.socialLinks = socialLinks
    if (siteDescription !== undefined) settingsData.siteDescription = siteDescription
    if (copyright !== undefined) settingsData.copyright = copyright
    
    const updatedSettings = await updateSiteSettings(language, settingsData)
    
    // 全局字段已迁移到 GlobalSiteSettings，不再需要对另一语言记录进行同步
    
    res.json({ success: true, data: updatedSettings })
  } catch (error) {
    logger.error({ error }, '更新网站设置错误')
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '服务器错误' 
    })
  }
})

export default router

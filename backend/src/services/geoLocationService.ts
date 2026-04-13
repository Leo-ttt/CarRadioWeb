/**
 * IP 地理位置检测服务
 * 用于根据用户 IP 地址判断所在国家/地区，从而确定界面语言和资料体系
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('geo-location');

// 界面语言类型
export type UILanguage = 'en' | 'zh';

// 资料体系类型（仅英文）
export type ContentLanguage = 'en';

// IP 检测结果接口
export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  ip: string;
}

// 语言检测结果
export interface LanguageDetectionResult {
  uiLanguage: UILanguage;        // 界面语言
  contentLanguage: ContentLanguage;  // 资料体系
  source: 'ip' | 'browser' | 'default';
  details?: {
    country?: string;
    countryCode?: string;
    browserLang?: string;
  };
}

// 英语国家列表
const ENGLISH_COUNTRIES = [
  'US', // 美国
  'GB', // 英国
  'AU', // 澳大利亚
  'CA', // 加拿大
  'NZ', // 新西兰
  'IE', // 爱尔兰
  'ZA', // 南非
  'SG', // 新加坡
  'PH', // 菲律宾
  'IN', // 印度
  'PK', // 巴基斯坦
  'NG', // 尼日利亚
  'KE', // 肯尼亚
  'GH', // 加纳
  'MY', // 马来西亚
  'HK', // 香港（英文为主）
];

// 中文国家/地区列表
const CHINESE_COUNTRIES = [
  'CN', // 中国大陆
  'TW', // 台湾
  'MO', // 澳门
  // 注意：香港(HK)归类为英语国家
];

/**
 * 根据 IP 地址获取地理位置信息
 * 使用免费的 ip-api.com 服务
 */
export async function getGeoLocationByIP(ip: string): Promise<GeoLocation | null> {
  try {
    // 跳过本地 IP 地址
    if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      // Local IP address, skip geo detection
      return null;
    }

    // 使用 ip-api.com 免费服务（每分钟 45 次请求限制）
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 3000 // 3秒超时
    });

    if (response.data.status === 'success') {
      return {
        country: response.data.country,
        countryCode: response.data.countryCode,
        region: response.data.regionName,
        city: response.data.city,
        ip: ip
      };
    }

    return null;
  } catch (error) {
    logger.error({ error }, 'IP 地理位置检测失败');
    return null;
  }
}

/**
 * 根据国家代码判断界面语言和资料体系
 */
export function getLanguagesByCountry(countryCode: string): { uiLanguage: UILanguage; contentLanguage: ContentLanguage } {
  const code = countryCode.toUpperCase();

  if (CHINESE_COUNTRIES.includes(code)) {
    return { uiLanguage: 'zh', contentLanguage: 'en' };
  }

  return { uiLanguage: 'en', contentLanguage: 'en' };
}

/**
 * 根据浏览器语言判断界面语言和资料体系
 */
export function getLanguagesByBrowser(acceptLanguage: string): { uiLanguage: UILanguage; contentLanguage: ContentLanguage } {
  const lang = acceptLanguage.toLowerCase();

  if (lang.includes('zh')) {
    return { uiLanguage: 'zh', contentLanguage: 'en' };
  }

  return { uiLanguage: 'en', contentLanguage: 'en' };
}

/**
 * 综合检测用户语言偏好（界面 en/zh，资料固定英文）
 */
export async function detectUserLanguage(
  ip: string,
  acceptLanguage?: string
): Promise<LanguageDetectionResult> {
  // 1. 尝试通过 IP 检测
  try {
    const geoLocation = await getGeoLocationByIP(ip);

    if (geoLocation && geoLocation.countryCode) {
      const countryCode = geoLocation.countryCode.toUpperCase();
      const { uiLanguage, contentLanguage } = getLanguagesByCountry(countryCode);

      logger.debug({ ip, country: geoLocation.country, countryCode, uiLanguage, contentLanguage }, 'IP language detected');

      return {
        uiLanguage,
        contentLanguage,
        source: 'ip',
        details: {
          country: geoLocation.country,
          countryCode: countryCode
        }
      };
    }
  } catch (error) {
    logger.warn({ error }, 'IP 检测失败，尝试浏览器语言检测');
  }

  // 2. 尝试通过浏览器语言检测
  if (acceptLanguage) {
    const { uiLanguage, contentLanguage } = getLanguagesByBrowser(acceptLanguage);

    logger.debug({ acceptLanguage, uiLanguage, contentLanguage }, 'Browser language detected');

    return {
      uiLanguage,
      contentLanguage,
      source: 'browser',
      details: {
        browserLang: acceptLanguage
      }
    };
  }

  // 3. Default to English

  return {
    uiLanguage: 'en',
    contentLanguage: 'en',
    source: 'default'
  };
}

// Lightweight geo result for notification use
export interface GeoResult {
  location: string;
  timezone: string | null;
}

const FETCH_TIMEOUT_MS = 3000;
const LOCAL_IP_PATTERNS = ['127.0.0.1', 'localhost', '::1'];

/**
 * Get location string and timezone from IP (for notification display).
 * Tries multiple APIs with fallback.
 */
export async function getGeoWithTimezone(ip: string): Promise<GeoResult> {
  const fallback: GeoResult = { location: '未知', timezone: null };
  if (!ip || LOCAL_IP_PATTERNS.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return fallback;
  }

  // ipapi.co — returns timezone
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await res.json() as Record<string, unknown>;
    const city = d.city as string | undefined;
    const country = d.country_name as string | undefined;
    const tz = d.timezone as string | undefined;
    if (city && country) return { location: `${city}, ${country}`, timezone: tz ?? null };
    if (country) return { location: country, timezone: tz ?? null };
  } catch { /* next */ }

  // ip-api.com — returns timezone
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`http://ip-api.com/json/${ip}`, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await res.json() as Record<string, unknown>;
    if (d.status === 'success') {
      const city = d.city as string | undefined;
      const country = d.country as string | undefined;
      const tz = d.timezone as string | undefined;
      if (city && country) return { location: `${city}, ${country}`, timezone: tz ?? null };
      if (country) return { location: country, timezone: tz ?? null };
    }
  } catch { /* next */ }

  return fallback;
}

/**
 * Build dual-timezone time display.
 * Returns { beijing, local } so callers can format per channel.
 */
export interface DualTime {
  beijing: string;
  local: string | null;
  localTz: string | null;
}

export function getDualTime(timezone: string | null): DualTime {
  const CHINA_TZ = 'Asia/Shanghai';
  const now = new Date();
  const beijing = now.toLocaleString('zh-CN', { timeZone: CHINA_TZ });
  if (!timezone || timezone === CHINA_TZ) {
    return { beijing, local: null, localTz: null };
  }
  const local = now.toLocaleString('zh-CN', { timeZone: timezone });
  return { beijing, local, localTz: timezone };
}

/**
 * Plain-text dual time (two lines when timezone differs)
 */
export function formatDualTime(timezone: string | null): string {
  const t = getDualTime(timezone);
  if (!t.local) return `${t.beijing} (北京时间)`;
  return `${t.beijing} (北京时间)\n${t.local} (${t.localTz})`;
}

/**
 * 从请求中提取 IP 地址
 */
export function getClientIP(req: any): string {
  // 尝试从各种可能的请求头中获取真实 IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }

  return (
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}

export default {
  getGeoLocationByIP,
  getLanguagesByCountry,
  getLanguagesByBrowser,
  detectUserLanguage,
  getGeoWithTimezone,
  getDualTime,
  formatDualTime,
  getClientIP
};

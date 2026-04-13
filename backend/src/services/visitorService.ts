/**
 * 访客统计服务
 * 处理访问记录、统计查询等业务逻辑
 */

import { VisitRecord, VisitorSummary, GlobalStats, IVisitRecord, IVisitorSummary } from '../models/Visitor';
import geoLocationService from './geoLocationService';
import { createLogger } from '../utils/logger';

const logger = createLogger('visitor');

// 设备类型
type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

// 访问信息接口
interface VisitInfo {
  ip: string;
  userAgent: string;
  path: string;
  referer?: string;
}

// 解析后的UA信息
interface ParsedUA {
  deviceType: DeviceType;
  os: string;
  browser: string;
  browserVersion: string;
}

// 国家统计结果
interface CountryStats {
  country: string;
  countryCode: string;
  uv: number;
  pv: number;
  percentage: number;
}

// 国家详情统计
interface CountryDetail {
  regions: { name: string; city: string; uv: number }[];
  devices: { type: string; count: number; percentage: number }[];
  os: { name: string; count: number; percentage: number }[];
  browsers: { name: string; count: number; percentage: number }[];
}

// 时间范围统计
interface TimeRangeStats {
  date: string;
  uv: number;
  pv: number;
}

class VisitorService {
  /**
   * 记录访问
   */
  async recordVisit(visitInfo: VisitInfo): Promise<void> {
    try {
      const { ip, userAgent, path, referer } = visitInfo;

      // 解析地理位置
      const geoInfo = await this.getGeoLocation(ip);
      
      // 解析User-Agent
      const uaInfo = this.parseUserAgent(userAgent);

      // 创建访问记录
      const visitRecord = new VisitRecord({
        ip,
        country: geoInfo.country,
        countryCode: geoInfo.countryCode,
        region: geoInfo.region,
        city: geoInfo.city,
        isProxy: geoInfo.isProxy,
        isValidLocation: geoInfo.isValidLocation,
        deviceType: uaInfo.deviceType,
        os: uaInfo.os,
        browser: uaInfo.browser,
        browserVersion: uaInfo.browserVersion,
        userAgent,
        path,
        referer: referer || '',
        visitTime: new Date()
      });

      await visitRecord.save();

      // 更新访客汇总，返回是否为新访客
      const isNewVisitor = await this.updateVisitorSummary(ip, geoInfo, uaInfo);

      // 更新全局统计
      await this.updateGlobalStats(isNewVisitor);

    } catch (error) {
      logger.error({ error }, '记录访问失败');
      // 不抛出错误，避免影响正常请求
    }
  }

  /**
   * 获取地理位置信息
   */
  private async getGeoLocation(ip: string): Promise<{
    country: string;
    countryCode: string;
    region: string;
    city: string;
    isProxy: boolean;
    isValidLocation: boolean;
  }> {
    try {
      // 使用现有的地理位置服务
      const location = await geoLocationService.getGeoLocationByIP(ip);
      
      if (location) {
        // 检查是否为代理/VPN（简单判断）
        const isProxy = this.checkIfProxy(ip, location);
        
        return {
          country: location.country || '未知',
          countryCode: location.countryCode || 'XX',
          region: location.region || '未知',
          city: location.city || '未知',
          isProxy,
          isValidLocation: !isProxy && location.country !== '未知'
        };
      }
    } catch (error) {
      logger.error({ error }, '获取地理位置失败');
    }

    return {
      country: '未知',
      countryCode: 'XX',
      region: '未知',
      city: '未知',
      isProxy: false,
      isValidLocation: false
    };
  }

  /**
   * 检查是否为代理/VPN
   */
  private checkIfProxy(ip: string, location: any): boolean {
    // 简单的代理检测逻辑
    // 1. 私有IP地址
    if (this.isPrivateIP(ip)) {
      return false; // 私有IP不算代理
    }
    
    // 2. 检查是否为已知的数据中心IP段（简化版）
    // 实际生产环境可以使用专业的IP代理检测服务
    
    return false;
  }

  /**
   * 检查是否为私有IP
   */
  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    
    // 10.x.x.x
    if (first === 10) return true;
    // 172.16.x.x - 172.31.x.x
    if (first === 172 && second >= 16 && second <= 31) return true;
    // 192.168.x.x
    if (first === 192 && second === 168) return true;
    // 127.x.x.x (localhost)
    if (first === 127) return true;
    
    return false;
  }

  /**
   * 解析User-Agent
   */
  private parseUserAgent(userAgent: string): ParsedUA {
    const ua = userAgent.toLowerCase();
    
    // 设备类型检测
    let deviceType: DeviceType = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
    }

    // 操作系统检测
    let os = '未知';
    if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
    else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1';
    else if (/windows nt 6.2/i.test(ua)) os = 'Windows 8';
    else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac os x/i.test(ua)) os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/linux/i.test(ua)) os = 'Linux';

    // 浏览器检测
    let browser = '未知';
    let browserVersion = '';
    
    if (/edg\//i.test(ua)) {
      browser = 'Edge';
      const match = ua.match(/edg\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    } else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) {
      browser = 'Chrome';
      const match = ua.match(/chrome\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = 'Safari';
      const match = ua.match(/version\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    } else if (/firefox/i.test(ua)) {
      browser = 'Firefox';
      const match = ua.match(/firefox\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    } else if (/opera|opr\//i.test(ua)) {
      browser = 'Opera';
      const match = ua.match(/(?:opera|opr)\/(\d+)/i);
      browserVersion = match ? match[1] : '';
    }

    return { deviceType, os, browser, browserVersion };
  }

  /**
   * 生成访客唯一标识（IP + 设备指纹）
   * 用于区分同一网络下的不同设备
   */
  private generateVisitorId(ip: string, uaInfo: ParsedUA): string {
    // 组合 IP + 设备类型 + 操作系统 + 浏览器 作为唯一标识
    return `${ip}_${uaInfo.deviceType}_${uaInfo.os}_${uaInfo.browser}`;
  }

  /**
   * 更新访客汇总
   * 返回是否为新访客
   */
  private async updateVisitorSummary(
    ip: string,
    geoInfo: any,
    uaInfo: ParsedUA
  ): Promise<boolean> {
    try {
      // 使用 IP + 设备指纹 作为唯一标识
      const visitorId = this.generateVisitorId(ip, uaInfo);
      
      const existing = await VisitorSummary.findOne({ visitorId });
      
      if (existing) {
        // 更新现有记录
        existing.lastVisit = new Date();
        existing.visitCount += 1;
        await existing.save();
        return false; // 不是新访客
      } else {
        // 创建新记录
        const summary = new VisitorSummary({
          visitorId,
          ip,
          country: geoInfo.country,
          countryCode: geoInfo.countryCode,
          region: geoInfo.region,
          city: geoInfo.city,
          isProxy: geoInfo.isProxy,
          isValidLocation: geoInfo.isValidLocation,
          deviceType: uaInfo.deviceType,
          os: uaInfo.os,
          browser: uaInfo.browser,
          firstVisit: new Date(),
          lastVisit: new Date(),
          visitCount: 1
        });
        await summary.save();
        return true; // 是新访客
      }
    } catch (error) {
      logger.error({ error }, '更新访客汇总失败');
      return false;
    }
  }

  /**
   * 更新全局统计
   */
  private async updateGlobalStats(isNewVisitor: boolean): Promise<void> {
    try {
      // 更新全局统计
      await GlobalStats.findOneAndUpdate(
        { key: 'global' },
        {
          $inc: {
            totalPV: 1,
            totalUV: isNewVisitor ? 1 : 0
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error({ error }, '更新全局统计失败');
    }
  }

  /**
   * 获取全局统计数据
   */
  async getGlobalStats(): Promise<{ totalUV: number; totalPV: number; lastUpdated: Date }> {
    try {
      const stats = await GlobalStats.findOne({ key: 'global' });
      
      if (stats) {
        return {
          totalUV: stats.totalUV,
          totalPV: stats.totalPV,
          lastUpdated: stats.lastUpdated
        };
      }

      return { totalUV: 0, totalPV: 0, lastUpdated: new Date() };
    } catch (error) {
      logger.error({ error }, '获取全局统计失败');
      return { totalUV: 0, totalPV: 0, lastUpdated: new Date() };
    }
  }

  /**
   * 获取国家统计列表
   */
  async getCountryStats(options: {
    includeInvalid?: boolean;
    sortBy?: 'uv' | 'pv';
    limit?: number;
  } = {}): Promise<CountryStats[]> {
    const { includeInvalid = false, sortBy = 'uv', limit = 50 } = options;

    try {
      const matchStage: any = {};
      if (!includeInvalid) {
        matchStage.isValidLocation = true;
      }

      const result = await VisitorSummary.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { country: '$country', countryCode: '$countryCode' },
            uv: { $sum: 1 },
            pv: { $sum: '$visitCount' }
          }
        },
        { $sort: sortBy === 'uv' ? { uv: -1 } : { pv: -1 } },
        { $limit: limit }
      ]);

      // 计算总数用于百分比
      const totalUV = result.reduce((sum, item) => sum + item.uv, 0);

      return result.map(item => ({
        country: item._id.country,
        countryCode: item._id.countryCode,
        uv: item.uv,
        pv: item.pv,
        percentage: totalUV > 0 ? Math.round((item.uv / totalUV) * 10000) / 100 : 0
      }));
    } catch (error) {
      logger.error({ error }, '获取国家统计失败');
      return [];
    }
  }

  /**
   * 获取国家详情统计
   */
  async getCountryDetail(countryCode: string): Promise<CountryDetail> {
    try {
      const visitors = await VisitorSummary.find({
        countryCode,
        isValidLocation: true
      });

      // 地区统计（省/州 + 城市）
      const regionMap = new Map<string, { city: string; uv: number }>();
      visitors.forEach(v => {
        // 使用 "省/州 - 城市" 作为 key
        const key = `${v.region}_${v.city}`;
        const existing = regionMap.get(key) || { city: v.city, uv: 0 };
        existing.uv += 1;
        regionMap.set(key, existing);
      });

      const regions = Array.from(regionMap.entries())
        .map(([key, stats]) => {
          const [region] = key.split('_');
          return { name: region, city: stats.city, uv: stats.uv };
        })
        .sort((a, b) => b.uv - a.uv);

      // 设备类型统计
      const deviceMap = new Map<string, number>();
      visitors.forEach(v => {
        const count = deviceMap.get(v.deviceType) || 0;
        deviceMap.set(v.deviceType, count + 1);
      });

      const totalDevices = visitors.length;
      const devices = Array.from(deviceMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: totalDevices > 0 ? Math.round((count / totalDevices) * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // 操作系统统计
      const osMap = new Map<string, number>();
      visitors.forEach(v => {
        const count = osMap.get(v.os) || 0;
        osMap.set(v.os, count + 1);
      });

      const os = Array.from(osMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalDevices > 0 ? Math.round((count / totalDevices) * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // 浏览器统计
      const browserMap = new Map<string, number>();
      visitors.forEach(v => {
        const count = browserMap.get(v.browser) || 0;
        browserMap.set(v.browser, count + 1);
      });

      const browsers = Array.from(browserMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalDevices > 0 ? Math.round((count / totalDevices) * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      return { regions, devices, os, browsers };
    } catch (error) {
      logger.error({ error }, '获取国家详情失败');
      return { regions: [], devices: [], os: [], browsers: [] };
    }
  }

  /**
   * 获取时间范围统计
   */
  async getTimeRangeStats(range: 'day' | 'week' | 'month' | '3months'): Promise<TimeRangeStats[]> {
    try {
      const now = new Date();
      let startDate: Date;
      let groupFormat: string;

      switch (range) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          groupFormat = '%Y-%m-%d %H:00';
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupFormat = '%Y-%m-%d';
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupFormat = '%Y-%m-%d';
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          groupFormat = '%Y-%m-%d';
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupFormat = '%Y-%m-%d';
      }

      // 统计 UV（基于 VisitorSummary，按 lastVisit 分组）
      const uvResult = await VisitorSummary.aggregate([
        {
          $match: {
            lastVisit: { $gte: startDate },
            isValidLocation: true
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: groupFormat, date: '$lastVisit' } }
            },
            uv: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      // 统计 PV（基于 VisitRecord）
      const pvResult = await VisitRecord.aggregate([
        {
          $match: {
            visitTime: { $gte: startDate },
            isValidLocation: true
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: groupFormat, date: '$visitTime' } }
            },
            pv: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      // 合并 UV 和 PV 数据
      const uvMap = new Map(uvResult.map(item => [item._id.date, item.uv]));
      const pvMap = new Map(pvResult.map(item => [item._id.date, item.pv]));
      
      // 获取所有日期
      const allDates = new Set([...uvMap.keys(), ...pvMap.keys()]);
      
      return Array.from(allDates).sort().map(date => ({
        date,
        uv: uvMap.get(date) || 0,
        pv: pvMap.get(date) || 0
      }));
    } catch (error) {
      logger.error({ error }, '获取时间范围统计失败');
      return [];
    }
  }

  /**
   * 获取今日统计
   */
  async getTodayStats(): Promise<{ uv: number; pv: number }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 统计今日独立访客（基于 VisitorSummary，按 lastVisit 筛选）
      const uv = await VisitorSummary.countDocuments({
        lastVisit: { $gte: today },
        isValidLocation: true
      });

      // 统计今日访问次数（基于 VisitRecord）
      const pv = await VisitRecord.countDocuments({
        visitTime: { $gte: today },
        isValidLocation: true
      });

      return { uv, pv };
    } catch (error) {
      logger.error({ error }, '获取今日统计失败');
      return { uv: 0, pv: 0 };
    }
  }

  /**
   * 获取异常来源统计（代理/VPN/未知地区）
   */
  async getInvalidLocationStats(): Promise<{ uv: number; pv: number }> {
    try {
      const result = await VisitorSummary.aggregate([
        {
          $match: { isValidLocation: false }
        },
        {
          $group: {
            _id: null,
            uv: { $sum: 1 },
            pv: { $sum: '$visitCount' }
          }
        }
      ]);

      if (result.length > 0) {
        return { uv: result[0].uv, pv: result[0].pv };
      }

      return { uv: 0, pv: 0 };
    } catch (error) {
      logger.error({ error }, '获取异常来源统计失败');
      return { uv: 0, pv: 0 };
    }
  }

  /**
   * 清理过期数据（3个月前的访问记录）
   * 注意：全局统计数据不会被清理
   */
  async cleanupOldRecords(): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);

      const result = await VisitRecord.deleteMany({
        visitTime: { $lt: cutoffDate }
      });

      logger.info({ deletedCount: result.deletedCount }, '清理过期访问记录');
      return { deletedCount: result.deletedCount };
    } catch (error) {
      logger.error({ error }, '清理过期数据失败');
      return { deletedCount: 0 };
    }
  }

  /**
   * 获取全局设备统计（浏览器、操作系统、设备类型）
   */
  async getGlobalDeviceStats(): Promise<{
    devices: { type: string; count: number; percentage: number }[];
    os: { name: string; count: number; percentage: number }[];
    browsers: { name: string; count: number; percentage: number }[];
  }> {
    try {
      const visitors = await VisitorSummary.find({ isValidLocation: true });
      const total = visitors.length;

      // Device type aggregation
      const deviceMap = new Map<string, number>();
      visitors.forEach(v => {
        const count = deviceMap.get(v.deviceType) || 0;
        deviceMap.set(v.deviceType, count + 1);
      });

      const devices = Array.from(deviceMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // OS aggregation
      const osMap = new Map<string, number>();
      visitors.forEach(v => {
        const count = osMap.get(v.os) || 0;
        osMap.set(v.os, count + 1);
      });

      const os = Array.from(osMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Browser aggregation
      const browserMap = new Map<string, number>();
      visitors.forEach(v => {
        const count = browserMap.get(v.browser) || 0;
        browserMap.set(v.browser, count + 1);
      });

      const browsers = Array.from(browserMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      return { devices, os, browsers };
    } catch (error) {
      logger.error({ error }, '获取全局设备统计失败');
      return { devices: [], os: [], browsers: [] };
    }
  }

  /**
   * 获取来源/引荐统计
   */
  async getSourceStats(options: { limit?: number } = {}): Promise<{
    sources: { name: string; type: 'direct' | 'search' | 'social' | 'referral'; count: number; percentage: number }[];
  }> {
    const { limit = 10 } = options;

    try {
      const result = await VisitRecord.aggregate([
        { $match: { isValidLocation: true } },
        {
          $group: {
            _id: '$referer',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit + 5 } // Get extra for processing
      ]);

      const total = result.reduce((sum, item) => sum + item.count, 0);

      // Categorize sources
      const sources = result.map(item => {
        const referer = item._id || '';
        let name: string;
        let type: 'direct' | 'search' | 'social' | 'referral';

        if (!referer || referer === '') {
          name = '直接访问';
          type = 'direct';
        } else if (this.isSearchEngine(referer)) {
          name = this.getSearchEngineName(referer);
          type = 'search';
        } else if (this.isSocialMedia(referer)) {
          name = this.getSocialMediaName(referer);
          type = 'social';
        } else {
          name = this.extractDomain(referer);
          type = 'referral';
        }

        return {
          name,
          type,
          count: item.count,
          percentage: total > 0 ? Math.round((item.count / total) * 10000) / 100 : 0
        };
      }).slice(0, limit);

      return { sources };
    } catch (error) {
      logger.error({ error }, '获取来源统计失败');
      return { sources: [] };
    }
  }

  /**
   * 获取热门页面统计
   */
  async getPageStats(options: { limit?: number } = {}): Promise<{
    pages: { path: string; title: string; count: number; percentage: number }[];
  }> {
    const { limit = 10 } = options;

    try {
      const result = await VisitRecord.aggregate([
        { $match: { isValidLocation: true, path: { $ne: '' } } },
        {
          $group: {
            _id: '$path',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      const total = result.reduce((sum, item) => sum + item.count, 0);

      const pages = result.map(item => ({
        path: item._id || '/',
        title: this.getPageTitle(item._id || '/'),
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 10000) / 100 : 0
      }));

      return { pages };
    } catch (error) {
      logger.error({ error }, '获取页面统计失败');
      return { pages: [] };
    }
  }

  // Helper: Check if referer is a search engine
  private isSearchEngine(referer: string): boolean {
    const searchEngines = ['google', 'bing', 'baidu', 'yahoo', 'duckduckgo', 'yandex', 'sogou', '360'];
    const lower = referer.toLowerCase();
    return searchEngines.some(engine => lower.includes(engine));
  }

  // Helper: Get search engine name
  private getSearchEngineName(referer: string): string {
    const lower = referer.toLowerCase();
    if (lower.includes('google')) return 'Google';
    if (lower.includes('bing')) return 'Bing';
    if (lower.includes('baidu')) return '百度';
    if (lower.includes('yahoo')) return 'Yahoo';
    if (lower.includes('duckduckgo')) return 'DuckDuckGo';
    if (lower.includes('yandex')) return 'Yandex';
    if (lower.includes('sogou')) return '搜狗';
    if (lower.includes('360')) return '360搜索';
    return '搜索引擎';
  }

  // Helper: Check if referer is social media
  private isSocialMedia(referer: string): boolean {
    const socialMedia = ['facebook', 'twitter', 'instagram', 'linkedin', 'weibo', 'wechat', 'tiktok', 'youtube', 'reddit'];
    const lower = referer.toLowerCase();
    return socialMedia.some(social => lower.includes(social));
  }

  // Helper: Get social media name
  private getSocialMediaName(referer: string): string {
    const lower = referer.toLowerCase();
    if (lower.includes('facebook')) return 'Facebook';
    if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter/X';
    if (lower.includes('instagram')) return 'Instagram';
    if (lower.includes('linkedin')) return 'LinkedIn';
    if (lower.includes('weibo')) return '微博';
    if (lower.includes('wechat')) return '微信';
    if (lower.includes('tiktok')) return 'TikTok';
    if (lower.includes('youtube')) return 'YouTube';
    if (lower.includes('reddit')) return 'Reddit';
    return '社交媒体';
  }

  // Helper: Extract domain from URL
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.substring(0, 30);
    }
  }

  // Helper: Get page title from path
  private getPageTitle(path: string): string {
    const pathMap: Record<string, string> = {
      '/': '首页',
      '/products': '产品中心',
      '/knowledge': '知识库',
      '/about': '关于我们',
      '/contact': '联系我们',
      '/faq': '常见问题',
      '/news': '新闻动态',
      '/cases': '案例展示',
      '/services': '服务支持',
      '/software': '软件下载'
    };

    // Check exact match
    if (pathMap[path]) return pathMap[path];

    // Check prefix match
    for (const [prefix, title] of Object.entries(pathMap)) {
      if (path.startsWith(prefix) && prefix !== '/') {
        return title;
      }
    }

    // Return path as fallback
    return path;
  }

  /**
   * 获取实时在线访客数量（最近5分钟内有活动的访客）
   */
  async getRealtimeVisitors(): Promise<{ count: number; lastUpdated: Date }> {
    const REALTIME_WINDOW_MINUTES = 5;
    
    try {
      const cutoffTime = new Date(Date.now() - REALTIME_WINDOW_MINUTES * 60 * 1000);
      
      // 统计最近5分钟内有访问记录的独立访客数
      const result = await VisitRecord.aggregate([
        {
          $match: {
            visitTime: { $gte: cutoffTime }
          }
        },
        {
          $group: {
            _id: '$ip' // 按 IP 去重
          }
        },
        {
          $count: 'count'
        }
      ]);

      const count = result.length > 0 ? result[0].count : 0;
      
      return {
        count,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error({ error }, '获取实时访客数失败');
      return { count: 0, lastUpdated: new Date() };
    }
  }

  /**
   * 获取概览统计数据
   */
  async getOverviewStats(): Promise<{
    global: { totalUV: number; totalPV: number };
    today: { uv: number; pv: number };
    week: { uv: number; pv: number };
    month: { uv: number; pv: number };
    invalid: { uv: number; pv: number };
  }> {
    try {
      const [global, today, weekData, monthData, invalid] = await Promise.all([
        this.getGlobalStats(),
        this.getTodayStats(),
        this.getTimeRangeStats('week'),
        this.getTimeRangeStats('month'),
        this.getInvalidLocationStats()
      ]);

      // 计算周统计
      const week = weekData.reduce(
        (acc, item) => ({ uv: acc.uv + item.uv, pv: acc.pv + item.pv }),
        { uv: 0, pv: 0 }
      );

      // 计算月统计
      const month = monthData.reduce(
        (acc, item) => ({ uv: acc.uv + item.uv, pv: acc.pv + item.pv }),
        { uv: 0, pv: 0 }
      );

      return {
        global: { totalUV: global.totalUV, totalPV: global.totalPV },
        today,
        week,
        month,
        invalid
      };
    } catch (error) {
      logger.error({ error }, '获取概览统计失败');
      return {
        global: { totalUV: 0, totalPV: 0 },
        today: { uv: 0, pv: 0 },
        week: { uv: 0, pv: 0 },
        month: { uv: 0, pv: 0 },
        invalid: { uv: 0, pv: 0 }
      };
    }
  }
}

export default new VisitorService();
/**
 * Unified notification service
 * Supports 5 channels: DingTalk, WeCom, ServerChan, SMTP, Webhook
 * Each channel can be independently enabled/disabled
 */

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getDualTime, formatDualTime } from './geoLocationService';
import SystemConfig, {
  type DingtalkConfig,
  type WecomConfig,
  type ServerChanConfig,
  type SmtpConfig,
  type WebhookConfig,
  type NotificationChannelType,
  type NotificationConfig,
} from '../models/SystemConfig';
import GlobalSiteSettings from '../models/GlobalSiteSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('notification');

interface NotificationPayload {
  title: string;
  content: string;
  /** Optional markdown content (used by channels that support it) */
  markdown?: string;
}

interface SendResult {
  channel: NotificationChannelType;
  success: boolean;
  message: string;
}

// ==================== Channel senders ====================

/**
 * Send DingTalk robot message
 */
async function sendDingtalk(config: DingtalkConfig, payload: NotificationPayload): Promise<SendResult> {
  const channel: NotificationChannelType = 'dingtalk';
  try {
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${config.secret}`;
    const hmac = crypto.createHmac('sha256', config.secret);
    const sign = encodeURIComponent(hmac.update(stringToSign).digest('base64'));
    const url = `${config.webhook}&timestamp=${timestamp}&sign=${sign}`;

    // DingTalk markdown: single \n doesn't break lines, use \n\n for paragraphs
    const body = payload.markdown
      ? { msgtype: 'markdown', markdown: { title: payload.title, text: payload.markdown.replace(/\n/g, '\n\n') } }
      : { msgtype: 'text', text: { content: `${payload.title}\n${payload.content}` } };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await res.json()) as { errcode?: number; errmsg?: string };

    if (result.errcode === 0) {
      return { channel, success: true, message: 'DingTalk sent' };
    }
    return { channel, success: false, message: result.errmsg ?? 'Unknown error' };
  } catch (err) {
    logger.error({ err }, 'DingTalk send failed');
    return { channel, success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send WeCom (企业微信) robot message
 */
async function sendWecom(config: WecomConfig, payload: NotificationPayload): Promise<SendResult> {
  const channel: NotificationChannelType = 'wecom';
  try {
    // WeCom markdown: single \n doesn't break lines, use \n\n for paragraphs
    const body = payload.markdown
      ? { msgtype: 'markdown', markdown: { content: `### ${payload.title}\n\n${payload.markdown.replace(/\n/g, '\n\n')}` } }
      : { msgtype: 'text', text: { content: `${payload.title}\n${payload.content}` } };

    const res = await fetch(config.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await res.json()) as { errcode?: number; errmsg?: string };

    if (result.errcode === 0) {
      return { channel, success: true, message: 'WeCom sent' };
    }
    return { channel, success: false, message: result.errmsg ?? 'Unknown error' };
  } catch (err) {
    logger.error({ err }, 'WeCom send failed');
    return { channel, success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Build ServerChan API URL based on key format:
 * - ServerChan3 (uid provided): https://<uid>.push.ft07.com/send/<sendKey>
 * - Turbo SCT key (no uid):     https://sctapi.ftqq.com/<sendKey>.send
 */
function buildServerChanUrl(uid: string, sendKey: string): string {
  if (uid) {
    return `https://${uid}.push.ft07.com/send/${sendKey}`;
  }
  return `https://sctapi.ftqq.com/${sendKey}.send`;
}

/**
 * Send ServerChan message
 * Supports ServerChan3 (uid + sendKey) and Turbo (sendKey only)
 */
async function sendServerChan(config: ServerChanConfig, payload: NotificationPayload): Promise<SendResult> {
  const channel: NotificationChannelType = 'serverchan';
  try {
    const url = buildServerChanUrl(config.uid ?? '', config.sendKey);

    // ServerChan desp field renders Markdown, where single \n doesn't break lines.
    // Convert \n to \n\n (paragraph breaks) for proper line separation.
    const rawDesp = payload.markdown ?? payload.content;
    const desp = rawDesp.replace(/\n/g, '\n\n');

    const body = new URLSearchParams({
      title: payload.title,
      desp,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const result = (await res.json()) as { code?: number; message?: string };

    if (result.code === 0) {
      return { channel, success: true, message: 'ServerChan sent' };
    }
    return { channel, success: false, message: result.message ?? 'Unknown error' };
  } catch (err) {
    logger.error({ err }, 'ServerChan send failed');
    return { channel, success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send SMTP email notification
 */
async function sendSmtp(config: SmtpConfig, payload: NotificationPayload): Promise<SendResult> {
  const channel: NotificationChannelType = 'smtp';
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: config.from || config.user,
      to: config.to,
      subject: payload.title,
      text: payload.content,
      html: payload.markdown
        ? `<h3>${payload.title}</h3><div>${payload.markdown.replace(/\n/g, '<br>')}</div>`
        : undefined,
    });

    return { channel, success: true, message: 'Email sent' };
  } catch (err) {
    logger.error({ err }, 'SMTP send failed');
    return { channel, success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send generic webhook notification
 */
async function sendWebhook(config: WebhookConfig, payload: NotificationPayload): Promise<SendResult> {
  const channel: NotificationChannelType = 'webhook';
  try {
    // Replace template variables in body, escaping for JSON safety
    let body = config.bodyTemplate || '{"title":"{{title}}","content":"{{content}}"}';
    const safeTitle = payload.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const safeContent = payload.content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    body = body.replace(/\{\{title\}\}/g, safeTitle);
    body = body.replace(/\{\{content\}\}/g, safeContent);

    // Parse custom headers
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.headers) {
      try {
        headers = { ...headers, ...JSON.parse(config.headers) };
      } catch {
        // Keep default headers if parse fails
      }
    }

    const res = await fetch(config.url, {
      method: config.method,
      headers,
      body: config.method === 'POST' ? body : undefined,
    });

    if (res.ok) {
      return { channel, success: true, message: `Webhook responded ${res.status}` };
    }
    return { channel, success: false, message: `Webhook responded ${res.status}` };
  } catch (err) {
    logger.error({ err }, 'Webhook send failed');
    return { channel, success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ==================== Channel dispatcher ====================

const CHANNEL_SENDERS: Record<
  NotificationChannelType,
  (config: NotificationConfig, payload: NotificationPayload) => Promise<SendResult>
> = {
  dingtalk: (c, p) => sendDingtalk(c as DingtalkConfig, p),
  wecom: (c, p) => sendWecom(c as WecomConfig, p),
  serverchan: (c, p) => sendServerChan(c as ServerChanConfig, p),
  smtp: (c, p) => sendSmtp(c as SmtpConfig, p),
  webhook: (c, p) => sendWebhook(c as WebhookConfig, p),
};

const ALL_CHANNELS: NotificationChannelType[] = ['dingtalk', 'wecom', 'serverchan', 'smtp', 'webhook'];

// ==================== Public API ====================

class NotificationService {
  /**
   * Send notification to all enabled channels (parallel, non-blocking)
   */
  async notifyAll(payload: NotificationPayload): Promise<SendResult[]> {
    const results: SendResult[] = [];

    const tasks = ALL_CHANNELS.map(async (channel) => {
      try {
        const config = (await SystemConfig.getConfig(channel)) as NotificationConfig | null;
        if (!config || !('enabled' in config) || !config.enabled) return null;

        const sender = CHANNEL_SENDERS[channel];
        return sender(config, payload);
      } catch (err) {
        logger.error({ err, channel }, 'Channel dispatch error');
        return { channel, success: false, message: 'Dispatch error' } as SendResult;
      }
    });

    const settled = await Promise.allSettled(tasks);
    for (const item of settled) {
      if (item.status === 'fulfilled' && item.value) {
        results.push(item.value);
      }
    }

    logger.info({ results }, 'Notification dispatch complete');
    return results;
  }

  /**
   * Test a specific channel with provided config (does NOT read from DB)
   */
  async testChannel(channel: NotificationChannelType, config: NotificationConfig): Promise<SendResult> {
    const timeDisplay = formatDualTime(null);
    const dt = getDualTime(null);
    const mdTime = dt.local
      ? `⏰ 北京时间: ${dt.beijing}\n🌍 用户当地: ${dt.local} (${dt.localTz})`
      : `⏰ 北京时间: ${dt.beijing}`;
    const testPayload: NotificationPayload = {
      title: '🔧 Test notification',
      content: `Channel "${channel}" is working.\nTime: ${timeDisplay}`,
      markdown: `**Channel**: ${channel}\n**Status**: Connected\n---\n${mdTime}`,
    };

    const sender = CHANNEL_SENDERS[channel];
    if (!sender) {
      return { channel, success: false, message: `Unknown channel: ${channel}` };
    }

    return sender(config, testPayload);
  }

  /**
   * Get config for a notification channel (with sensitive data masked)
   */
  async getChannelConfig(channel: NotificationChannelType): Promise<NotificationConfig | null> {
    const config = (await SystemConfig.getConfig(channel)) as NotificationConfig | null;
    if (!config) return null;
    return this.maskConfig(channel, { ...config });
  }

  /**
   * Get config for editing (unmasked)
   */
  async getChannelConfigForEdit(channel: NotificationChannelType): Promise<NotificationConfig | null> {
    return (await SystemConfig.getConfig(channel)) as NotificationConfig | null;
  }

  /**
   * Update config for a notification channel
   */
  async updateChannelConfig(
    channel: NotificationChannelType,
    config: NotificationConfig,
    updatedBy: string = 'admin'
  ): Promise<NotificationConfig> {
    const result = await SystemConfig.updateConfig(channel, config, updatedBy);
    return result.config as NotificationConfig;
  }

  /**
   * Get enabled status of all channels
   */
  async getAllChannelStatus(): Promise<Record<NotificationChannelType, boolean>> {
    const status = {} as Record<NotificationChannelType, boolean>;
    for (const channel of ALL_CHANNELS) {
      const config = (await SystemConfig.getConfig(channel)) as NotificationConfig | null;
      status[channel] = !!config && 'enabled' in config && !!config.enabled;
    }
    return status;
  }

  /**
   * 订阅确认、群发等外发邮件：使用 GlobalSiteSettings.newsletterSmtp（与「消息推送」里的系统通知 SMTP 分离）
   */
  async sendTransactionalEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const g = await GlobalSiteSettings.findOne().lean();
      const ns = (g as { newsletterSmtp?: Record<string, unknown> } | null)?.newsletterSmtp;
      const enabled = !!ns?.enabled;
      const host = String(ns?.host || '').trim();
      const user = String(ns?.user || '').trim();
      const pass = String(ns?.pass || '').trim();
      if (!enabled || !host || !user || !pass) {
        return { ok: false, error: 'newsletter_smtp_disabled' };
      }
      const port = typeof ns?.port === 'number' && Number.isFinite(ns.port) ? ns.port : 465;
      const secure = ns?.secure !== false;
      const from = String(ns?.from || '').trim() || user;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html ?? `<pre>${text.replace(/</g, '&lt;')}</pre>`,
      });
      return { ok: true };
    } catch (err) {
      logger.error({ err }, 'Transactional email failed');
      return { ok: false, error: err instanceof Error ? err.message : 'send_failed' };
    }
  }

  /**
   * Mask sensitive fields for display
   */
  private maskConfig(channel: NotificationChannelType, config: NotificationConfig): NotificationConfig {
    const mask = (val: string) => (val ? val.slice(0, 4) + '****' + val.slice(-4) : '');

    switch (channel) {
      case 'dingtalk': {
        const c = config as DingtalkConfig;
        return { ...c, secret: mask(c.secret) };
      }
      case 'serverchan': {
        const c = config as ServerChanConfig;
        return { ...c, sendKey: mask(c.sendKey) };
      }
      case 'smtp': {
        const c = config as SmtpConfig;
        return { ...c, pass: mask(c.pass) };
      }
      default:
        return config;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

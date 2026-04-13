/**
 * Email verification code service
 * Used for admin registration: email verification → set password
 *
 * Supported email providers:
 * - NetEase (163.com, 126.com) - requires authorization code
 * - QQ Mail - requires authorization code
 * - Aliyun Enterprise Mail
 * - Tencent Enterprise Mail
 * - Gmail - requires app password
 * - Outlook
 * - Any custom SMTP server
 */

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const logger = createLogger('email-verification');

// ==================== Verification Code Schema ====================

interface IVerificationCode {
  email: string;
  code: string;
  type: 'register' | 'reset_password';
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
}

const VerificationCodeSchema = new mongoose.Schema<IVerificationCode>({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['register', 'reset_password'], required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
});

// Index: auto-delete expired codes
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for lookup
VerificationCodeSchema.index({ email: 1, type: 1 });

const VerificationCode = mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

// ==================== Email Provider Detection ====================

interface EmailProviderConfig {
  name: string;
  domains: string[];
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
  };
  authHelp: string; // Help text for getting authorization code
}

const EMAIL_PROVIDERS: EmailProviderConfig[] = [
  {
    name: '网易163邮箱',
    domains: ['163.com'],
    authHelp: '请在网易邮箱设置中开启 SMTP 服务并获取授权码',
  },
  {
    name: '网易126邮箱',
    domains: ['126.com'],
    authHelp: '请在网易邮箱设置中开启 SMTP 服务并获取授权码',
  },
  {
    name: 'QQ邮箱',
    domains: ['qq.com'],
    authHelp: '请在QQ邮箱设置中开启 SMTP 服务并获取授权码',
  },
  {
    name: 'Gmail',
    domains: ['gmail.com'],
    authHelp: '请使用 Google 账户的应用专用密码',
  },
  {
    name: 'Outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com'],
    authHelp: '请使用 Microsoft 账户的应用密码',
  },
  {
    name: '阿里企业邮箱',
    domains: ['aliyun.com'],
    authHelp: '请使用企业邮箱密码或授权码',
  },
];

function detectEmailProvider(email: string): EmailProviderConfig | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  for (const provider of EMAIL_PROVIDERS) {
    if (provider.domains.includes(domain)) {
      return provider;
    }
  }
  return null;
}

// ==================== SMTP Configuration ====================

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Get SMTP config from environment or GlobalSiteSettings
 * Priority: environment variables > database settings
 */
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  // Try environment variables first
  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;

  if (envHost && envUser && envPass) {
    return {
      host: envHost,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE !== 'false',
      user: envUser,
      pass: envPass,
      from: process.env.SMTP_FROM || envUser,
    };
  }

  // Try database settings (newsletter SMTP)
  try {
    const GlobalSiteSettings = mongoose.model('GlobalSiteSettings');
    const settings = await GlobalSiteSettings.findOne().lean();
    const ns = (settings as any)?.newsletterSmtp;

    if (ns?.enabled && ns?.host && ns?.user && ns?.pass) {
      return {
        host: ns.host,
        port: ns.port || 465,
        secure: ns.secure !== false,
        user: ns.user,
        pass: ns.pass,
        from: ns.from || ns.user,
      };
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to load SMTP from database');
  }

  return null;
}

// ==================== Verification Code Generation ====================

/**
 * Generate a 6-digit verification code
 */
function generateCode(): string {
  // Use crypto for cryptographically secure random
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return num.toString().padStart(6, '0');
}

// ==================== Rate Limiting ====================

const CODE_SEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends
const MAX_ATTEMPTS = 5; // Max verification attempts

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  remainingMs?: number;
}

async function checkSendRateLimit(email: string): Promise<RateLimitResult> {
  const recentCode = await VerificationCode.findOne({
    email: email.toLowerCase(),
    createdAt: { $gt: new Date(Date.now() - CODE_SEND_COOLDOWN_MS) },
  }).sort({ createdAt: -1 });

  if (recentCode) {
    const remainingMs = CODE_SEND_COOLDOWN_MS - (Date.now() - recentCode.createdAt.getTime());
    return {
      allowed: false,
      reason: 'rate_limit',
      remainingMs: Math.max(0, remainingMs),
    };
  }

  return { allowed: true };
}

// ==================== Main Service ====================

class EmailVerificationService {
  /**
   * Send verification code to email
   */
  async sendCode(
    email: string,
    type: 'register' | 'reset_password' = 'register'
  ): Promise<{ success: boolean; error?: string; remainingMs?: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: 'invalid_email' };
    }

    // Check rate limit
    const rateLimit = await checkSendRateLimit(normalizedEmail);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'rate_limit',
        remainingMs: rateLimit.remainingMs,
      };
    }

    // Get SMTP config
    const smtpConfig = await getSmtpConfig();
    if (!smtpConfig) {
      logger.error('SMTP not configured');
      return { success: false, error: 'smtp_not_configured' };
    }

    // Generate code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to database
    await VerificationCode.create({
      email: normalizedEmail,
      code,
      type,
      expiresAt,
    });

    // Detect email provider for helpful tips
    const provider = detectEmailProvider(normalizedEmail);

    // Build email content
    const subject = type === 'register'
      ? '【验证码】注册账号 - 邮箱验证'
      : '【验证码】重置密码 - 邮箱验证';

    const text = `您的验证码是：${code}

验证码 10 分钟内有效，请勿泄露给他人。

${type === 'register' ? '如非本人操作，请忽略此邮件。' : '如非本人操作，请忽略此邮件，您的账号仍然安全。'}`;

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📧 邮箱验证</h1>
  </div>
  <div style="background: #f8fafc; border-radius: 0 0 12px 12px; padding: 24px;">
    <p style="color: #334155; margin: 0 0 16px;">您的验证码是：</p>
    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 16px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${code}</span>
    </div>
    <p style="color: #64748b; font-size: 14px; margin: 0;">
      ⏱️ 验证码 <strong>10 分钟</strong>内有效<br>
      🔒 请勿泄露给他人
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
      ${type === 'register' ? '如非本人操作，请忽略此邮件。' : '如非本人操作，请忽略此邮件，您的账号仍然安全。'}
    </p>
  </div>
</div>`;

    // Send email
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: { user: smtpConfig.user, pass: smtpConfig.pass },
      });

      await transporter.sendMail({
        from: smtpConfig.from,
        to: normalizedEmail,
        subject,
        text,
        html,
      });

      logger.info({ email: normalizedEmail, type }, 'Verification code sent');
      return { success: true };
    } catch (err) {
      logger.error({ err, email: normalizedEmail }, 'Failed to send verification email');
      return { success: false, error: 'send_failed' };
    }
  }

  /**
   * Verify the code
   */
  async verifyCode(
    email: string,
    code: string,
    type: 'register' | 'reset_password' = 'register'
  ): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const record = await VerificationCode.findOne({
      email: normalizedEmail,
      type,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return { success: false, error: 'code_not_found_or_expired' };
    }

    // Check attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'too_many_attempts' };
    }

    // Verify code
    if (record.code !== code) {
      record.attempts += 1;
      await record.save();
      return { success: false, error: 'invalid_code' };
    }

    // Mark as verified
    record.verified = true;
    await record.save();

    logger.info({ email: normalizedEmail, type }, 'Verification code verified');
    return { success: true };
  }

  /**
   * Check if email has been verified (for registration)
   */
  async isEmailVerified(
    email: string,
    type: 'register' | 'reset_password' = 'register'
  ): Promise<boolean> {
    const record = await VerificationCode.findOne({
      email: email.toLowerCase().trim(),
      type,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    return !!record;
  }

  /**
   * Clear verification record after successful registration
   */
  async clearVerification(email: string, type: 'register' | 'reset_password' = 'register'): Promise<void> {
    await VerificationCode.deleteMany({
      email: email.toLowerCase().trim(),
      type,
    });
  }

  /**
   * Get email provider info (for UI hints)
   */
  getProviderInfo(email: string): { name: string; authHelp: string } | null {
    const provider = detectEmailProvider(email);
    if (!provider) return null;
    return {
      name: provider.name,
      authHelp: provider.authHelp,
    };
  }
}

export const emailVerificationService = new EmailVerificationService();
export default emailVerificationService;

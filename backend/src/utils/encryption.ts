/**
 * 敏感数据加密工具
 * 用于加密存储在数据库中的敏感信息（如 API 密钥）
 *
 * 使用 AES-256-GCM 算法，提供认证加密
 */

import crypto from 'crypto';

/**
 * 加密算法配置
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 初始化向量长度
const AUTH_TAG_LENGTH = 16;  // 认证标签长度
const SALT_LENGTH = 32;      // 盐值长度

/**
 * 从环境变量获取加密密钥
 * 如果未设置，则生成一个随机密钥（仅用于开发环境）
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (key) {
    // 使用环境变量中的密钥
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    return keyBuffer;
  }

  // 开发环境：使用派生密钥
  if (process.env.NODE_ENV !== 'production') {
    const secret = process.env.JWT_SECRET || 'dev-encryption-key';
    return crypto.createHash('sha256').update(secret).digest();
  }

  throw new Error('ENCRYPTION_KEY environment variable is required in production');
}

/**
 * 从密码派生加密密钥
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * 加密敏感数据
 *
 * @param plaintext - 要加密的明文
 * @returns 加密后的字符串（格式：salt:iv:authTag:ciphertext，均为 hex 编码）
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  try {
    const key = getEncryptionKey();

    // 生成随机盐值和初始化向量
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // 派生密钥
    const derivedKey = deriveKey(key.toString('hex'), salt);

    // 创建加密器
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });

    // 加密
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // 获取认证标签
    const authTag = cipher.getAuthTag();

    // 组合：salt:iv:authTag:ciphertext
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      authTag.toString('hex'),
      ciphertext
    ].join(':');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 解密敏感数据
 *
 * @param encryptedData - 加密的字符串
 * @returns 解密后的明文
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  try {
    const key = getEncryptionKey();

    // 解析加密数据
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, authTagHex, ciphertext] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // 派生密钥
    const derivedKey = deriveKey(key.toString('hex'), salt);

    // 创建解密器
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });

    // 设置认证标签
    decipher.setAuthTag(authTag);

    // 解密
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 检查字符串是否已加密
 * 加密格式：salt:iv:authTag:ciphertext（4个 hex 字符串用冒号分隔）
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;

  const parts = value.split(':');
  if (parts.length !== 4) return false;

  // 检查每个部分是否为有效的 hex 字符串
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}

/**
 * 安全地加密值（如果尚未加密）
 */
export function encryptIfNeeded(value: string): string {
  if (!value) return '';
  if (isEncrypted(value)) return value;
  return encrypt(value);
}

/**
 * 安全地解密值（如果已加密）
 */
export function decryptIfNeeded(value: string): string {
  if (!value) return '';
  if (!isEncrypted(value)) return value;
  return decrypt(value);
}

/**
 * 生成新的加密密钥（用于配置）
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 掩码敏感值用于显示
 */
export function maskSensitiveValue(value: string, visibleChars: number = 4): string {
  if (!value) return '';
  if (value.length <= visibleChars) return '****';
  return value.substring(0, visibleChars) + '****';
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  encryptIfNeeded,
  decryptIfNeeded,
  generateEncryptionKey,
  maskSensitiveValue,
};

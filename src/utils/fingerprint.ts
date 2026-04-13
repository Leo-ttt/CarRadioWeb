/**
 * 生成浏览器指纹
 * 结合多个维度生成唯一标识符
 */
export function generateFingerprint(): string {
  const components: string[] = [];

  // 1. 用户代理
  components.push(navigator.userAgent);

  // 2. 语言
  components.push(navigator.language);

  // 3. 屏幕分辨率
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // 4. 时区偏移
  components.push(new Date().getTimezoneOffset().toString());

  // 5. 平台
  components.push(navigator.platform);

  // 6. Canvas指纹
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('fingerprint', 4, 17);
      const canvasData = canvas.toDataURL();
      components.push(canvasData);
    }
  } catch {
    // Canvas可能被禁用
    components.push('canvas-blocked');
  }

  // 7. WebGL指纹
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    components.push('webgl-blocked');
  }

  // 8. 插件列表（注意：现代浏览器可能限制访问）
  try {
    const plugins = Array.from(navigator.plugins || [])
      .map(p => p.name)
      .join(',');
    components.push(plugins);
  } catch {
    components.push('plugins-blocked');
  }

  // 9. 硬件并发数
  components.push((navigator.hardwareConcurrency || 0).toString());

  // 10. 设备内存
  components.push(((navigator as unknown as Record<string, unknown>).deviceMemory || 0).toString());

  // 11. SessionStorage和LocalStorage支持
  components.push(storageAvailable('sessionStorage') ? 'session-yes' : 'session-no');
  components.push(storageAvailable('localStorage') ? 'local-yes' : 'local-no');

  // 12. IndexedDB支持
  components.push(!!window.indexedDB ? 'idb-yes' : 'idb-no');

  // 13. 触摸支持
  components.push('ontouchstart' in window ? 'touch-yes' : 'touch-no');

  // 生成哈希
  const fingerprint = hashString(components.join('|||'));

  return fingerprint;
}

/**
 * 简单的字符串哈希函数
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 检查存储是否可用
 */
function storageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取或创建持久化的指纹
 * 如果localStorage可用，会缓存指纹
 */
export function getPersistentFingerprint(): string {
  const key = '__fp__';

  try {
    if (storageAvailable('localStorage')) {
      let fingerprint = localStorage.getItem(key);
      if (!fingerprint) {
        fingerprint = generateFingerprint();
        localStorage.setItem(key, fingerprint);
      }
      return fingerprint;
    }
  } catch {
    // LocalStorage不可用，直接生成
  }

  return generateFingerprint();
}

/**
 * 生成会话ID
 */
export function getSessionId(): string {
  const key = '__sid__';

  try {
    if (storageAvailable('sessionStorage')) {
      let sessionId = sessionStorage.getItem(key);
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(key, sessionId);
      }
      return sessionId;
    }
  } catch {
    // SessionStorage不可用
  }

  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


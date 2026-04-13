/**
 * Admin login username (not email) — 3–32 chars, lowercase字母数字与 _-
 */

const LOGIN_USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/

export function isValidLoginUsername(raw: string): boolean {
  const s = raw.trim().toLowerCase()
  return LOGIN_USERNAME_RE.test(s)
}

/** 返回规范化用户名，非法时 null */
export function normalizeLoginUsername(raw: string): string | null {
  const s = raw.trim().toLowerCase()
  if (!LOGIN_USERNAME_RE.test(s)) return null
  return s
}

/**
 * Authentication service — Email verification + JWT based, httpOnly cookie storage
 * OAuth removed - no external dependencies needed
 */

export interface AdminUser {
  id: string
  email: string | null
  loginUsername?: string | null
  nickname: string
  avatar: string
  role: 'super_admin' | 'admin'
  permissions: string[]
  provider: 'email'
  lastLoginAt: string | null
}

/** Token is stored in httpOnly cookie by the backend — no localStorage access needed */

/** Read CSRF token from the non-httpOnly cookie */
function getCsrfHeader(): Record<string, string> {
  if (typeof document === 'undefined') {return {}}
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  return match ? { 'X-CSRF-Token': decodeURIComponent(match[1]) } : {}
}

// --- Email verification code flow ---

/** Send verification code to email */
export async function sendVerificationCode(
  email: string,
  type: 'register' | 'reset_password' = 'register'
): Promise<{ success: boolean; error?: string; remainingMs?: number; provider?: { name: string; authHelp: string } }> {
  try {
    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), type }),
    })
    return await response.json()
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/** Verify the 6-digit code */
export async function verifyCode(
  email: string,
  code: string,
  type: 'register' | 'reset_password' = 'register'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), code, type }),
    })
    return await response.json()
  } catch {
    return { success: false, error: 'network_error' }
  }
}

// --- Email/password login ---

/** 邮箱或登录账号 + 密码 */
export async function emailLogin(
  loginOrEmail: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
      credentials: 'include',
      body: JSON.stringify({ login: loginOrEmail.trim(), password }),
    })
    return await response.json()
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/** Email + password registration (requires email verification first) */
export async function emailRegister(
  email: string,
  password: string,
  nickname?: string,
  skipVerification?: boolean
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
      credentials: 'include',
      body: JSON.stringify({ email, password, nickname, skipVerification }),
    })
    return await response.json()
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/** Reset password with verification code */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
      credentials: 'include',
      body: JSON.stringify({ email, code, newPassword }),
    })
    return await response.json()
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/** Change password (authenticated email users only) */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return await response.json()
  } catch {
    return { success: false, error: 'network_error' }
  }
}

/** Logout — backend clears the httpOnly cookie */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getCsrfHeader(),
      credentials: 'include',
    })
  } catch {
    // Ignore network errors on logout
  }
}

/** Fetch current user info — backend reads token from httpOnly cookie */
export async function fetchCurrentUser(): Promise<AdminUser | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include', // Required to send httpOnly cookies
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.success && data.user) {
      return data.user as AdminUser
    }

    return null
  } catch {
    return null
  }
}

/** Check if user has a specific permission */
export function userHasPermission(user: AdminUser | null, permission: string): boolean {
  if (!user) {return false}
  if (user.role === 'super_admin') {return true}
  return user.permissions.includes(permission)
}

/** Check if user is super admin */
export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === 'super_admin'
}

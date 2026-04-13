/**
 * Admin authentication hook — OAuth + JWT based, httpOnly cookie storage
 * Manages login state, current user, and permissions
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchCurrentUser,
  logout as logoutService,
  type AdminUser,
} from '@/services/authService'

interface UseAdminAuthReturn {
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Whether auth check is in progress */
  isChecking: boolean
  /** Current admin user info */
  user: AdminUser | null
  /** Logout and clear token */
  logout: () => Promise<void>
  /** Re-fetch current user from backend */
  refreshAuth: () => Promise<void>
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [user, setUser] = useState<AdminUser | null>(null)

  const refreshAuth = useCallback(async () => {
    setIsChecking(true)
    try {
      // Always call fetchCurrentUser — backend reads token from httpOnly cookie
      const currentUser = await fetchCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  return {
    isAuthenticated,
    isChecking,
    user,
    logout,
    refreshAuth,
  }
}

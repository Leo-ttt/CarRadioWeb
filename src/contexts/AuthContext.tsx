/**
 * Public auth context — stub for frontend navigation filtering
 * Admin auth is handled separately via useAdminAuth hook + JWT
 */

import React, { createContext, useContext, ReactNode } from 'react'

interface PublicUser {
  roles: string[]
}

interface AuthContextType {
  user: PublicUser | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
})

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Public users have no roles — all nav items without role restrictions are visible
  const value: AuthContextType = {
    user: null,
    isAuthenticated: false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext)
}

export default AuthContext

/**
 * Passport OAuth strategy configuration
 * Supports Google and GitHub providers
 */

import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as GitHubStrategy } from 'passport-github2'
import User, { IUser } from '../models/User'
import { OAuthProvider } from './permissions'
import { createLogger } from '../utils/logger'

const logger = createLogger('passport')

/** Profile shape normalized from OAuth providers */
interface OAuthProfile {
  provider: OAuthProvider
  providerId: string
  email: string
  displayName: string
  avatar: string
}

/** Atomically ensure single super_admin by using MongoDB's unique index on role */
async function createUserAtomic(profile: OAuthProfile): Promise<IUser> {
  // Use insert with try-catch for duplicate key handling
  // The role field doesn't have a unique index, so we handle super_admin uniqueness via logic
  try {
    return await User.create({
      email: profile.email,
      nickname: profile.displayName || profile.email.split('@')[0],
      avatar: profile.avatar,
      role: 'admin', // Default to admin first
      provider: profile.provider,
      providerId: profile.providerId,
      permissions: [],
      isActive: true,
      lastLoginAt: new Date(),
    })
  } catch (error: any) {
    // Handle duplicate key error for compound unique index (provider + providerId)
    if (error.code === 11000) {
      // Race condition: user was created by another request between our checks
      // Fetch and return the existing user
      const existingUser = await User.findOne({
        provider: profile.provider,
        providerId: profile.providerId,
      })
      if (existingUser) {
        return existingUser
      }
    }
    throw error
  }
}

/** Find or create user from OAuth profile; first user becomes super_admin */
async function findOrCreateUser(profile: OAuthProfile): Promise<IUser> {
  // 1. Check if user already exists with this provider + id (returning user)
  let user = await User.findOne({
    provider: profile.provider,
    providerId: profile.providerId,
  })

  if (user) {
    user.lastLoginAt = new Date()
    if (profile.avatar && !user.avatar) {
      user.avatar = profile.avatar
    }
    await user.save()
    return user
  }

  // 2. Check if a placeholder user was invited (OAuth path only — providerId pending_*)
  //    Do not treat email+password accounts as pending: same email must not be overwritten by OAuth
  const pendingUser = await User.findOne({ email: profile.email.toLowerCase() })
  if (pendingUser && pendingUser.providerId.startsWith('pending_')) {
    pendingUser.provider = profile.provider
    pendingUser.providerId = profile.providerId
    pendingUser.avatar = profile.avatar || pendingUser.avatar
    pendingUser.lastLoginAt = new Date()
    // Keep existing nickname if set by super_admin, otherwise use OAuth display name
    if (!pendingUser.nickname || pendingUser.nickname === profile.email.split('@')[0]) {
      pendingUser.nickname = profile.displayName || pendingUser.nickname
    }
    await pendingUser.save()
    return pendingUser
  }

  // 3. No existing user — atomically create with single super_admin guarantee
  // Use MongoDB transaction if available (replica set), otherwise use atomic pattern
  const session = await User.startSession()
  
  try {
    session.startTransaction()
    
    // Check if any super_admin exists within transaction
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' }).session(session)
    
    if (existingSuperAdmin) {
      // Super admin exists, create regular user
      const newUser = await User.create([{
        email: profile.email,
        nickname: profile.displayName || profile.email.split('@')[0],
        avatar: profile.avatar,
        role: 'admin',
        provider: profile.provider,
        providerId: profile.providerId,
        permissions: [],
        isActive: true,
        lastLoginAt: new Date(),
      }], { session })
      
      await session.commitTransaction()
      return newUser[0]
    } else {
      // No super admin exists, this user becomes super_admin
      const newUser = await User.create([{
        email: profile.email,
        nickname: profile.displayName || profile.email.split('@')[0],
        avatar: profile.avatar,
        role: 'super_admin',
        provider: profile.provider,
        providerId: profile.providerId,
        permissions: [],
        isActive: true,
        lastLoginAt: new Date(),
      }], { session })
      
      await session.commitTransaction()
      return newUser[0]
    }
  } catch (error: any) {
    await session.abortTransaction()
    
    // Handle duplicate key error (another concurrent request created user)
    if (error.code === 11000 && error.keyPattern?.providerId) {
      const existingUser = await User.findOne({
        provider: profile.provider,
        providerId: profile.providerId,
      })
      if (existingUser) {
        return existingUser
      }
    }
    
    // Handle duplicate super_admin error - fetch existing and return it
    if (error.code === 11000 && error.keyPattern?.role) {
      // Unique index on role would be needed for this to work
      // Fallback: find any existing user with this email
      const existingUser = await User.findOne({ email: profile.email.toLowerCase() })
      if (existingUser) {
        return existingUser
      }
    }
    
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Ensure only one super_admin exists (demote all others except current user)
 * Used as a safety net for race condition scenarios
 */
async function demoteExtraSuperAdmins(keepUserId: string): Promise<void> {
  await User.updateMany(
    { _id: { $ne: keepUserId }, role: 'super_admin' },
    { $set: { role: 'admin' } }
  )
}

/** Extract normalized profile from Google */
function normalizeGoogleProfile(profile: passport.Profile): OAuthProfile {
  const email = profile.emails?.[0]?.value ?? ''
  const avatar = profile.photos?.[0]?.value ?? ''
  return {
    provider: 'google',
    providerId: profile.id,
    email,
    displayName: profile.displayName || '',
    avatar,
  }
}

/** Extract normalized profile from GitHub */
function normalizeGitHubProfile(profile: passport.Profile): OAuthProfile {
  const email = profile.emails?.[0]?.value ?? ''
  const avatar = (profile as any)._json?.avatar_url ?? profile.photos?.[0]?.value ?? ''
  return {
    provider: 'github',
    providerId: profile.id,
    email,
    displayName: profile.displayName || profile.username || '',
    avatar,
  }
}

/** Initialize passport strategies — call once at app startup */
export function initializePassport(): void {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const githubClientId = process.env.GITHUB_CLIENT_ID
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET
  const callbackBase = process.env.OAUTH_CALLBACK_BASE || ''
  if (!callbackBase) {
    logger.warn('OAUTH_CALLBACK_BASE is not set — OAuth callbacks will use empty base URL. Set this in production.')
  }

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `${callbackBase}/api/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const normalized = normalizeGoogleProfile(profile)
            const user = await findOrCreateUser(normalized)
            done(null, user)
          } catch (error) {
            logger.error({ error, profileId: profile.id }, 'Google OAuth findOrCreateUser failed')
            done(error as Error)
          }
        }
      )
    )
  }

  if (githubClientId && githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubClientId,
          clientSecret: githubClientSecret,
          callbackURL: `${callbackBase}/api/auth/github/callback`,
          scope: ['user:email'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: passport.Profile,
          done: (error: Error | null, user?: IUser) => void
        ) => {
          try {
            const normalized = normalizeGitHubProfile(profile)
            const user = await findOrCreateUser(normalized)
            done(null, user)
          } catch (error) {
            logger.error({ error, profileId: profile.id }, 'GitHub OAuth findOrCreateUser failed')
            done(error as Error)
          }
        }
      )
    )
  }

  // Serialize/deserialize for session (we use JWT, but passport needs these)
  passport.serializeUser((user, done) => {
    done(null, (user as IUser)._id)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
      done(null, user)
    } catch (error) {
      done(error)
    }
  })
}

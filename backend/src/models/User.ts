/**
 * User model — OAuth-based admin accounts
 * Supports Google and GitHub OAuth providers
 */

import mongoose, { Document, Schema } from 'mongoose'
import { ALL_PERMISSIONS, UserRole, OAuthProvider } from '../config/permissions'

export interface IUser extends Document {
  /** OAuth / 邀请绑定；纯「登录账号」用户可无邮箱 */
  email?: string | null
  /** 本站登录账号（与邮箱二选一或同时有邮箱作联系） */
  loginUsername?: string | null
  nickname: string
  avatar: string
  role: UserRole
  provider: OAuthProvider
  providerId: string
  passwordHash?: string
  permissions: string[]
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date

  /** Super admin has all permissions; others check the list */
  hasPermission(permission: string): boolean
  isSuperAdmin(): boolean
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    loginUsername: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
      match: /^[a-z0-9][a-z0-9_-]{2,31}$/,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      required: true,
      enum: ['super_admin', 'admin'] as UserRole[],
      default: 'admin',
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'github', 'email'] as OAuthProvider[],
    },
    providerId: {
      type: String,
      required: true,
      default: '',
    },
    passwordHash: {
      type: String,
      select: false,
    },
    permissions: [
      {
        type: String,
        enum: ALL_PERMISSIONS,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

/** Check if user holds a specific permission */
UserSchema.methods.hasPermission = function (permission: string): boolean {
  if (this.role === 'super_admin') return true
  return this.permissions.includes(permission)
}

/** Convenience check */
UserSchema.methods.isSuperAdmin = function (): boolean {
  return this.role === 'super_admin'
}

// Compound unique index: one account per provider
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true })
UserSchema.index({ email: 1 }, { unique: true, sparse: true })
UserSchema.index({ loginUsername: 1 }, { unique: true, sparse: true })
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })

export default mongoose.model<IUser>('User', UserSchema)

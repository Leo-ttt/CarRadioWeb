/**
 * Audit log model — records admin write operations
 * Auto-expires after 30 days via MongoDB TTL index
 */

import mongoose, { Document, Schema } from 'mongoose'

const AUDIT_LOG_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

export type AuditAction = 'create' | 'update' | 'delete'

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId
  nickname: string
  email: string
  action: AuditAction
  resource: string
  resourceId: string
  summary: string
  ipAddress: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete'] as AuditAction[],
    },
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    resourceId: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

// TTL index: auto-delete after 30 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: AUDIT_LOG_TTL_SECONDS })
AuditLogSchema.index({ userId: 1 })
AuditLogSchema.index({ action: 1 })
AuditLogSchema.index({ resource: 1 })

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

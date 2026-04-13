import mongoose, { Schema, Document } from 'mongoose';

export interface IForumSettings extends Document {
  status: 'not_deployed' | 'deploying' | 'deployed' | 'failed';
  url?: string;
  lastDeployedAt?: Date;
}

const ForumSettingsSchema: Schema = new Schema(
  {
    status: {
      type: String,
      enum: ['not_deployed', 'deploying', 'deployed', 'failed'],
      default: 'not_deployed'
    },
    url: {
      type: String,
      default: ''
    },
    lastDeployedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Use a fixed ID to ensure there is only one document for forum settings
ForumSettingsSchema.pre('save', function(next) {
  this._id = 'global_forum_settings';
  next();
});

export const ForumSettings = mongoose.model<IForumSettings>('ForumSettings', ForumSettingsSchema);

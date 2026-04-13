import mongoose, { Schema, Document } from 'mongoose';

export interface IModuleSettings extends Document {
  knowledgeBase?: any;
  siteSettings?: any;
  /** 前台主导航「产品中心」入口 */
  productCenter?: { enabled: boolean };
  news?: { enabled: boolean; };
  resources?: { enabled: boolean; };
  forum: {
    status: 'not_deployed' | 'deploying_pull' | 'deploying_db' | 'deploying_app' | 'deployed' | 'failed' | 'cancelling';
    url?: string;
    lastLog?: string;
  };
  updatedBy: string;
  updatedAt: Date;
  getEnabledModules(): Array<{ name: string; config: any }>;
  hasModulePermission(moduleName: string, userRoles: string[]): boolean;
}

const ModuleSettingsSchema: Schema = new Schema(
  {
    knowledgeBase: { type: Schema.Types.Mixed, default: {} },
    siteSettings: { type: Schema.Types.Mixed, default: {} },
    productCenter: {
      enabled: { type: Boolean, default: true },
    },
    news: {
      enabled: { type: Boolean, default: true }
    },
    resources: {
      enabled: { type: Boolean, default: true }
    },
    forum: {
      status: {
        type: String,
        enum: ['not_deployed', 'deploying_pull', 'deploying_db', 'deploying_app', 'deployed', 'failed', 'cancelling'],
        default: 'not_deployed'
      },
      url: {
        type: String,
        default: ''
      },
      lastLog: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

// Methods from ConfigService that should be on the model
ModuleSettingsSchema.methods.getEnabledModules = function() {
  const enabledModules: Array<{ name: string; config: any }> = [];
  if (this.productCenter?.enabled !== false) enabledModules.push({ name: 'productCenter', config: this.productCenter });
  if (this.news?.enabled) enabledModules.push({ name: 'news', config: this.news });
  if (this.resources?.enabled) enabledModules.push({ name: 'resources', config: this.resources });
  // Add other modules as needed
  return enabledModules;
};

ModuleSettingsSchema.methods.hasModulePermission = function(_moduleName: string, _userRoles: string[]): boolean {
  // Implement permission logic based on roles and module settings
  return true; // Placeholder
};


export const ModuleSettings = mongoose.model<IModuleSettings>('ModuleSettings', ModuleSettingsSchema);

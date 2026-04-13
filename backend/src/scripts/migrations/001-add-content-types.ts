/**
 * 数据库迁移脚本：添加新内容类型支持
 * 迁移版本：001
 * 创建时间：2024-11-30
 */

import mongoose from 'mongoose';
import { GeneralDocument, VideoTutorial, StructuredArticle } from '../../models/Document';
import { ModuleSettings } from '../../models/ModuleSettings';
import { StorageSettings, DEFAULT_STORAGE_SETTINGS } from '../../models/StorageSettings';
import { ContentSettings } from '../../models/ContentSettings';
import { CONTENT_TYPES } from '../../models/ContentTypes';

/**
 * 迁移执行函数
 */
export async function up(): Promise<void> {
  console.log('开始执行迁移：添加新内容类型支持...');
  
  try {
    // 1. 更新现有Document集合，添加新的内容类型字段
    await updateDocumentCollection();
    
    // 2. 创建默认模块设置
    await createDefaultModuleSettings();
    
    // 3. 创建默认存储设置
    await createDefaultStorageSettings();
    
    // 4. 创建默认内容设置
    await createDefaultContentSettings();
    
    // 5. 创建索引
    await createIndexes();
    
    console.log('迁移执行成功！');
  } catch (error) {
    console.error('迁移执行失败：', error);
    throw error;
  }
}

/**
 * 回滚函数
 */
export async function down(): Promise<void> {
  console.log('开始回滚迁移：移除新内容类型支持...');
  
  try {
    // 1. 删除新增的设置集合
    const db = mongoose.connection.db;
    if (db) {
      await db.collection('module_settings').drop().catch(() => {});
      await db.collection('storage_settings').drop().catch(() => {});
      await db.collection('content_settings').drop().catch(() => {});
    }
    
    // 2. 移除Document集合中的新字段（可选，保留数据兼容性）
    // await Document.updateMany({}, { $unset: { newField: 1 } });
    
    console.log('迁移回滚成功！');
  } catch (error) {
    console.error('迁移回滚失败：', error);
    throw error;
  }
}

/**
 * 更新Document集合
 */
async function updateDocumentCollection(): Promise<void> {
  console.log('更新Document集合...');
  
  // 为现有文档添加默认的新字段
  const updateResult = await GeneralDocument.updateMany(
    { documentType: { $exists: true } },
    {
      $set: {
        status: 'published', // 现有文档默认为已发布
        updatedAt: new Date()
      }
    }
  );
  
  console.log(`更新了 ${updateResult.modifiedCount} 个文档`);
}

/**
 * 创建默认模块设置
 */
async function createDefaultModuleSettings(): Promise<void> {
  console.log('创建默认模块设置...');
  
  const existingSettings = await ModuleSettings.findOne();
  if (existingSettings) {
    console.log('模块设置已存在，跳过创建');
    return;
  }
  
  const defaultSettings = new ModuleSettings({
    updatedBy: 'system',
    updatedAt: new Date()
  });
  
  await defaultSettings.save();
  console.log('默认模块设置创建成功');
}

/**
 * 创建默认存储设置
 */
async function createDefaultStorageSettings(): Promise<void> {
  console.log('创建默认存储设置...');
  
  const existingSettings = await StorageSettings.findOne();
  if (existingSettings) {
    console.log('存储设置已存在，跳过创建');
    return;
  }
  
  const defaultSettings = new StorageSettings({
    ...DEFAULT_STORAGE_SETTINGS,
    updatedBy: 'system',
    updatedAt: new Date()
  });
  
  await defaultSettings.save();
  console.log('默认存储设置创建成功');
}

/**
 * 创建默认内容设置
 */
async function createDefaultContentSettings(): Promise<void> {
  console.log('创建默认内容设置...');
  
  const existingSettings = await ContentSettings.findOne();
  if (existingSettings) {
    console.log('内容设置已存在，跳过创建');
    return;
  }
  
  const defaultSettings = new ContentSettings({
    updatedBy: 'system',
    updatedAt: new Date()
  });
  
  await defaultSettings.save();
  console.log('默认内容设置创建成功');
}

/**
 * 创建数据库索引
 */
async function createIndexes(): Promise<void> {
  console.log('创建数据库索引...');
  
  // Document集合索引
  await GeneralDocument.collection.createIndex({ documentType: 1, status: 1 });
  await GeneralDocument.collection.createIndex({ category: 1, status: 1 });
  await GeneralDocument.collection.createIndex({ createdAt: -1 });
  await GeneralDocument.collection.createIndex({ updatedAt: -1 });
  await GeneralDocument.collection.createIndex({ title: 'text', content: 'text', summary: 'text' });
  
  // 设置集合索引
  await ModuleSettings.collection.createIndex({ updatedAt: -1 });
  await StorageSettings.collection.createIndex({ updatedAt: -1 });
  await ContentSettings.collection.createIndex({ updatedAt: -1 });
  
  console.log('数据库索引创建成功');
}

/**
 * 验证迁移结果
 */
export async function validate(): Promise<boolean> {
  console.log('验证迁移结果...');
  
  try {
    // 检查集合是否存在
    const db = mongoose.connection.db;
    if (!db) {
      console.error('数据库连接未就绪');
      return false;
    }
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['documents', 'module_settings', 'storage_settings', 'content_settings'];
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
    
    if (missingCollections.length > 0) {
      console.error('缺少集合：', missingCollections);
      return false;
    }
    
    // 检查设置文档是否存在
    const moduleSettings = await ModuleSettings.findOne();
    const storageSettings = await StorageSettings.findOne();
    const contentSettings = await ContentSettings.findOne();
    
    if (!moduleSettings || !storageSettings || !contentSettings) {
      console.error('缺少默认设置文档');
      return false;
    }
    
    console.log('迁移验证通过');
    return true;
  } catch (error) {
    console.error('迁移验证失败：', error);
    return false;
  }
}

/**
 * 迁移信息
 */
export const migrationInfo = {
  version: '001',
  name: 'add-content-types',
  description: '添加新内容类型支持和相关配置',
  author: 'system',
  createdAt: '2024-11-30',
  estimatedTime: '2-5分钟'
};

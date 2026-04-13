/**
 * 初始化存储配置
 * 从环境变量同步OSS配置到数据库
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { StorageSettings, STORAGE_PROVIDERS } from '../models/StorageSettings';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../config.env') });

async function initStorageConfig() {
  try {
    console.log('🔧 开始初始化存储配置...');
    
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/official-website';
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功');
    
    // 检查是否已有配置
    let settings = await StorageSettings.findOne();
    
    // 从环境变量读取OSS配置
    const ossConfig = {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
      region: process.env.OSS_REGION || '',
      endpoint: process.env.OSS_ENDPOINT || '',
      secure: true
    };
    
    // 验证OSS配置是否完整
    const isOSSConfigValid = ossConfig.accessKeyId && 
                             ossConfig.accessKeySecret && 
                             ossConfig.bucket && 
                             ossConfig.region && 
                             ossConfig.endpoint;
    
    if (!settings) {
      // 创建新配置
      console.log('📝 创建新的存储配置...');
      settings = new StorageSettings({
        currentProvider: isOSSConfigValid ? STORAGE_PROVIDERS.OSS : STORAGE_PROVIDERS.LOCAL,
        updatedBy: 'system',
        updatedAt: new Date()
      });
      
      // 如果环境变量中有OSS配置,同步到数据库
      if (isOSSConfigValid) {
        settings.providers.oss = ossConfig;
        console.log('✅ 从环境变量同步OSS配置到数据库');
      } else {
        console.log('⚠️ 环境变量中未找到完整的OSS配置,使用默认值');
      }
      
      await settings.save();
      console.log('✅ 存储配置创建成功');
    } else {
      // 更新现有配置
      console.log('📝 更新现有存储配置...');
      
      // 如果环境变量中有OSS配置且与数据库不同,更新数据库
      if (isOSSConfigValid) {
        const needsUpdate = 
          settings.providers.oss.accessKeyId !== ossConfig.accessKeyId ||
          settings.providers.oss.accessKeySecret !== ossConfig.accessKeySecret ||
          settings.providers.oss.bucket !== ossConfig.bucket ||
          settings.providers.oss.region !== ossConfig.region ||
          settings.providers.oss.endpoint !== ossConfig.endpoint;
        
        if (needsUpdate) {
          settings.providers.oss = ossConfig;
          settings.currentProvider = STORAGE_PROVIDERS.OSS;
          settings.updatedBy = 'system';
          settings.updatedAt = new Date();
          await settings.save();
          console.log('✅ OSS配置已从环境变量更新到数据库');
        } else {
          console.log('ℹ️ 数据库中的OSS配置已是最新');
        }
      } else {
        console.log('⚠️ 环境变量中未找到完整的OSS配置,保持数据库现有配置');
      }
    }
    
    // 显示当前配置
    console.log('\n📊 当前存储配置:');
    console.log(`   提供商: ${settings.currentProvider}`);
    console.log(`   OSS Bucket: ${settings.providers.oss.bucket || '未配置'}`);
    console.log(`   OSS Region: ${settings.providers.oss.region || '未配置'}`);
    console.log(`   OSS Endpoint: ${settings.providers.oss.endpoint || '未配置'}`);
    console.log(`   Access Key ID: ${settings.providers.oss.accessKeyId ? settings.providers.oss.accessKeyId.substring(0, 4) + '****' : '未配置'}`);
    
    console.log('\n✅ 存储配置初始化完成');
    
  } catch (error) {
    console.error('❌ 初始化存储配置失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

// 执行初始化
if (require.main === module) {
  initStorageConfig()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('初始化失败:', error);
      process.exit(1);
    });
}

export default initStorageConfig;


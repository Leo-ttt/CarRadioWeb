/**
 * 迁移脚本：修复访客统计索引
 * 
 * 问题：旧版本使用 ip 作为唯一索引，新版本使用 visitorId（IP + 设备指纹）
 * 解决：删除旧的 ip_1 唯一索引
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../../config.env') });

async function migrate() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/official-website';
  
  console.log('🔄 开始迁移：修复访客统计索引...');
  console.log(`📦 连接数据库: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 检查 visitorsummaries 集合是否存在
    const collections = await db.listCollections({ name: 'visitorsummaries' }).toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️ visitorsummaries 集合不存在，无需迁移');
      return;
    }
    
    const collection = db.collection('visitorsummaries');
    
    // 获取当前索引
    const indexes = await collection.indexes();
    console.log('📋 当前索引:', indexes.map(i => i.name));
    
    // 查找并删除 ip_1 唯一索引
    const ipIndex = indexes.find(i => i.name === 'ip_1' && i.unique);
    
    if (ipIndex) {
      console.log('🗑️ 发现旧的 ip_1 唯一索引，正在删除...');
      await collection.dropIndex('ip_1');
      console.log('✅ ip_1 唯一索引已删除');
    } else {
      console.log('ℹ️ 未发现 ip_1 唯一索引，无需删除');
    }
    
    // 确保 visitorId_1 唯一索引存在
    const visitorIdIndex = indexes.find(i => i.name === 'visitorId_1');
    
    if (!visitorIdIndex) {
      console.log('📝 创建 visitorId_1 唯一索引...');
      await collection.createIndex({ visitorId: 1 }, { unique: true });
      console.log('✅ visitorId_1 唯一索引已创建');
    } else {
      console.log('ℹ️ visitorId_1 索引已存在');
    }
    
    // 显示最终索引
    const finalIndexes = await collection.indexes();
    console.log('📋 最终索引:', finalIndexes.map(i => i.name));
    
    console.log('✅ 迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrate;
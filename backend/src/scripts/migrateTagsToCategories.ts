/**
 * 数据迁移脚本：将标签系统迁移到分类系统
 * 
 * 迁移策略：
 * 1. 将主标签转换为分类
 * 2. 将子标签合并到对应的主标签分类中
 * 3. 更新所有文档的标签字段为分类字段
 * 4. 保留原有标签数据作为备份
 */

import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { GeneralDocument, VideoTutorial, StructuredArticle } from '../models/Document';

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/official-website');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 标签模型（临时使用，用于迁移）
const TagSchema = new mongoose.Schema({
  name: String,
  level: Number,
  isActive: Boolean,
  documentType: String,
  parentId: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
});

const Tag = mongoose.model('Tag', TagSchema);

// 迁移统计
interface MigrationStats {
  totalTags: number;
  primaryTags: number;
  secondaryTags: number;
  categoriesCreated: number;
  documentsUpdated: number;
  errors: string[];
}

const stats: MigrationStats = {
  totalTags: 0,
  primaryTags: 0,
  secondaryTags: 0,
  categoriesCreated: 0,
  documentsUpdated: 0,
  errors: []
};

// 生成分类颜色
const generateCategoryColor = (index: number): string => {
  const colors = [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#06B6D4', // 青色
    '#F59E0B', // 黄色
    '#EF4444', // 红色
    '#0EA5E9', // 天蓝色
    '#84CC16', // 青绿色
    '#F97316', // 橙色
    '#EC4899', // 粉色
    '#14B8A6'  // 蓝绿色
  ];
  return colors[index % colors.length];
};

// 生成分类 slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// 1. 迁移标签到分类
const migrateTagsToCategories = async () => {
  console.log('🚀 开始迁移标签到分类...');
  
  try {
    // 获取所有主标签（level = 1）
    const primaryTags = await Tag.find({ level: 1, isActive: true }).sort({ name: 1 });
    stats.primaryTags = primaryTags.length;
    
    // 获取所有子标签（level = 2）
    const secondaryTags = await Tag.find({ level: 2, isActive: true });
    stats.secondaryTags = secondaryTags.length;
    
    stats.totalTags = stats.primaryTags + stats.secondaryTags;
    
    console.log(`📊 发现 ${stats.primaryTags} 个主标签，${stats.secondaryTags} 个子标签`);
    
    // 为每个主标签创建分类
    for (let i = 0; i < primaryTags.length; i++) {
      const primaryTag = primaryTags[i];
      
      try {
        // 检查分类是否已存在
        const existingCategory = await Category.findOne({ name: primaryTag.name });
        if (existingCategory) {
          console.log(`⚠️  分类 "${primaryTag.name}" 已存在，跳过创建`);
          continue;
        }
        
        // 获取该主标签下的子标签
        const relatedSecondaryTags = secondaryTags.filter(
          tag => tag.parentId && tag.parentId.toString() === primaryTag._id.toString()
        );
        
        // 创建分类描述（包含子标签信息）
        let description = `从标签 "${primaryTag.name}" 迁移而来`;
        if (relatedSecondaryTags.length > 0) {
          const secondaryTagNames = relatedSecondaryTags.map(tag => tag.name).join('、');
          description += `，包含子标签：${secondaryTagNames}`;
        }
        
        // 确定适用的文档类型
        const documentTypes: string[] = [];
        if (primaryTag.documentType === 'video' || primaryTag.documentType === 'all') {
          documentTypes.push('video');
        }
        if (primaryTag.documentType === 'general' || primaryTag.documentType === 'all' || !primaryTag.documentType) {
          documentTypes.push('general');
        }
        
        // 如果没有指定文档类型，默认支持所有类型
        if (documentTypes.length === 0) {
          documentTypes.push('general', 'video');
        }
        
        // 创建分类
        const category = new Category({
          name: primaryTag.name,
          slug: generateSlug(primaryTag.name),
          description: description.length > 200 ? description.substring(0, 197) + '...' : description,
          color: generateCategoryColor(i),
          documentTypes,
          order: i,
          isActive: true,
          documentCount: 0,
          createdBy: new mongoose.Types.ObjectId() // 临时使用，实际应该是管理员ID
        });
        
        await category.save();
        stats.categoriesCreated++;
        
        console.log(`✅ 创建分类: ${category.name} (${documentTypes.join(', ')})`);
        
      } catch (error) {
        const errorMsg = `创建分类 "${primaryTag.name}" 失败: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    const errorMsg = `迁移标签到分类失败: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
};

// 2. 更新文档的标签字段为分类字段
const updateDocuments = async () => {
  console.log('🚀 开始更新文档标签字段...');
  
  try {
    // 由于文档模型已经更新，标签字段已被移除
    // 这里只需要确保所有文档都有默认分类
    
    // 更新没有分类的通用文档
    const generalDocsResult = await GeneralDocument.updateMany(
      { category: { $exists: false } },
      { $set: { category: 'general' } }
    );
    
    console.log(`📄 更新了 ${generalDocsResult.modifiedCount} 个通用文档的分类`);
    stats.documentsUpdated += generalDocsResult.modifiedCount;
    
    // 更新没有分类的视频教程
    const videoDocsResult = await VideoTutorial.updateMany(
      { category: { $exists: false } },
      { $set: { category: 'general' } }
    );
    
    console.log(`🎥 更新了 ${videoDocsResult.modifiedCount} 个视频教程的分类`);
    stats.documentsUpdated += videoDocsResult.modifiedCount;
    
    // 更新没有分类的结构化文章
    const structuredDocsResult = await StructuredArticle.updateMany(
      { category: { $exists: false } },
      { $set: { category: 'general' } }
    );
    
    console.log(`📚 更新了 ${structuredDocsResult.modifiedCount} 个结构化文章的分类`);
    stats.documentsUpdated += structuredDocsResult.modifiedCount;
    
  } catch (error) {
    const errorMsg = `更新文档失败: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
};

// 3. 更新分类的文档计数
const updateCategoryDocumentCounts = async () => {
  console.log('🚀 开始更新分类文档计数...');
  
  try {
    const categories = await Category.find({ isActive: true });
    
    for (const category of categories) {
      try {
        // 统计该分类下的文档数量
        const generalCount = await GeneralDocument.countDocuments({ category: category.name });
        const videoCount = await VideoTutorial.countDocuments({ category: category.name });
        const structuredCount = await StructuredArticle.countDocuments({ category: category.name });
        
        const totalCount = generalCount + videoCount + structuredCount;
        
        // 更新分类的文档计数
        await Category.updateOne(
          { _id: category._id },
          { $set: { documentCount: totalCount } }
        );
        
        console.log(`📊 分类 "${category.name}": ${totalCount} 个文档 (通用: ${generalCount}, 视频: ${videoCount}, 结构化: ${structuredCount})`);
        
      } catch (error) {
        const errorMsg = `更新分类 "${category.name}" 文档计数失败: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    const errorMsg = `更新分类文档计数失败: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
};

// 4. 创建默认分类
const createDefaultCategories = async () => {
  console.log('🚀 创建默认分类...');
  
  const defaultCategories = [
    {
      name: 'general',
      slug: 'general',
      description: '通用分类，用于未分类的文档',
      color: '#6B7280',
      documentTypes: ['general', 'video'],
      order: 999
    },
    {
      name: '安装指南',
      slug: 'installation-guide',
      description: '软件安装和配置相关教程',
      color: '#10B981',
      documentTypes: ['general', 'video'],
      order: 1
    },
    {
      name: '故障排除',
      slug: 'troubleshooting',
      description: '常见问题和解决方案',
      color: '#EF4444',
      documentTypes: ['general', 'video'],
      order: 2
    },
    {
      name: '使用教程',
      slug: 'tutorials',
      description: '功能使用和操作指南',
      color: '#3B82F6',
      documentTypes: ['general', 'video'],
      order: 3
    }
  ];
  
  for (const categoryData of defaultCategories) {
    try {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      if (!existingCategory) {
        const category = new Category({
          ...categoryData,
          isActive: true,
          documentCount: 0,
          createdBy: new mongoose.Types.ObjectId()
        });
        
        await category.save();
        console.log(`✅ 创建默认分类: ${category.name}`);
      } else {
        console.log(`⚠️  默认分类 "${categoryData.name}" 已存在，跳过创建`);
      }
    } catch (error) {
      const errorMsg = `创建默认分类 "${categoryData.name}" 失败: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
};

// 主迁移函数
const runMigration = async () => {
  console.log('🚀 开始标签到分类的数据迁移...');
  console.log('='.repeat(50));
  
  await connectDB();
  
  // 1. 创建默认分类
  await createDefaultCategories();
  
  // 2. 迁移标签到分类
  await migrateTagsToCategories();
  
  // 3. 更新文档标签字段
  await updateDocuments();
  
  // 4. 更新分类文档计数
  await updateCategoryDocumentCounts();
  
  // 输出迁移统计
  console.log('='.repeat(50));
  console.log('📊 迁移完成统计:');
  console.log(`   总标签数: ${stats.totalTags}`);
  console.log(`   主标签数: ${stats.primaryTags}`);
  console.log(`   子标签数: ${stats.secondaryTags}`);
  console.log(`   创建分类数: ${stats.categoriesCreated}`);
  console.log(`   更新文档数: ${stats.documentsUpdated}`);
  console.log(`   错误数: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ 迁移过程中的错误:');
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n✅ 数据迁移完成！');
  
  // 关闭数据库连接
  await mongoose.connection.close();
  process.exit(0);
};

// 运行迁移
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  });
}

export { runMigration };

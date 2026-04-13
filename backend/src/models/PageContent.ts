/**
 * 页面内容模型
 * 存储品质保障、关于我们等页面的可配置内容
 */

import { Schema, model, Document } from 'mongoose';

/**
 * 认证证书接口
 */
interface ICertification {
  id: string;
  name: string;
  image: string;
  order: number;
}

/**
 * 里程碑接口
 */
interface IMilestone {
  year: string;
  title: string;
  description: string;
  badge: 'success' | 'info' | 'warning' | 'gradient';
  order: number;
}

/**
 * 品质保障页面内容
 */
interface IQualityPageContent {
  enabled: boolean;
  hero: {
    title: string;
    subtitle: string;
  };
  processFlow: {
    title: string;
    subtitle: string;
  };
  certifications: {
    title: string;
    subtitle: string;
    items: ICertification[];
  };
  stats: {
    agingTest: string;
    tempRange: string;
    inspection: string;
    steps: string;
  };
}

/**
 * 关于我们页面内容
 */
interface IAboutPageContent {
  enabled: boolean;
  hero: {
    title: string;
    slogan: string;
  };
  intro: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  mission: {
    title: string;
    content: string;
  };
  vision: {
    title: string;
    content: string;
  };
  values: {
    title: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  capabilities: {
    title: string;
    subtitle: string;
    image: string;
    items: string[];
  };
  milestones: {
    title: string;
    items: IMilestone[];
  };
  market: {
    title: string;
    content: string;
    countries: string;
    clients: string;
    support: string;
  };
  cta: {
    title: string;
    subtitle: string;
  };
}

/**
 * 页面内容文档接口
 */
export interface IPageContent extends Document {
  pageType: 'quality' | 'about';
  language: 'en' | 'ru';
  quality?: IQualityPageContent;
  about?: IAboutPageContent;
  updatedBy: string;
  updatedAt: Date;
}

/**
 * 默认品质保障页面内容
 */
export const DEFAULT_QUALITY_CONTENT: IQualityPageContent = {
  enabled: true,
  hero: {
    title: 'Quality Assurance',
    subtitle: 'Every product undergoes rigorous testing'
  },
  processFlow: {
    title: 'Quality Control Process',
    subtitle: 'Every product undergoes our rigorous 6-step quality control process'
  },
  certifications: {
    title: 'Certifications',
    subtitle: 'International quality certifications',
    items: [
      { id: 'iatf16949', name: 'IATF 16949', image: '/images/certifications/iatf16949.jpg', order: 1 },
      { id: 'iso14001', name: 'ISO 14001', image: '/images/certifications/iso14001.jpg', order: 2 },
      { id: 'iso9001', name: 'ISO 9001', image: '/images/certifications/iso9001.jpg', order: 3 },
      { id: 'fcc', name: 'FCC', image: '/images/certifications/fcc.jpg', order: 4 }
    ]
  },
  stats: {
    agingTest: '8h',
    tempRange: '-25°C~80°C',
    inspection: '100%',
    steps: '6'
  }
};

/**
 * 默认关于我们页面内容
 */
export const DEFAULT_ABOUT_CONTENT: IAboutPageContent = {
  enabled: true,
  hero: {
    title: 'About Us',
    slogan: 'Professional Automotive Electronics Solutions'
  },
  intro: {
    title: 'Company Introduction',
    paragraph1: 'We are a professional automotive electronics company focused on providing high-quality car multimedia systems.',
    paragraph2: 'With years of experience, we have served customers in over 50 countries worldwide.'
  },
  mission: {
    title: 'Our Mission',
    content: 'To provide the best automotive electronics solutions and enhance driving experience.'
  },
  vision: {
    title: 'Our Vision',
    content: 'To become a global leader in automotive electronics innovation.'
  },
  values: {
    title: 'Core Values',
    items: [
      { id: 'quality', title: 'Quality First', description: 'Strict quality control', icon: 'Shield' },
      { id: 'innovation', title: 'Innovation', description: 'Continuous R&D', icon: 'Zap' },
      { id: 'customer', title: 'Customer Focus', description: 'Customer satisfaction', icon: 'Heart' },
      { id: 'global', title: 'Global Reach', description: 'Worldwide service', icon: 'Globe' }
    ]
  },
  capabilities: {
    title: 'Our Capabilities',
    subtitle: 'Full-service automotive electronics solutions',
    image: 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=800',
    items: [
      'Product Design & Development',
      'Manufacturing & Assembly',
      'Quality Control & Testing',
      'Technical Support & Service'
    ]
  },
  milestones: {
    title: 'Our Journey',
    items: [
      { year: '2015', title: 'Company Founded', description: 'Started our journey', badge: 'success', order: 1 },
      { year: '2018', title: 'Global Expansion', description: 'Entered international markets', badge: 'info', order: 2 },
      { year: '2020', title: 'ISO Certified', description: 'Achieved ISO certifications', badge: 'warning', order: 3 },
      { year: '2023', title: 'Market Leader', description: 'Became industry leader', badge: 'gradient', order: 4 }
    ]
  },
  market: {
    title: 'Global Presence',
    content: 'Serving customers worldwide with professional support',
    countries: '50+',
    clients: '10k+',
    support: '24/7'
  },
  cta: {
    title: 'Ready to Get Started?',
    subtitle: 'Contact us for more information'
  }
};

const PageContentSchema = new Schema<IPageContent>({
  pageType: {
    type: String,
    required: true,
    enum: ['quality', 'about']
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'ru'],
    default: 'en'
  },
  quality: {
    type: Schema.Types.Mixed,
    default: null
  },
  about: {
    type: Schema.Types.Mixed,
    default: null
  },
  updatedBy: {
    type: String,
    default: 'system'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'page_contents'
});

// 复合唯一索引
PageContentSchema.index({ pageType: 1, language: 1 }, { unique: true });

export const PageContent = model<IPageContent>('PageContent', PageContentSchema);

/**
 * 主页核心优势组件
 * 展示4个核心价值主张
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Shield, Users, Sparkles } from 'lucide-react';

interface ValueItem {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  color: string;
}

export const CoreValues: React.FC = () => {
  const { t } = useTranslation();

  const values: ValueItem[] = [
    {
      icon: <Zap className="w-10 h-10" />,
      titleKey: 'innovation',
      descKey: 'innovationDesc',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Shield className="w-10 h-10" />,
      titleKey: 'quality',
      descKey: 'qualityDesc',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Users className="w-10 h-10" />,
      titleKey: 'service',
      descKey: 'serviceDesc',
      color: 'from-cyan-500 to-teal-500'
    },
    {
      icon: <Sparkles className="w-10 h-10" />,
      titleKey: 'excellence',
      descKey: 'excellenceDesc',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full mb-4">
            <span className="text-sm font-medium text-blue-300">
              {t('dashboard.coreValues.badge')}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('dashboard.coreValues.title')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('dashboard.coreValues.subtitle')}
          </p>
        </div>

        {/* 优势网格 - 不对称布局 */}
        <div className="grid md:grid-cols-12 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:-translate-y-2 ${
                index === 0 ? 'md:col-span-7' :
                index === 1 ? 'md:col-span-5' :
                index === 2 ? 'md:col-span-5' :
                'md:col-span-7'
              }`}
            >
              {/* 图标容器 */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                <div className="text-white">
                  {value.icon}
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                {t(`dashboard.coreValues.${value.titleKey}`)}
              </h3>

              {/* 描述 */}
              <p className="text-gray-400 leading-relaxed">
                {t(`dashboard.coreValues.${value.descKey}`)}
              </p>

              {/* 装饰线 */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${value.color} rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />

              {/* 悬浮光效 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * 管理后台资料体系选择器
 * 管理后台界面使用中文，但需要选择管理哪套资料体系
 */

import React, { useState } from 'react';
import { Globe } from 'lucide-react';

export type AdminLanguage = 'en';

interface AdminLanguageSelectorProps {
  onSelect: (language: AdminLanguage) => void;
}

const DATA_SYSTEMS: { code: AdminLanguage; name: string; description: string; flag: string; users: string; theme: string }[] = [
  {
    code: 'en',
    name: '英文资料体系',
    description: '中文和英文用户使用的资料文档',
    flag: '🇺🇸',
    users: '中文用户 + 英文用户',
    theme: 'blue'
  }
];

/**
 * 资料体系选择弹窗
 */
export const AdminLanguageSelector: React.FC<AdminLanguageSelectorProps> = ({
  onSelect
}) => {

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
        {/* 头部 */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">选择资料体系</h2>
              <p className="text-blue-100 text-sm mt-1">请选择要管理的文档语言版本</p>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <div className="space-y-4">
            {DATA_SYSTEMS.map((system) => (
              <div
                key={system.code}
                onClick={() => onSelect(system.code)}
                className="relative p-5 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-lg"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 ${
                      system.theme === 'blue'
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : 'bg-red-100 hover:bg-red-200'
                    }`}>
                      <span className="block">{system.flag}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 mb-2">{system.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{system.description}</p>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2 bg-green-400"></div>
                      <span className="text-xs font-medium text-green-600">{system.users}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook: 管理后台资料体系管理
 */
export const useAdminLanguage = () => {
  const [adminLanguage, setAdminLanguage] = useState<AdminLanguage | null>(null);
  const [showSelector, setShowSelector] = useState(true);

  const handleSelectLanguage = (language: AdminLanguage) => {
    setAdminLanguage(language);
    setShowSelector(false);
  };

  const resetLanguage = () => {
    setAdminLanguage(null);
    setShowSelector(true);
  };

  const forceShowSelector = () => {
    setShowSelector(true);
  };

  return {
    adminLanguage,
    showSelector,
    handleSelectLanguage,
    resetLanguage,
    forceShowSelector
  };
};

export default AdminLanguageSelector;
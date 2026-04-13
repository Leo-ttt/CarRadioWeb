/**
 * 仪表板模块组件
 * 遵循SRP原则：每个模块职责单一
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, LucideIcon } from 'lucide-react';

/**
 * 模块数据接口
 */
export interface ModuleData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  stats?: {
    count: number;
    label: string;
    trend?: 'up' | 'down' | 'stable';
    percentage?: number;
  };
  actions?: Array<{
    label: string;
    href: string;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  enabled: boolean;
  order: number;
}

/**
 * 模块组件属性
 */
interface DashboardModuleProps {
  module: ModuleData;
  onNavigate: (href: string) => void;
  className?: string;
}

/**
 * 仪表板模块组件
 */
export const DashboardModule: React.FC<DashboardModuleProps> = ({
  module,
  onNavigate,
  className = ''
}) => {
  const { t } = useTranslation();

  if (!module.enabled) {
    return null;
  }

  const IconComponent = module.icon;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${module.color}-100 dark:bg-${module.color}-900/20`}>
              <IconComponent className={`w-6 h-6 text-${module.color}-600 dark:text-${module.color}-400`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {t(module.title)}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t(module.description)}
              </p>
            </div>
          </div>

          {module.stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {module.stats.count.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {t(module.stats.label)}
                </span>
                {module.stats.trend && module.stats.percentage && (
                  <Badge
                    variant={
                      module.stats.trend === 'up' ? 'success' :
                      module.stats.trend === 'down' ? 'error' : 'secondary'
                    }
                    size="sm"
                  >
                    {module.stats.trend === 'up' ? '+' : module.stats.trend === 'down' ? '-' : ''}
                    {module.stats.percentage}%
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {module.actions && module.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {module.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === 'default' ? 'primary' : (action.variant || 'outline')}
                size="sm"
                onClick={() => onNavigate(action.href)}
                className="flex items-center space-x-1 group-hover:shadow-sm transition-shadow"
              >
                <span>{t(action.label)}</span>
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardModule;

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Car,
  FileText,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface HierarchyNode {
  id: string
  name: string
  type: 'brand' | 'model' | 'year' | 'document'
  children?: HierarchyNode[]
  data?: any // 原始数据
  count?: number
}

interface HierarchicalManagerProps {
  /** 数据列表 */
  items: any[]
  /** 构建层级结构的函数 */
  buildHierarchy: (items: any[]) => HierarchyNode[]
  /** 渲染叶子节点（最终项目）的函数 */
  renderLeafNode: (node: HierarchyNode, onEdit?: () => void, onDelete?: () => void) => React.ReactNode
  /** 编辑回调 */
  onEdit?: (item: any) => void
  /** 删除回调 */
  onDelete?: (item: any) => void
  /** 添加回调 */
  onAdd?: () => void
  /** 空状态文本 */
  emptyText?: string
  /** 标题 */
  title?: string
}

/**
 * 层级管理组件 - 类似文件夹的树形结构
 */
const HierarchicalManager: React.FC<HierarchicalManagerProps> = ({
  items,
  buildHierarchy,
  renderLeafNode,
  onEdit,
  onDelete,
  onAdd,
  emptyText,
  title
}) => {
  const { t } = useTranslation()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // 构建层级结构（不再需要搜索过滤）
  const hierarchy = useMemo(() => {
    return buildHierarchy(items)
  }, [items, buildHierarchy])

  // 切换节点展开/收起
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // 渲染树节点
  const renderTreeNode = (node: HierarchyNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isLeaf = node.type === 'document' || !hasChildren

    // 根据节点类型选择图标
    const getIcon = () => {
      if (isLeaf) {
        return <FileText className="h-4 w-4 text-blue-500" />
      }

      switch (node.type) {
        case 'brand':
          return <Car className="h-4 w-4 text-green-600" />
        case 'model':
          return isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-600" /> : <Folder className="h-4 w-4 text-yellow-600" />
        case 'year':
          return isExpanded ? <FolderOpen className="h-4 w-4 text-orange-600" /> : <Folder className="h-4 w-4 text-orange-600" />
        default:
          return isExpanded ? <FolderOpen className="h-4 w-4 text-gray-600" /> : <Folder className="h-4 w-4 text-gray-600" />
      }
    }

    // 根据层级设置缩进
    const paddingLeft = level * 24

    return (
      <div key={node.id}>
        {/* 节点本身 */}
        <div
          className={`
            flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors
            ${isLeaf
              ? 'hover:bg-slate-100 dark:hover:bg-gray-700/50 border border-slate-200 dark:border-gray-600 mb-2 bg-slate-50 dark:bg-gray-800/30'
              : 'hover:bg-slate-100 dark:hover:bg-gray-700/30 mb-1'
            }
          `}
          style={{ paddingLeft: paddingLeft + 12 }}
        >
          <div
            className="flex items-center flex-1"
            onClick={() => !isLeaf && toggleNode(node.id)}
          >
            {/* 展开/收起箭头 */}
            {!isLeaf && (
              <div className="mr-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500 dark:text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500 dark:text-gray-500" />
                )}
              </div>
            )}

            {/* 图标 */}
            <div className="mr-3">
              {getIcon()}
            </div>

            {/* 名称和数量 */}
            <div className="flex items-center flex-1">
              <span className={`${isLeaf ? 'font-medium text-slate-700 dark:text-gray-200' : 'font-semibold text-slate-800 dark:text-gray-300'}`}>
                {node.name}
              </span>
              {node.count !== undefined && node.count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-slate-200 dark:bg-gray-600/50 text-slate-600 dark:text-gray-300 rounded-full border border-slate-300 dark:border-gray-500">
                  {node.count}
                </span>
              )}
            </div>
          </div>

          {/* 操作按钮 - 只在叶子节点显示 */}
          {isLeaf && (
            <div className="flex space-x-1">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(node.data)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(node.data)
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 自定义叶子节点渲染 */}
        {isLeaf && renderLeafNode && (
          <div style={{ paddingLeft: paddingLeft + 48 }} className="mb-3">
            {renderLeafNode(
              node,
              onEdit ? () => onEdit(node.data) : undefined,
              onDelete ? () => onDelete(node.data) : undefined
            )}
          </div>
        )}

        {/* 子节点 */}
        {!isLeaf && isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 标题和操作栏 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{title}</h2>
            )}
            {onAdd && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('common.add')}
              </Button>
            )}
          </div>

          {/* 搜索框已移除 - 使用标签筛选器代替 */}
        </CardContent>
      </Card>

      {/* 树形结构 */}
      <Card>
        <CardContent className="p-6">
          {hierarchy.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-slate-400 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-gray-500">
                {emptyText || t('common.noData')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {hierarchy.map(node => renderTreeNode(node))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HierarchicalManager

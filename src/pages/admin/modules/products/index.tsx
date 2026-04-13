/**
 * 产品管理模块
 * 管理电商产品：添加、编辑、删除产品
 */

import { useState, useEffect } from 'react'
import { Edit, Trash2, Image, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import CategorySelector from '@/components/CategorySelector'
import ImageUpload from '@/components/ImageUpload'
import type { DataLanguage } from '../../hooks/useDataLanguage'

interface Product {
  id: string
  title: string
  description: string
  category: string
  image: string
  features: string[]
  specifications: Record<string, string>
  price?: string
  amazonLink?: string
  compatibleVehicles: {
    brand: string
    models: string[]
    years: string
  }[]
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

interface ProductManagementProps {
  dataLanguage: DataLanguage
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ dataLanguage }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' })

  // 加载产品列表
  useEffect(() => {
    loadProducts()
  }, [dataLanguage])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/products?language=${dataLanguage}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setShowEditor(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowEditor(true)
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadProducts()
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const handleSave = async (product: Partial<Product>) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, language: dataLanguage }),
      })

      if (response.ok) {
        setShowEditor(false)
        loadProducts()
      }
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  if (showEditor) {
    return (
      <ProductEditor
        product={editingProduct}
        onSave={handleSave}
        onCancel={() => setShowEditor(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            产品管理
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">管理电商产品信息</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          添加产品
        </Button>
      </div>

      {/* 产品列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
          <Package className="w-16 h-16 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-gray-400">还没有产品，点击上方按钮添加第一个产品</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-slate-200 dark:border-gray-700"
            >
              {/* 产品图片 */}
              <div className="relative h-48 bg-slate-100 dark:bg-gray-700">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-12 h-12 text-slate-400 dark:text-gray-600" />
                  </div>
                )}
                {/* 状态标签 */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      product.status === 'active'
                        ? 'bg-green-500 text-white'
                        : product.status === 'draft'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {product.status === 'active'
                      ? '已发布'
                      : product.status === 'draft'
                      ? '草稿'
                      : '已归档'}
                  </span>
                </div>
              </div>

              {/* 产品信息 */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="text-xs text-slate-400 dark:text-gray-500 mb-4">
                  分类: {product.category}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, id: product.id })}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '' })}
        onConfirm={() => {
          handleDelete(deleteConfirm.id)
          setDeleteConfirm({ open: false, id: '' })
        }}
        title="删除产品"
        message="确定要删除这个产品吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        danger
      />
    </div>
  )
}

/**
 * 产品编辑器组件
 */
interface ProductEditorProps {
  product: Product | null
  onSave: (product: Partial<Product>) => void
  onCancel: () => void
}

const ProductEditor: React.FC<ProductEditorProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      title: '',
      description: '',
      category: '',
      image: '',
      features: [''],
      specifications: {},
      status: 'active', // 默认为已发布
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 创建时自动设置为已发布
    onSave({ ...formData, status: 'active' })
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {product ? '编辑产品' : '添加产品'}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-slate-200 dark:border-gray-700">
        {/* 基本信息 */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            产品名称 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            产品描述 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            分类 *
          </label>
          <CategorySelector
            selectedCategory={formData.category}
            onCategoryChange={(category) => setFormData({ ...formData, category })}
            documentType="product"
            placeholder="选择或创建产品分类"
            allowCreate={true}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            产品图片 *
          </label>
          <ImageUpload
            value={formData.image || ''}
            onChange={(url) => setFormData({ ...formData, image: url })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            亚马逊链接（选填）
          </label>
          <input
            type="url"
            value={formData.amazonLink || ''}
            onChange={(e) => setFormData({ ...formData, amazonLink: e.target.value })}
            placeholder="https://amazon.com/..."
            className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
            填写后，产品页面将显示"在亚马逊购买"按钮
          </p>
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            {product ? '更新产品' : '创建产品'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProductManagement


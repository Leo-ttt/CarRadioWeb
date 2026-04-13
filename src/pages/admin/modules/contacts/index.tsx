/**
 * 联系信息管理模块
 * 整合联系方式管理和表单查看
 */

import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Mail, Phone, MessageSquare, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { FormModal } from '../../components/FormModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
  getContactInfoForAdmin,
  addContactInfo,
  updateContactInfo,
  deleteContactInfo
} from '@/services/contactService'
import type { DataLanguage } from '../../hooks/useDataLanguage'

interface ContactManagementProps {
  dataLanguage: DataLanguage
}

// 使用服务中的类型（包含 address）
import type { ContactInfo as ServiceContactInfo } from '@/services/contactService'

type ContactType = 'email' | 'phone' | 'whatsapp' | 'telegram' | 'vk' | 'youtube' | 'address'

const CONTACT_TYPES: { value: ContactType; label: string; icon: React.ReactNode }[] = [
  { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { value: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'telegram', label: 'Telegram', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'vk', label: 'VK', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'youtube', label: 'YouTube', icon: <Play className="h-4 w-4" /> }
]

const ICON_KEY_MAP: Record<ContactType, string> = {
  email: 'Mail',
  phone: 'Phone',
  whatsapp: 'MessageSquare',
  telegram: 'MessageSquare',
  vk: 'MessageSquare',
  youtube: 'Video',
  address: 'MapPin'
}

export const ContactManagement: React.FC<ContactManagementProps> = ({ dataLanguage }) => {
  const { showToast } = useToast()

  // 状态
  const [contactInfo, setContactInfo] = useState<ServiceContactInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingContact, setEditingContact] = useState<ServiceContactInfo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' })

  // 表单状态
  const [formData, setFormData] = useState({
    type: 'email' as ContactType,
    value: '',
    isActive: true,
    order: 1
  })

  // 加载联系信息
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getContactInfoForAdmin(dataLanguage)
        setContactInfo(data)
      } catch (error) {
        console.error('加载联系信息失败:', error)
        showToast({
          type: 'error',
          title: '加载失败',
          description: ''
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dataLanguage, showToast])

  // 获取类型配置
  const getTypeConfig = (type: ContactType) => {
    return CONTACT_TYPES.find(t => t.value === type) || CONTACT_TYPES[0]
  }

  // 添加联系信息
  const handleAdd = async () => {
    if (!formData.value) {
      showToast({
        type: 'warning',
        title: '警告',
        description: ''
      })
      return
    }

    setSaving(true)
    try {
      const typeConfig = getTypeConfig(formData.type)
      const iconKey = ICON_KEY_MAP[formData.type]
      const newInfo = await addContactInfo({
        ...formData,
        label: typeConfig.label,
        icon: iconKey,
        language: dataLanguage
      })
      setContactInfo([...contactInfo, newInfo])
      setShowAddModal(false)
      setFormData({ type: 'email', value: '', isActive: true, order: 1 })
      showToast({
        type: 'success',
        title: '成功',
        description: ''
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '添加失败',
        description: error instanceof Error ? error.message : ''
      })
    } finally {
      setSaving(false)
    }
  }

  // 编辑联系信息
  const handleEdit = (contact: ServiceContactInfo) => {
    setEditingContact(contact)
    setFormData({
      type: contact.type,
      value: contact.value,
      isActive: contact.isActive,
      order: contact.order
    })
    setShowEditModal(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingContact || !formData.value) {return}

    setSaving(true)
    try {
      const typeConfig = getTypeConfig(formData.type)
      const iconKey = ICON_KEY_MAP[formData.type]
      const updated = await updateContactInfo(editingContact.id, {
        ...formData,
        label: typeConfig.label,
        icon: iconKey
      })
      if (updated) {
        setContactInfo(contactInfo.map(c => c.id === editingContact.id ? { ...c, ...updated } : c))
        setShowEditModal(false)
        setEditingContact(null)
        showToast({
          type: 'success',
          title: '成功',
          description: ''
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: '保存失败',
        description: ''
      })
    } finally {
      setSaving(false)
    }
  }

  // 删除联系信息
  const handleDelete = async () => {
    if (!deleteConfirm.id) {return}

    setSaving(true)
    try {
      await deleteContactInfo(deleteConfirm.id)
      setContactInfo(contactInfo.filter(c => c.id !== deleteConfirm.id))
      setDeleteConfirm({ open: false, id: '' })
      showToast({
        type: 'success',
        title: '成功',
        description: ''
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: '删除失败',
        description: ''
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-800 dark:text-white">联系信息</CardTitle>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
            添加
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : contactInfo.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-gray-400 py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {contactInfo.map(contact => {
                const typeConfig = getTypeConfig(contact.type)
                return (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 dark:text-blue-400">
                        {typeConfig.icon}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{contact.value}</p>
                        <p className="text-sm text-slate-500 dark:text-gray-400">{typeConfig.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contact.isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-500/20 text-gray-500 dark:text-gray-400'
                      }`}>
                        {contact.isActive ? '启用' : '禁用'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ open: true, id: contact.id })}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加模态框 */}
      <FormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加联系方式"
        onSubmit={handleAdd}
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">联系方式类型</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
            >
              {CONTACT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">联系方式内容</label>
            <Input
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 accent-blue-600 bg-white border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">启用</label>
          </div>
        </div>
      </FormModal>

      {/* 编辑模态框 */}
      <FormModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingContact(null) }}
        title="编辑联系方式"
        onSubmit={handleSaveEdit}
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">联系方式类型</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-700 [&>option]:text-slate-800 [&>option]:dark:text-white"
            >
              {CONTACT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">联系方式内容</label>
            <Input
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 accent-blue-600 bg-white border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="editIsActive" className="text-sm text-slate-700 dark:text-slate-300">启用</label>
          </div>
        </div>
      </FormModal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="确认删除"
        message="确定要删除这个联系方式吗？"
        danger
        loading={saving}
      />
    </div>
  )
}

export default ContactManagement


/**
 * UI组件展示页面 - 基于UI/UX Pro Max设计原则
 * 展示所有现代化组件的使用示例
 */

import { useState } from 'react'
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  LoadingSpinner,
  ECommerceButton,
  ECommerceCard
} from '@/components/ui'
import Modal from '@/components/ui/Modal'
import { Search, Mail, Star, Heart, Zap } from 'lucide-react'

export default function UIShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string>('default')

  return (
    <div className="min-h-screen bg-gradient-modern p-8">
      <div className="container mx-auto max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-primary">
            UI/UX Pro Max 组件展示
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            基于现代设计原则的组件库，支持玻璃态、新拟态、渐变等多种风格
          </p>
        </div>

        {/* 按钮组件展示 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gradient-secondary">按钮组件</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 基础按钮 */}
            <Card variant="glass" hoverable>
              <CardHeader>
                <CardTitle>基础按钮</CardTitle>
                <CardDescription>支持多种变体和尺寸</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="glass">Glass</Button>
                    <Button variant="gradient">Gradient</Button>
                    <Button variant="neomorphism">Neomorphism</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 电商按钮 */}
            <Card variant="neomorphism" hoverable>
              <CardHeader>
                <CardTitle>电商按钮</CardTitle>
                <CardDescription>专为电商设计的按钮组件</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <ECommerceButton variant="primary" glow>Primary Glow</ECommerceButton>
                    <ECommerceButton variant="secondary">Secondary</ECommerceButton>
                    <ECommerceButton variant="accent" shimmer>Accent Shimmer</ECommerceButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ECommerceButton variant="glass" ripple>Glass Ripple</ECommerceButton>
                    <ECommerceButton variant="gradient">Gradient</ECommerceButton>
                    <ECommerceButton variant="neomorphism">Neomorphism</ECommerceButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 输入框组件展示 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gradient-primary">输入框组件</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card variant="professional" hoverable>
              <CardHeader>
                <CardTitle>现代输入框</CardTitle>
                <CardDescription>支持多种风格和浮动标签</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="默认输入框"
                    placeholder="请输入内容"
                    variant="default"
                  />
                  <Input
                    label="搜索"
                    placeholder="搜索内容"
                    variant="modern"
                    icon={<Search className="w-4 h-4" />}
                  />
                  <Input
                    label="邮箱"
                    placeholder="your@email.com"
                    variant="glass"
                    icon={<Mail className="w-4 h-4" />}
                    iconPosition="right"
                  />
                  <Input
                    label="浮动标签"
                    placeholder="输入内容"
                    variant="modern"
                    floatingLabel
                  />
                </div>
              </CardContent>
            </Card>

            <Card variant="gradient" hoverable>
              <CardHeader>
                <CardTitle>特殊效果输入框</CardTitle>
                <CardDescription>玻璃态和新拟态效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="玻璃态输入框"
                    placeholder="Glass effect"
                    variant="glass"
                  />
                  <Input
                    label="新拟态输入框"
                    placeholder="Neomorphism effect"
                    variant="neomorphism"
                  />
                  <Input
                    label="带错误提示"
                    placeholder="输入内容"
                    variant="modern"
                    error="这是一个错误提示"
                  />
                  <Input
                    label="带帮助文本"
                    placeholder="输入内容"
                    variant="modern"
                    helperText="这是帮助文本"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 卡片组件展示 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gradient-secondary">卡片组件</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <ECommerceCard variant="default" hoverable>
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">默认卡片</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  传统的卡片设计，适用于大多数场景
                </p>
              </div>
            </ECommerceCard>

            <ECommerceCard variant="glass" hoverable glow>
              <div className="text-center">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">玻璃态卡片</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  现代玻璃态效果，带有发光边框
                </p>
              </div>
            </ECommerceCard>

            <ECommerceCard variant="neomorphism" hoverable>
              <div className="text-center">
                <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">新拟态卡片</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  新拟态设计，立体感强烈
                </p>
              </div>
            </ECommerceCard>

            <ECommerceCard variant="gradient" hoverable borderAnimation>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">渐变卡片</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  渐变背景，带有边框动画
                </p>
              </div>
            </ECommerceCard>

            <ECommerceCard variant="professional" hoverable>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">专业卡片</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  专业设计，适合商务场景
                </p>
              </div>
            </ECommerceCard>

            <Card variant="glass" hoverable glow>
              <CardContent className="text-center pt-6">
                <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">组合卡片</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  使用CardContent组件的卡片
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 徽章组件展示 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gradient-primary">徽章组件</h2>

          <Card variant="professional" hoverable>
            <CardHeader>
              <CardTitle>徽章变体</CardTitle>
              <CardDescription>多种风格和尺寸的徽章</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">基础徽章</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">特殊效果徽章</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="glass" glow>Glass Glow</Badge>
                    <Badge variant="gradient" pulse>Gradient Pulse</Badge>
                    <Badge variant="neomorphism">Neomorphism</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">不同尺寸</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge size="sm" variant="default">Small</Badge>
                    <Badge size="md" variant="default">Medium</Badge>
                    <Badge size="lg" variant="default">Large</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 加载动画展示 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gradient-secondary">加载动画</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card variant="glass" hoverable>
              <CardHeader>
                <CardTitle>加载动画变体</CardTitle>
                <CardDescription>多种现代加载动画效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <LoadingSpinner variant="default" size="lg" />
                    <p className="mt-2 text-sm">Default</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="dots" size="lg" />
                    <p className="mt-2 text-sm">Dots</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="pulse" size="lg" />
                    <p className="mt-2 text-sm">Pulse</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="bounce" size="lg" />
                    <p className="mt-2 text-sm">Bounce</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="gradient" size="lg" />
                    <p className="mt-2 text-sm">Gradient</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="modern" size="lg" />
                    <p className="mt-2 text-sm">Modern</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="neomorphism" hoverable>
              <CardHeader>
                <CardTitle>不同尺寸</CardTitle>
                <CardDescription>从小到大的加载动画</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <LoadingSpinner variant="modern" size="sm" />
                    <p className="mt-2 text-sm">Small</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="modern" size="md" />
                    <p className="mt-2 text-sm">Medium</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="modern" size="lg" />
                    <p className="mt-2 text-sm">Large</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner variant="modern" size="xl" />
                    <p className="mt-2 text-sm">Extra Large</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 模态框展示 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gradient-primary">模态框组件</h2>

          <Card variant="professional" hoverable>
            <CardHeader>
              <CardTitle>模态框变体</CardTitle>
              <CardDescription>不同风格的模态框</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <ECommerceButton
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  打开模态框
                </ECommerceButton>
                <ECommerceButton
                  variant="glass"
                  onClick={() => {
                    setSelectedVariant('glass')
                    setIsModalOpen(true)
                  }}
                >
                  玻璃态模态框
                </ECommerceButton>
                <ECommerceButton
                  variant="neomorphism"
                  onClick={() => {
                    setSelectedVariant('neomorphism')
                    setIsModalOpen(true)
                  }}
                >
                  新拟态模态框
                </ECommerceButton>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 模态框 */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="现代化模态框"
          variant={selectedVariant as any}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              这是一个基于UI/UX Pro Max设计原则的现代化模态框。
            </p>
            <div className="flex gap-2">
              <ECommerceButton variant="primary" size="sm">
                确认
              </ECommerceButton>
              <ECommerceButton
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                取消
              </ECommerceButton>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
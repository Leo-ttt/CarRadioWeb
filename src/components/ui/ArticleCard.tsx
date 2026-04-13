import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Eye, Calendar, User, Tag, ArrowRight } from 'lucide-react'

interface ArticleCardProps {
  id: number
  title: string
  category?: string
  author?: string
  date: string
  views: number
  summary?: string
  tags?: string[]
  onClick?: () => void
  className?: string
}

/**
 * 文章卡片组件
 * 用于显示文档和文章信息
 */
const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  category,
  author = 'Technical Team',
  date,
  views,
  summary,
  tags = [],
  onClick,
  className = ''
}) => {
  return (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary-500 transition-colors line-clamp-2">
            {title}
          </CardTitle>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100" />
        </div>
        {category && (
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{category}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {summary && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {summary}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{views}</span>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ArticleCard
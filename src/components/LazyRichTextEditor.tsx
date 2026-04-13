import React, { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

// 动态加载实际的富文本编辑器
const RealRichTextEditor = lazy(() => import('@/components/RichTextEditor'))

// 透传所有属性
type Props = React.ComponentProps<typeof RealRichTextEditor>

const LazyRichTextEditor: React.FC<Props> = (props) => {
  const { t } = useTranslation()
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
      <RealRichTextEditor {...props} />
    </Suspense>
  )
}

export default LazyRichTextEditor

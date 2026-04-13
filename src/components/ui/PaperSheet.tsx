import React from 'react'
import { cn } from '@/utils/cn'

export interface PaperSheetProps {
  /** Optional header area rendered at top of sheet */
  header?: React.ReactNode
  /** Main content */
  children: React.ReactNode
  className?: string
  /** Corner style; legal pages should use 'none' */
  corner?: 'curl' | 'none'
}

/**
 * Paper-like sheet container with a curled top-left corner.
 * Visual styling is defined in global CSS under `.paper-sheet`.
 */
export function PaperSheet({ header, children, className, corner = 'curl' }: PaperSheetProps) {
  return (
    <div className={cn('paper-sheet', corner === 'none' && 'paper-sheet--no-curl', className)}>
      {header ? <div className="paper-sheet__header">{header}</div> : null}
      <div className="paper-sheet__content">{children}</div>
    </div>
  )
}

export default PaperSheet

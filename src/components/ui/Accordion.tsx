import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
  badge?: string | number
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
  badge
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-600/50 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm shadow-xl mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0 text-primary-300">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-white text-left">{title}</h3>
          {badge && (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-500/15 text-primary-200 border border-primary-500/30">
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400">
          {isOpen ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <ChevronDown className="h-6 w-6" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 py-6 border-t border-gray-600/50 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

interface AccordionProps {
  children: React.ReactNode
  allowMultiple?: boolean
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return <div className="space-y-4">{children}</div>
}


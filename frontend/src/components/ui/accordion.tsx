import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
  className?: string
  isDarkMode?: boolean
}

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
  className,
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const textClasses = isDarkMode ? 'text-slate-400' : 'text-gray-600'
  const hoverClasses = isDarkMode 
    ? 'hover:text-white hover:bg-slate-700' 
    : 'hover:text-gray-900 hover:bg-gray-100'

  return (
    <div className={cn('mb-4', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-2 rounded transition-colors',
          textClasses,
          hoverClasses
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      
      <div 
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Accordion 
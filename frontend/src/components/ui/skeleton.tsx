import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  isDarkMode?: boolean
}

const Skeleton: React.FC<SkeletonProps> = ({ className, isDarkMode = false }) => {
  return (
    <div 
      className={cn(
        'animate-pulse rounded',
        isDarkMode ? 'bg-slate-700' : 'bg-gray-200',
        className
      )}
    />
  )
}

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => (
  <div className={cn(
    'p-6 rounded-lg border',
    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
  )}>
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" isDarkMode={isDarkMode} />
      <Skeleton className="h-3 w-full" isDarkMode={isDarkMode} />
      <Skeleton className="h-3 w-2/3" isDarkMode={isDarkMode} />
    </div>
  </div>
)

export const SkeletonList: React.FC<{ items?: number; isDarkMode?: boolean }> = ({ 
  items = 3, 
  isDarkMode = false 
}) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" isDarkMode={isDarkMode} />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" isDarkMode={isDarkMode} />
          <Skeleton className="h-3 w-1/2" isDarkMode={isDarkMode} />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonMetricCard: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => (
  <div className={cn(
    'p-6 rounded-lg border',
    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
  )}>
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-4 w-24" isDarkMode={isDarkMode} />
      <Skeleton className="h-4 w-4 rounded" isDarkMode={isDarkMode} />
    </div>
    <Skeleton className="h-8 w-16 mb-2" isDarkMode={isDarkMode} />
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" isDarkMode={isDarkMode} />
      <Skeleton className="h-4 w-12" isDarkMode={isDarkMode} />
    </div>
  </div>
)

export default Skeleton 
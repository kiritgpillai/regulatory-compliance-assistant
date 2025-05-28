import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        'animate-pulse rounded bg-surface-alt',
        className
      )}
    />
  )
}

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC = () => (
  <div className="p-6 rounded-lg border border-border bg-surface">
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
)

export const SkeletonList: React.FC<{ items?: number }> = ({ 
  items = 3
}) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonMetricCard: React.FC = () => (
  <div className="p-6 rounded-lg border border-border bg-surface">
    <div className="flex items-center justify-between mb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded" />
    </div>
    <Skeleton className="h-8 w-16 mb-2" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
)

export default Skeleton 
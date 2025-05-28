import React from 'react'
import { cn } from '../../lib/utils'

interface HeatmapData {
  category: string
  coverage: number // 0-100
  documents: number
  lastUpdated: string
}

interface HeatmapProps {
  data: HeatmapData[]
  className?: string
}

const Heatmap: React.FC<HeatmapProps> = ({ data, className }) => {
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-success'
    if (coverage >= 70) return 'bg-warning'
    if (coverage >= 50) return 'bg-info'
    return 'bg-error'
  }

  const getCoverageText = (coverage: number) => {
    if (coverage >= 90) return 'Excellent'
    if (coverage >= 70) return 'Good'
    if (coverage >= 50) return 'Fair'
    return 'Poor'
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-2">
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-alt"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div 
                className={cn(
                  'w-4 h-4 rounded',
                  getCoverageColor(item.coverage)
                )}
                title={`${item.coverage}% coverage`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {item.category}
                  </span>
                  <span className="text-xs text-muted">
                    {item.documents} docs
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted">
                    {getCoverageText(item.coverage)} ({item.coverage}%)
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
        <span className="text-muted">Coverage:</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded bg-error" />
            <span className="text-muted">Poor</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded bg-info" />
            <span className="text-muted">Fair</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded bg-warning" />
            <span className="text-muted">Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded bg-success" />
            <span className="text-muted">Excellent</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Heatmap 
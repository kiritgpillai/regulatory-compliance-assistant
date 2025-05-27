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
  isDarkMode?: boolean
}

const Heatmap: React.FC<HeatmapProps> = ({ data, className, isDarkMode = false }) => {
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return isDarkMode ? 'bg-green-600' : 'bg-green-500'
    if (coverage >= 70) return isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'
    if (coverage >= 50) return isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
    return isDarkMode ? 'bg-red-600' : 'bg-red-500'
  }

  const getCoverageText = (coverage: number) => {
    if (coverage >= 90) return 'Excellent'
    if (coverage >= 70) return 'Good'
    if (coverage >= 50) return 'Fair'
    return 'Poor'
  }

  const textClasses = isDarkMode ? 'text-slate-300' : 'text-gray-700'
  const mutedTextClasses = isDarkMode ? 'text-slate-500' : 'text-gray-500'

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-2">
        {data.map((item, index) => (
          <div 
            key={index}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
            )}
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
                  <span className={`text-sm font-medium ${textClasses}`}>
                    {item.category}
                  </span>
                  <span className={`text-xs ${mutedTextClasses}`}>
                    {item.documents} docs
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${mutedTextClasses}`}>
                    {getCoverageText(item.coverage)} ({item.coverage}%)
                  </span>
                  <span className={`text-xs ${mutedTextClasses}`}>
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs pt-2 border-t">
        <span className={mutedTextClasses}>Coverage:</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded ${isDarkMode ? 'bg-red-600' : 'bg-red-500'}`} />
            <span className={mutedTextClasses}>Poor</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded ${isDarkMode ? 'bg-orange-600' : 'bg-orange-500'}`} />
            <span className={mutedTextClasses}>Fair</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded ${isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'}`} />
            <span className={mutedTextClasses}>Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded ${isDarkMode ? 'bg-green-600' : 'bg-green-500'}`} />
            <span className={mutedTextClasses}>Excellent</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Heatmap 
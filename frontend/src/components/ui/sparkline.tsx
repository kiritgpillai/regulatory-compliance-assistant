import React from 'react'
import { cn } from '../../lib/utils'

interface SparklineProps {
  data: number[]
  className?: string
  color?: 'green' | 'red' | 'blue' | 'yellow'
  height?: number
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  className, 
  color = 'blue',
  height = 20 
}) => {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((max - value) / range) * 100
    return `${x},${y}`
  }).join(' ')

  const colorClasses = {
    green: 'stroke-success',
    red: 'stroke-error',
    blue: 'stroke-primary',
    yellow: 'stroke-warning'
  }

  const trend = data[data.length - 1] > data[0] ? 'up' : 'down'
  const TrendIcon = trend === 'up' ? '↗' : '↘'

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <svg 
        width="60" 
        height={height} 
        viewBox="0 0 100 100" 
        className="overflow-visible"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={colorClasses[color]}
        />
      </svg>
      <span className={`text-xs ${trend === 'up' ? 'text-success' : 'text-error'}`}>
        {TrendIcon}
      </span>
    </div>
  )
}

export default Sparkline 
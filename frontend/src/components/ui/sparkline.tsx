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
    green: 'stroke-green-500',
    red: 'stroke-red-500',
    blue: 'stroke-blue-500',
    yellow: 'stroke-yellow-500'
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
      <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {TrendIcon}
      </span>
    </div>
  )
}

export default Sparkline 
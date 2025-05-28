import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function parseSearchOperators(query: string): {
  cleanQuery: string
  filters: {
    site?: string
    before?: string
    after?: string
    source?: string
  }
} {
  const filters: any = {}
  let cleanQuery = query

  // Extract site: operator
  const siteMatch = query.match(/site:(\S+)/i)
  if (siteMatch) {
    filters.site = siteMatch[1]
    cleanQuery = cleanQuery.replace(/site:\S+/gi, '').trim()
  }

  // Extract before: operator
  const beforeMatch = query.match(/before:(\d{4}-\d{2}-\d{2})/i)
  if (beforeMatch) {
    filters.before = beforeMatch[1]
    cleanQuery = cleanQuery.replace(/before:\d{4}-\d{2}-\d{2}/gi, '').trim()
  }

  // Extract after: operator
  const afterMatch = query.match(/after:(\d{4}-\d{2}-\d{2})/i)
  if (afterMatch) {
    filters.after = afterMatch[1]
    cleanQuery = cleanQuery.replace(/after:\d{4}-\d{2}-\d{2}/gi, '').trim()
  }

  // Extract source: operator
  const sourceMatch = query.match(/source:(\S+)/i)
  if (sourceMatch) {
    filters.source = sourceMatch[1]
    cleanQuery = cleanQuery.replace(/source:\S+/gi, '').trim()
  }

  return { cleanQuery, filters }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function extractRegulations(text: string): string[] {
  const regulations: string[] = []
  
  if (/gdpr/i.test(text)) regulations.push('GDPR')
  if (/sox|sarbanes.?oxley/i.test(text)) regulations.push('SOX')
  if (/sec |securities.{0,20}exchange/i.test(text)) regulations.push('SEC')
  
  return regulations
}

export function getRegulationColor(regulation: string): string {
  switch (regulation.toUpperCase()) {
    case 'GDPR':
      return 'regulation-gdpr'
    case 'SOX':
      return 'regulation-sox'
    case 'SEC':
      return 'regulation-sec'
    default:
      return 'primary'
  }
}

export function getRegulationVariant(regulation: string): 'gdpr' | 'sox' | 'sec' | 'default' {
  switch (regulation.toUpperCase()) {
    case 'GDPR':
      return 'gdpr'
    case 'SOX':
      return 'sox'
    case 'SEC':
      return 'sec'
    default:
      return 'default'
  }
} 
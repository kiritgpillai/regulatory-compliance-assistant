export interface SearchResult {
  id: string
  title: string
  content: string
  category: string
  relevance: number
  source: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface SearchQuery {
  query: string
  filters?: {
    category?: string
    dateRange?: {
      start: string
      end: string
    }
    source?: string
  }
  sort?: 'relevance' | 'date' | 'title'
  page?: number
  limit?: number
}

export interface ComplianceAnalysis {
  documentId: string
  overallScore: number
  regulations: {
    name: string
    score: number
    status: 'compliant' | 'partial' | 'non-compliant'
    issues: string[]
    recommendations: string[]
  }[]
  lastAnalyzed: string
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error'
  complianceAnalysis?: ComplianceAnalysis
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
} 
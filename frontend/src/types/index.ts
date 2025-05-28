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
  title: string
  type: string
  category: string
  size: number
  uploadedAt: string
  uploadDate: string
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error'
  complianceAnalysis?: ComplianceAnalysis
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface HeatmapData {
  category: string
  coverage: number
  documents: number
  lastUpdated: string
}

export interface RiskAlert {
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
  category: string
  description: string
  documentId?: string
  createdAt: string
  status: 'open' | 'in-progress' | 'resolved'
}

export interface ActionItem {
  id: string
  title: string
  type: 'review' | 'approval' | 'update' | 'analysis'
  priority: 'high' | 'medium' | 'low'
  documentId: string
  assignedTo?: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed'
}

export interface MetricData {
  value: number
  trend: number[]
  change: number
  changeType: 'increase' | 'decrease'
} 
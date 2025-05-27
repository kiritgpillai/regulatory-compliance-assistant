import { SearchQuery, SearchResult, Document, ComplianceAnalysis, ApiResponse } from '../types'

const API_BASE_URL = 'http://localhost:8000'

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async search(query: SearchQuery): Promise<ApiResponse<SearchResult[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawData = await response.json()
      
      // Transform the API response to match frontend expectations
      const transformedData: SearchResult[] = rawData.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        relevance: item.relevance_score || item.relevance || 0,
        source: item.source,
        timestamp: item.timestamp || new Date().toISOString(),
        metadata: {
          ...item.metadata,
          url: item.url // Include the URL in metadata for easy access
        }
      }))

      return { success: true, data: transformedData }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }
    }
  }

  async uploadDocument(file: File): Promise<ApiResponse<{ documentId: string }>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/upload-document`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async analyzeDocumentCompliance(
    documentId: string,
    regulations: string[]
  ): Promise<ApiResponse<ComplianceAnalysis>> {
    return this.request<ComplianceAnalysis>('/analyze-compliance', {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, regulations }),
    })
  }

  async getDocuments(): Promise<ApiResponse<Document[]>> {
    return this.request<Document[]>('/documents')
  }

  async getDocument(id: string): Promise<ApiResponse<Document>> {
    return this.request<Document>(`/documents/${id}`)
  }

  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health')
  }
}

export const apiService = new ApiService()
export default apiService 
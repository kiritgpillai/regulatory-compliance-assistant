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
    return this.request<SearchResult[]>('/search', {
      method: 'POST',
      body: JSON.stringify(query),
    })
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
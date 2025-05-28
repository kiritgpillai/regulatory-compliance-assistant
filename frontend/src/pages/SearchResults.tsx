import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Search, FileText, Clock, ExternalLink } from 'lucide-react'
import { apiService } from '../services/api'
import { SearchResult, SearchQuery } from '../types'

const SearchResults: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(true)

    const searchQuery: SearchQuery = {
      query: query.trim(),
      sort: 'relevance',
      limit: 20
    }

    try {
      const response = await apiService.search(searchQuery)
      if (response.success && response.data) {
        setResults(response.data)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-green-600'
    if (relevance >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'GDPR': 'bg-blue-100 text-blue-800',
      'SOX': 'bg-purple-100 text-purple-800',
      'CCPA': 'bg-green-100 text-green-800',
      'HIPAA': 'bg-orange-100 text-orange-800',
      'PCI-DSS': 'bg-red-100 text-red-800',
      'ISO27001': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Regulatory Search</h1>
          <p className="text-gray-600 mt-2">
            Search through compliance requirements and guidelines
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for regulatory requirements..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Found {results.length} results for "{query}"
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Sorted by relevance</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {results.map(result => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2 hover:text-blue-600 cursor-pointer">
                              {result.title}
                            </CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>{result.source}</span>
                              </div>
                              <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(result.category)}`}>
                                {result.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`text-sm font-medium ${getRelevanceColor(result.relevance)}`}>
                              {Math.round(result.relevance * 100)}% match
                            </span>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base leading-relaxed">
                          {result.content}
                        </CardDescription>
                        {result.metadata && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(result.metadata).map(([key, value]) => (
                                <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600">
                    Try searching with different keywords or check your spelling
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Search Regulatory Requirements
              </h3>
              <p className="text-gray-600 mb-6">
                Enter keywords to search through compliance regulations and guidelines
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuery('GDPR data protection')}
                >
                  GDPR data protection
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuery('SOX financial reporting')}
                >
                  SOX financial reporting
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuery('HIPAA privacy requirements')}
                >
                  HIPAA privacy requirements
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SearchResults 
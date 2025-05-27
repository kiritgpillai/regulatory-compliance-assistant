import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import Modal from '../components/ui/modal'
import Accordion from '../components/ui/accordion'
import Sparkline from '../components/ui/sparkline'
import DragDropZone from '../components/ui/drag-drop-zone'
import Heatmap from '../components/ui/heatmap'
import { SkeletonMetricCard, SkeletonList } from '../components/ui/skeleton'
import { apiService } from '../services/api'
import { Document, SearchResult, SearchQuery, RiskAlert, ActionItem, MetricData, HeatmapData } from '../types'
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  Filter,
  Activity,
  Shield,
  ExternalLink,
  Eye,
  Download,
  Star,
  MessageSquare,
  UserPlus
} from 'lucide-react'

interface DashboardProps {
  searchQuery?: string
  isDarkMode: boolean
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  onToggleTheme: () => void
}

const Dashboard: React.FC<DashboardProps> = ({
  searchQuery: externalSearchQuery,
  isDarkMode,
  isSidebarCollapsed
}) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // New state for enhanced features
  const [selectedDocument] = useState<Document | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [metrics, setMetrics] = useState<{
    totalDocuments: MetricData
    complianceScore: MetricData
    pendingReviews: MetricData
    riskAlerts: MetricData
  } | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [showUploadZone, setShowUploadZone] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const docsResponse = await apiService.getDocuments()
      
      if (docsResponse.success && docsResponse.data) {
        setDocuments(docsResponse.data)
      }
      
      // Mock data for enhanced features
      setMetrics({
        totalDocuments: {
          value: docsResponse.data?.length || 0,
          trend: [45, 52, 48, 61, 55, 67, 69],
          change: 2,
          changeType: 'increase'
        },
        complianceScore: {
          value: 94,
          trend: [89, 91, 88, 92, 94, 93, 94],
          change: 1.2,
          changeType: 'increase'
        },
        pendingReviews: {
          value: 12,
          trend: [18, 15, 20, 16, 14, 13, 12],
          change: -1,
          changeType: 'decrease'
        },
        riskAlerts: {
          value: 3,
          trend: [5, 4, 6, 3, 4, 2, 3],
          change: 1,
          changeType: 'increase'
        }
      })

      setRiskAlerts([
        {
          id: '1',
          title: 'GDPR Data Retention Policy Gap',
          severity: 'high',
          category: 'GDPR',
          description: 'Missing data retention policy for customer PII data',
          documentId: 'doc-1',
          createdAt: '2024-01-15T10:00:00Z',
          status: 'open'
        },
        {
          id: '2',
          title: 'SOX Control Documentation Outdated',
          severity: 'medium',
          category: 'SOX',
          description: 'Financial control documentation needs quarterly update',
          documentId: 'doc-2',
          createdAt: '2024-01-14T15:30:00Z',
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'PCI-DSS Vulnerability Assessment Overdue',
          severity: 'high',
          category: 'PCI-DSS',
          description: 'Annual vulnerability assessment is 30 days overdue',
          createdAt: '2024-01-10T09:00:00Z',
          status: 'open'
        }
      ])

      setActionItems([
        {
          id: '1',
          title: 'Review GDPR Privacy Policy Updates',
          type: 'review',
          priority: 'high',
          documentId: 'doc-1',
          assignedTo: 'Legal Team',
          dueDate: '2024-01-20T00:00:00Z',
          status: 'pending'
        },
        {
          id: '2',
          title: 'Approve SOX Control Matrix',
          type: 'approval',
          priority: 'medium',
          documentId: 'doc-2',
          assignedTo: 'Finance Team',
          dueDate: '2024-01-25T00:00:00Z',
          status: 'in-progress'
        }
      ])

      setHeatmapData([
        { category: 'GDPR', coverage: 85, documents: 12, lastUpdated: '2024-01-15T00:00:00Z' },
        { category: 'SOX', coverage: 92, documents: 8, lastUpdated: '2024-01-14T00:00:00Z' },
        { category: 'CCPA', coverage: 78, documents: 6, lastUpdated: '2024-01-12T00:00:00Z' },
        { category: 'HIPAA', coverage: 95, documents: 15, lastUpdated: '2024-01-16T00:00:00Z' },
        { category: 'PCI-DSS', coverage: 67, documents: 4, lastUpdated: '2024-01-10T00:00:00Z' },
        { category: 'ISO27001', coverage: 88, documents: 10, lastUpdated: '2024-01-13T00:00:00Z' }
      ])
      
      setLoading(false)
    }

    fetchData()
  }, [])

  // Handle external search queries
  useEffect(() => {
    if (externalSearchQuery && externalSearchQuery.trim()) {
      handleSearch(externalSearchQuery)
    }
  }, [externalSearchQuery])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setSearchLoading(true)
    setHasSearched(true)
    setSearchQuery(query)

    const searchQuery: SearchQuery = {
      query: query.trim(),
      sort: 'relevance',
      limit: 20
    }

    try {
      const response = await apiService.search(searchQuery)
      if (response.success && response.data) {
        setSearchResults(response.data)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const clearSearch = () => {
    setHasSearched(false)
    setSearchResults([])
    setSearchQuery('')
  }



  const handleFileUpload = (files: FileList) => {
    console.log('Files uploaded:', files)
    // Handle file upload logic here
    setShowUploadZone(false)
  }

  const handleResultClick = (result: SearchResult) => {
    // Check if the result has a URL in metadata
    const url = result.metadata?.url
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      // For internal documents, you could navigate to a document detail page
      console.log('Opening document:', result.id)
      // You could implement a modal or navigate to a detail page here
    }
  }



  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'outline'
    }
  }

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'outline'
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



  const themeClasses = isDarkMode 
    ? 'bg-slate-900 text-white' 
    : 'bg-gray-50 text-gray-900'
  
  const cardClasses = isDarkMode 
    ? 'bg-slate-800 border-slate-700' 
    : 'bg-white border-gray-200'
  
  const sidebarClasses = isDarkMode 
    ? 'bg-slate-800 border-slate-700' 
    : 'bg-white border-gray-200'
  
  const textClasses = isDarkMode 
    ? 'text-slate-400' 
    : 'text-gray-600'
  
  const mutedTextClasses = isDarkMode 
    ? 'text-slate-500' 
    : 'text-gray-500'

  if (loading) {
    return (
      <div className={`h-screen ${themeClasses} flex overflow-hidden`}>
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} ${sidebarClasses} h-full transition-all duration-300 flex-shrink-0`}>
          <div className="p-4 space-y-4">
            <SkeletonList items={5} isDarkMode={isDarkMode} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <SkeletonMetricCard key={i} isDarkMode={isDarkMode} />
                ))}
              </div>
              <SkeletonList items={3} isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`h-screen ${themeClasses} flex overflow-hidden`}>
        {/* Sidebar - Fixed */}
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} ${sidebarClasses} h-full border-r transition-all duration-300 flex-shrink-0`}>
            <div className={`p-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
              {isSidebarCollapsed ? (
                /* Collapsed Sidebar - Icon Only */
                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full h-10 p-0 flex items-center justify-center ${textClasses} ${isDarkMode ? 'hover:text-white hover:bg-slate-600' : 'hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <Filter className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Filters</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full h-10 p-0 flex items-center justify-center ${textClasses} ${isDarkMode ? 'hover:text-white hover:bg-slate-600' : 'hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <Activity className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Activity</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full h-10 p-0 flex items-center justify-center ${textClasses} ${isDarkMode ? 'hover:text-white hover:bg-slate-600' : 'hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <Shield className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Compliance Tools</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="border-t border-gray-200 dark:border-slate-600 my-4"></div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUploadZone(true)}
                        className={`w-full h-10 p-0 flex items-center justify-center ${textClasses} ${isDarkMode ? 'hover:text-white hover:bg-slate-600' : 'hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Upload Documents</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full h-10 p-0 flex items-center justify-center ${textClasses} ${isDarkMode ? 'hover:text-white hover:bg-slate-600' : 'hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Export Data</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                /* Expanded Sidebar - Full Content */
                <>
                  {/* Filters */}
                  <Accordion 
                    title="Filters" 
                    icon={<Filter className="w-4 h-4" />}
                    defaultOpen={true}
                    isDarkMode={isDarkMode}
                  >
                    <div className="space-y-2">
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        All Documents
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Recent
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Favorites
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Shared
                      </Button>
                    </div>
                  </Accordion>

                  {/* Activity */}
                  <Accordion 
                    title="Activity" 
                    icon={<Activity className="w-4 h-4" />}
                    defaultOpen={false}
                    isDarkMode={isDarkMode}
                  >
                    <div className="space-y-2">
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Recent Reviews
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Pending Actions
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Audit Trail
                      </Button>
                    </div>
                  </Accordion>

                  {/* Compliance Tools */}
                  <Accordion 
                    title="Compliance Tools" 
                    icon={<Shield className="w-4 h-4" />}
                    defaultOpen={false}
                    isDarkMode={isDarkMode}
                  >
                    <div className="space-y-2">
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Risk Assessment
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Policy Generator
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        Audit Reports
                      </Button>
                      <Button variant="ghost" size="sm" className={`w-full justify-start ${textClasses}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </Accordion>
                </>
              )}
            </div>
          </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
          {/* Search Results Section */}
          {hasSearched && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Search Results
                </h2>
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  size="sm"
                  className={`${isDarkMode ? 'border-slate-500 text-slate-200 hover:bg-slate-700 hover:border-slate-400 bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Clear Search
                </Button>
              </div>

              {searchLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className={`${cardClasses} animate-pulse`}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className={`h-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded w-3/4`}></div>
                          <div className={`h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded w-full`}></div>
                          <div className={`h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded w-2/3`}></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className={`text-sm ${textClasses}`}>
                      Found {searchResults.length} results for "{searchQuery}"
                    </p>
                    <div className={`flex items-center space-x-2 text-sm ${mutedTextClasses}`}>
                      <Clock className="h-4 w-4" />
                      <span>Sorted by relevance</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {searchResults.map(result => (
                      <Card key={result.id} className={`${cardClasses} hover:shadow-md transition-shadow cursor-pointer`} onClick={() => handleResultClick(result)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className={`text-lg mb-2 hover:text-slate-600 dark:hover:text-slate-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {result.title}
                              </CardTitle>
                              <div className={`flex items-center space-x-4 text-sm ${mutedTextClasses}`}>
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
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResultClick(result)
                                }}
                                className={`${isDarkMode ? 'hover:bg-slate-600 text-slate-300 hover:text-slate-100' : 'hover:bg-slate-100 text-gray-600 hover:text-gray-900'}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className={`text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                            {result.content}
                          </CardDescription>
                          {result.metadata && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(result.metadata).map(([key, value]) => (
                                  <span key={key} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
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
                <Card className={cardClasses}>
                  <CardContent className="text-center py-12">
                    <Search className={`h-12 w-12 ${textClasses} mx-auto mb-4`} />
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      No results found
                    </h3>
                    <p className={textClasses}>
                      Try searching with different keywords or check your spelling
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Dashboard Content - Only show when not searching */}
          {!hasSearched && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className={`${cardClasses} relative group`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textClasses}`}>
                      Total Documents
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <FileText className={`h-4 w-4 ${textClasses}`} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUploadZone(true)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${textClasses}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {metrics?.totalDocuments.value || documents.length}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${mutedTextClasses}`}>
                        {metrics?.totalDocuments.changeType === 'increase' ? '+' : '-'}
                        {metrics?.totalDocuments.change} from last week
                      </p>
                      {metrics?.totalDocuments.trend && (
                        <Sparkline 
                          data={metrics.totalDocuments.trend} 
                          color={metrics.totalDocuments.changeType === 'increase' ? 'green' : 'red'}
                          height={16}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={cardClasses}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textClasses}`}>
                      Compliance Score
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      94%
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${mutedTextClasses}`}>
                        +1.2% from last month
                      </p>
                      {metrics?.complianceScore.trend && (
                        <Sparkline 
                          data={metrics.complianceScore.trend} 
                          color="green"
                          height={16}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={cardClasses}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textClasses}`}>
                      Pending Reviews
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      12
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${mutedTextClasses}`}>
                        3 due this week
                      </p>
                      {metrics?.pendingReviews.trend && (
                        <Sparkline 
                          data={metrics.pendingReviews.trend} 
                          color="yellow"
                          height={16}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={cardClasses}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textClasses}`}>
                      Risk Alerts
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      3
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${mutedTextClasses}`}>
                        2 high priority
                      </p>
                      {metrics?.riskAlerts.trend && (
                        <Sparkline 
                          data={metrics.riskAlerts.trend} 
                          color="red"
                          height={16}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Alerts and Action Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Risk Alerts */}
                <Card className={cardClasses}>
                  <CardHeader>
                    <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                      Risk Alerts
                    </CardTitle>
                    <CardDescription className={textClasses}>
                      High-severity compliance findings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {riskAlerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <span className={`text-xs ${mutedTextClasses}`}>
                                  {alert.category}
                                </span>
                              </div>
                              <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {alert.title}
                              </h4>
                              <Separator className="my-2" />
                              <p className={`text-xs ${mutedTextClasses}`}>
                                {alert.description}
                              </p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className={`${isDarkMode ? 'hover:bg-slate-600 text-slate-300 hover:text-slate-100' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View alert details</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Items */}
                <Card className={cardClasses}>
                  <CardHeader>
                    <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                      <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                      Action Items
                    </CardTitle>
                    <CardDescription className={textClasses}>
                      Pending reviews and approvals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {actionItems.map(item => (
                        <div key={item.id} className={`p-3 rounded-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                                  {item.priority.toUpperCase()}
                                </Badge>
                                <span className={`text-xs ${mutedTextClasses}`}>
                                  {item.type}
                                </span>
                              </div>
                              <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.title}
                              </h4>
                              <Separator className="my-2" />
                              <div className="flex items-center space-x-4">
                                <span className={`text-xs ${mutedTextClasses}`}>
                                  Due: {new Date(item.dueDate).toLocaleDateString()}
                                </span>
                                {item.assignedTo && (
                                  <span className={`text-xs ${mutedTextClasses}`}>
                                    Assigned to: {item.assignedTo}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className={`${isDarkMode ? 'hover:bg-slate-600 text-slate-300 hover:text-slate-100' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Open action item</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Policy Coverage Heatmap */}
              <Card className={cardClasses}>
                <CardHeader>
                  <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Policy Coverage Heatmap
                  </CardTitle>
                  <CardDescription className={textClasses}>
                    Coverage gaps by regulatory category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Heatmap data={heatmapData} isDarkMode={isDarkMode} />
                </CardContent>
              </Card>
            </>
          )}
          </div>
        </div>

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadZone}
          onClose={() => setShowUploadZone(false)}
          title="Upload Documents"
          size="lg"
          isDarkMode={isDarkMode}
        >
          <DragDropZone
            onFilesSelected={handleFileUpload}
            isDarkMode={isDarkMode}
          />
        </Modal>

        {/* Document Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={selectedDocument?.title || 'Document Preview'}
          size="xl"
          isDarkMode={isDarkMode}
        >
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDocument.title}
                  </h3>
                  <p className={`text-sm ${textClasses}`}>
                    {selectedDocument.category} • {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`${isDarkMode ? 'hover:bg-slate-600 text-slate-300 hover:text-slate-100' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`${isDarkMode ? 'hover:bg-slate-600 text-slate-300 hover:text-slate-100' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`${isDarkMode ? 'hover:bg-slate-600 text-slate-300 hover:text-slate-100' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <p className={`text-sm ${textClasses}`}>
                  Document preview would be displayed here. This could include PDF viewer, 
                  text content, or other document-specific rendering.
                </p>
              </div>
              {selectedDocument.complianceAnalysis && (
                <div className="space-y-2">
                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Compliance Analysis
                  </h4>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${textClasses}`}>
                      Overall Score: {selectedDocument.complianceAnalysis.overallScore}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </TooltipProvider>
  )
}

export default Dashboard
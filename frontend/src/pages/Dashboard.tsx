import React, { useEffect, useState, useRef } from 'react'
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
  UserPlus,
  ChevronDown
} from 'lucide-react'

interface DashboardProps {
  searchQuery?: string
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  onToggleTheme: () => void
}

interface DropdownOption {
  value: string
  label: string
  icon?: string
}

interface RiskAssessmentDropdownProps {
  options: DropdownOption[]
  defaultValue?: string
  placeholder?: string
  onChange?: (value: string) => void
}

const RiskAssessmentDropdown: React.FC<RiskAssessmentDropdownProps> = ({
  options,
  defaultValue,
  placeholder = "Select option",
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(defaultValue || options[0]?.value || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === selectedValue)

  const handleSelect = (value: string) => {
    setSelectedValue(value)
    setIsOpen(false)
    onChange?.(value)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-md border border-border bg-surface text-primary px-3 py-2.5 text-sm cursor-pointer hover:bg-hover-bg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-strong focus:ring-offset-2 flex items-center justify-between"
      >
        <div className="flex items-center">
          {selectedOption?.icon && (
            <span className="mr-2 text-accent-teal">{selectedOption.icon}</span>
          )}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg z-50 max-h-60 overflow-y-auto custom-scrollbar-thin shadow-xl backdrop-blur-sm">
          <div className="p-2">
            <div className="space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-all duration-200 group flex items-center ${
                    selectedValue === option.value
                      ? 'bg-hover-bg text-primary'
                      : 'text-secondary hover:text-primary hover:bg-hover-bg'
                  }`}
                >
                  {option.icon && (
                    <span className={`mr-3 transition-colors ${
                      selectedValue === option.value ? 'text-accent-teal' : 'text-muted group-hover:text-accent-teal'
                    }`}>
                      {option.icon}
                    </span>
                  )}
                  <span className="flex-1">{option.label}</span>
                  {selectedValue === option.value && (
                    <CheckCircle className="w-4 h-4 text-accent-teal ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Dashboard: React.FC<DashboardProps> = ({
  searchQuery: externalSearchQuery,
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
  
  // Sidebar functionality state
  const [activeFilter, setActiveFilter] = useState('all')
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityType, setActivityType] = useState<'reviews' | 'actions' | 'audit' | null>(null)
  const [showToolModal, setShowToolModal] = useState(false)
  const [toolType, setToolType] = useState<'risk' | 'policy' | 'audit' | 'export' | null>(null)

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

  // Sidebar functionality handlers
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    // Filter documents based on selection
    console.log('Filter changed to:', filter)
    // TODO: Implement actual filtering logic
  }

  const handleActivityClick = (type: 'reviews' | 'actions' | 'audit') => {
    setActivityType(type)
    setShowActivityModal(true)
  }

  const handleToolClick = (type: 'risk' | 'policy' | 'audit' | 'export') => {
    setToolType(type)
    if (type === 'export') {
      handleExportData()
    } else {
      setShowToolModal(true)
    }
  }

  const handleExportData = () => {
    // Create a simple CSV export of current data
    const csvData = [
      ['Document Title', 'Category', 'Upload Date', 'Status'],
      ...documents.map(doc => [
        doc.title,
        doc.category,
        new Date(doc.uploadDate).toLocaleDateString(),
        doc.status || 'Active'
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `complymate-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
      'GDPR': 'bg-surface text-primary border-l-4 border-l-category-gdpr border border-border',
      'SOX': 'bg-surface text-primary border-l-4 border-l-category-sox border border-border',
      'CCPA': 'bg-surface text-primary border-l-4 border-l-category-ccpa border border-border',
      'HIPAA': 'bg-surface text-primary border-l-4 border-l-category-hipaa border border-border',
      'PCI-DSS': 'bg-surface text-primary border-l-4 border-l-category-pci border border-border',
      'ISO27001': 'bg-surface text-primary border-l-4 border-l-category-iso border border-border',
    }
    return colors[category] || 'bg-surface text-primary border border-border'
  }



  const themeClasses = 'bg-bg text-primary'
  const cardClasses = 'bg-surface border-border shadow-md'
  const sidebarClasses = 'bg-surface border-border shadow-sm'
  const textClasses = 'text-secondary'
  const mutedTextClasses = 'text-muted'
  const buttonClasses = 'hover:text-primary hover:bg-hover-bg hover:shadow-sm'
  const activeButtonClasses = 'bg-primary text-inverse font-medium shadow-sm'

  if (loading) {
    return (
      <div className={`h-screen ${themeClasses} flex overflow-hidden`}>
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} ${sidebarClasses} h-full transition-all duration-300 flex-shrink-0`}>
          <div className="p-4 space-y-4">
            <SkeletonList items={5} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <SkeletonMetricCard key={i} />
                ))}
              </div>
              <SkeletonList items={3} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`h-full ${themeClasses} flex`}>
        {/* Sidebar - Fixed */}
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} ${sidebarClasses} border-r transition-all duration-300 flex-shrink-0 h-full overflow-y-auto custom-scrollbar-thin`}>
            <div className={`p-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
              {isSidebarCollapsed ? (
                /* Collapsed Sidebar - Icon Only */
                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilterChange('all')}
                        className="w-full h-10 p-0 flex items-center justify-center transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
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
                        onClick={() => handleActivityClick('actions')}
                        className="w-full h-10 p-0 flex items-center justify-center transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
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
                        onClick={() => setShowUploadZone(true)}
                        className="w-full h-10 p-0 flex items-center justify-center transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
                      >
                        <Shield className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Quick Tools</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="border-t my-4 border-divider"></div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUploadZone(true)}
                        className="w-full h-10 p-0 flex items-center justify-center transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
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
                        onClick={() => handleToolClick('export')}
                        className="w-full h-10 p-0 flex items-center justify-center transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
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
                  >
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFilterChange('all')}
                        className={`w-full justify-start transition-all duration-200 ${
                          activeFilter === 'all' 
                            ? activeButtonClasses
                            : `${textClasses} ${buttonClasses}`
                        }`}
                      >
                        All Documents
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFilterChange('recent')}
                        className={`w-full justify-start transition-all duration-200 ${
                          activeFilter === 'recent' 
                            ? activeButtonClasses
                            : `${textClasses} ${buttonClasses}`
                        }`}
                      >
                        Recent
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFilterChange('favorites')}
                        className={`w-full justify-start transition-all duration-200 ${
                          activeFilter === 'favorites' 
                            ? activeButtonClasses
                            : `${textClasses} ${buttonClasses}`
                        }`}
                      >
                        Favorites
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFilterChange('shared')}
                        className={`w-full justify-start transition-all duration-200 ${
                          activeFilter === 'shared' 
                            ? activeButtonClasses
                            : `${textClasses} ${buttonClasses}`
                        }`}
                      >
                        Shared
                      </Button>
                    </div>
                  </Accordion>

                  {/* Activity */}
                  <Accordion 
                    title="Activity" 
                    icon={<Activity className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleActivityClick('reviews')}
                        className="w-full justify-start transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
                      >
                        Recent Reviews
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleActivityClick('actions')}
                        className="w-full justify-start transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
                      >
                        Pending Actions
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleActivityClick('audit')}
                        className="w-full justify-start transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
                      >
                        Audit Trail
                      </Button>
                    </div>
                  </Accordion>

                  {/* Quick Tools */}
                  <Accordion 
                    title="Quick Tools" 
                    icon={<Shield className="w-4 h-4" />}
                    defaultOpen={false}
                  >
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowUploadZone(true)}
                        className="w-full justify-start transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToolClick('export')}
                        className="w-full justify-start transition-all duration-200 text-muted hover:bg-hover-bg hover:text-primary"
                      >
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
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
          <div className="p-8">
          {/* Search Results Section */}
          {hasSearched && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary">
                  Search Results
                </h2>
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  size="sm"
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
                          <div className="h-4 bg-surface-alt rounded w-3/4"></div>
                          <div className="h-3 bg-surface-alt rounded w-full"></div>
                          <div className="h-3 bg-surface-alt rounded w-2/3"></div>
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
                              <CardTitle className="text-lg mb-2 hover:text-muted text-primary">
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
                                className="hover:bg-hover-bg text-secondary hover:text-primary"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-base leading-relaxed text-muted">
                            {result.content}
                          </CardDescription>
                          {result.metadata && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(result.metadata).map(([key, value]) => (
                                  <span key={key} className="text-xs px-2 py-1 rounded bg-surface-alt text-secondary">
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
                    <h3 className="text-lg font-medium text-primary mb-2">
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
                    <div className="text-2xl font-bold text-primary">
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
                    <CheckCircle className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
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
                    <Clock className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
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
                    <AlertTriangle className="h-4 w-4 text-error" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
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

                            {/* Compliance Tools Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Risk Assessment Tool */}
                <Card className={cardClasses}>
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-error" />
                      Risk Assessment
                    </CardTitle>
                    <CardDescription className={textClasses}>
                      Generate comprehensive risk assessments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-border bg-surface-alt">
                        <label className="block text-sm font-medium mb-2 text-secondary">
                          Assessment Type
                        </label>
                        <RiskAssessmentDropdown
                          options={[
                            { value: 'gdpr', label: 'GDPR Assessment', icon: '✓' },
                            { value: 'sox', label: 'SOX Assessment' },
                            { value: 'hipaa', label: 'HIPAA Assessment' },
                            { value: 'custom', label: 'Custom Assessment' }
                          ]}
                          defaultValue="gdpr"
                          placeholder="Select assessment type"
                        />
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-surface-alt">
                        <label className="block text-sm font-medium mb-2 text-secondary">
                          Risk Level
                        </label>
                        <RiskAssessmentDropdown
                          options={[
                            { value: 'high', label: 'High Risk' },
                            { value: 'medium', label: 'Medium Risk' },
                            { value: 'low', label: 'Low Risk' }
                          ]}
                          defaultValue="high"
                          placeholder="Select risk level"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        Save Draft
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 bg-accent-teal hover:bg-accent-teal/90 text-white border-accent-teal hover:border-accent-teal/90"
                      >
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Policy Generator Tool */}
                <Card className={cardClasses}>
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-info" />
                      Policy Generator
                    </CardTitle>
                    <CardDescription className={textClasses}>
                      Create compliance policies automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-sm text-primary">Data Privacy Policy</div>
                          <div className={`text-xs ${mutedTextClasses}`}>GDPR, CCPA compliant</div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-sm text-primary">Security Policy</div>
                          <div className={`text-xs ${mutedTextClasses}`}>ISO 27001 compliant</div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-sm text-primary">Financial Controls</div>
                          <div className={`text-xs ${mutedTextClasses}`}>SOX compliant</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Reports Tool */}
                <Card className={cardClasses}>
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center">
                      <Download className="w-5 h-5 mr-2 text-success" />
                      Audit Reports
                    </CardTitle>
                    <CardDescription className={textClasses}>
                      Generate and download compliance reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-border bg-surface-alt">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm text-primary">
                              Q4 2024 Report
                            </h4>
                            <p className={`text-xs ${textClasses}`}>
                              Generated today
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-surface-alt">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm text-primary">
                              GDPR Audit
                            </h4>
                            <p className={`text-xs ${textClasses}`}>
                              3 days ago
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="default" 
                      className="w-full bg-accent-teal hover:bg-accent-teal/90 text-white border-accent-teal hover:border-accent-teal/90"
                      onClick={() => handleToolClick('export')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Alerts and Action Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Risk Alerts */}
            <Card className={cardClasses}>
              <CardHeader>
                <CardTitle className="text-primary flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-error" />
                      Risk Alerts
                </CardTitle>
                <CardDescription className={textClasses}>
                      High-severity compliance findings
                </CardDescription>
              </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {riskAlerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg border border-border ${
                          alert.severity === 'high' ? 'bg-alert-error-bg' : 
                          alert.severity === 'medium' ? 'bg-alert-warning-bg' : 
                          'bg-alert-info-bg'
                        }`}>
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
                              <h4 className="text-sm font-medium text-primary">
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
                        className="text-muted hover:bg-hover-bg hover:text-primary"
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
                <CardTitle className="text-primary flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-warning" />
                      Action Items
                </CardTitle>
                <CardDescription className={textClasses}>
                      Pending reviews and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3">
                      {actionItems.map(item => (
                        <div key={item.id} className="p-3 rounded-lg border border-border">
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
                              <h4 className="text-sm font-medium text-primary">
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
                                  className="text-muted hover:bg-hover-bg hover:text-primary"
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
        >
          <DragDropZone
            onFilesSelected={handleFileUpload}
          />
        </Modal>

        {/* Document Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={selectedDocument?.title || 'Document Preview'}
          size="xl"
        >
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-primary">
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
                    className="text-muted hover:bg-hover-bg hover:text-primary"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted hover:bg-hover-bg hover:text-primary"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted hover:bg-hover-bg hover:text-primary"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-surface-alt">
                <p className={`text-sm ${textClasses}`}>
                  Document preview would be displayed here. This could include PDF viewer, 
                  text content, or other document-specific rendering.
                </p>
              </div>
              {selectedDocument.complianceAnalysis && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-primary">
                    Compliance Analysis
                  </h4>
                  <div className="p-3 rounded-lg bg-surface-alt">
                    <p className={`text-sm ${textClasses}`}>
                      Overall Score: {selectedDocument.complianceAnalysis.overallScore}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Activity Modal */}
        <Modal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          title={
            activityType === 'reviews' ? 'Recent Reviews' :
            activityType === 'actions' ? 'Pending Actions' :
            activityType === 'audit' ? 'Audit Trail' : 'Activity'
          }
          size="lg"
        >
          <div className="space-y-4">
            {activityType === 'reviews' && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-surface-alt">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-primary">
                        GDPR Privacy Policy Review
                      </h4>
                      <p className={`text-sm ${textClasses} mt-1`}>
                        Reviewed by Legal Team • 2 days ago
                      </p>
                    </div>
                    <Badge variant="success">Approved</Badge>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-surface-alt">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-primary">
                        SOX Control Documentation
                      </h4>
                      <p className={`text-sm ${textClasses} mt-1`}>
                        Reviewed by Finance Team • 5 days ago
                      </p>
                    </div>
                    <Badge variant="warning">Pending Changes</Badge>
                  </div>
                </div>
              </div>
            )}

            {activityType === 'actions' && (
              <div className="space-y-3">
                {actionItems.map(item => (
                  <div key={item.id} className="p-4 rounded-lg border border-border bg-surface-alt">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-primary">
                          {item.title}
                        </h4>
                        <p className={`text-sm ${textClasses} mt-1`}>
                          Due: {new Date(item.dueDate).toLocaleDateString()} • {item.assignedTo}
                        </p>
                      </div>
                      <Badge variant={getPriorityVariant(item.priority)}>
                        {item.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activityType === 'audit' && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-surface-alt">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-primary">
                        Document Upload
                      </h4>
                      <p className={`text-sm ${textClasses} mt-1`}>
                        User uploaded "Data Protection Policy v2.1" • 1 hour ago
                      </p>
                    </div>
                    <span className={`text-xs ${mutedTextClasses}`}>CREATE</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-surface-alt">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-primary">
                        Policy Review Completed
                      </h4>
                      <p className={`text-sm ${textClasses} mt-1`}>
                        Legal Team approved GDPR compliance document • 3 hours ago
                      </p>
                    </div>
                    <span className={`text-xs ${mutedTextClasses}`}>UPDATE</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-surface-alt">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-primary">
                        Risk Assessment Generated
                      </h4>
                      <p className={`text-sm ${textClasses} mt-1`}>
                        System generated risk assessment for PCI-DSS compliance • 1 day ago
                      </p>
                    </div>
                    <span className={`text-xs ${mutedTextClasses}`}>SYSTEM</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Tools Modal */}
        <Modal
          isOpen={showToolModal}
          onClose={() => setShowToolModal(false)}
          title={
            toolType === 'risk' ? 'Risk Assessment' :
            toolType === 'policy' ? 'Policy Generator' :
            toolType === 'audit' ? 'Audit Reports' : 'Compliance Tool'
          }
          size="lg"
        >
          <div className="space-y-4">
            {toolType === 'risk' && (
              <div className="space-y-4">
                <p className={`${textClasses}`}>
                  Generate a comprehensive risk assessment for your compliance framework.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-surface-alt">
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Assessment Type
                    </label>
                    <select className="w-full rounded-md border border-border bg-bg text-primary px-3 py-2 text-sm">
                      <option value="gdpr">GDPR Assessment</option>
                      <option value="sox">SOX Assessment</option>
                      <option value="hipaa">HIPAA Assessment</option>
                      <option value="custom">Custom Assessment</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-surface-alt">
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Risk Level
                    </label>
                    <select className="w-full rounded-md border border-border bg-bg text-primary px-3 py-2 text-sm">
                      <option value="high">High Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="low">Low Risk</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-surface-alt col-span-2">
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Assessment Scope
                    </label>
                    <textarea 
                      className="w-full rounded-md border border-border bg-bg text-primary placeholder:text-placeholder px-3 py-2 text-sm h-20 resize-none"
                      placeholder="Describe the scope and specific areas to assess..."
                    />
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-surface-alt col-span-2">
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Additional Requirements
                    </label>
                    <textarea 
                      className="w-full rounded-md border border-border bg-bg text-primary placeholder:text-placeholder px-3 py-2 text-sm h-20 resize-none"
                      placeholder="Any specific requirements or focus areas..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" size="sm">
                    Save Draft
                  </Button>
                  <Button variant="default" size="sm">
                    Generate Assessment
                  </Button>
                </div>
              </div>
            )}

            {toolType === 'policy' && (
              <div className="space-y-4">
                <p className={`${textClasses}`}>
                  Generate compliance policies based on industry standards and regulations.
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Data Privacy Policy</div>
                      <div className={`text-xs ${mutedTextClasses}`}>GDPR, CCPA compliant</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Information Security Policy</div>
                      <div className={`text-xs ${mutedTextClasses}`}>ISO 27001 compliant</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Financial Controls Policy</div>
                      <div className={`text-xs ${mutedTextClasses}`}>SOX compliant</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {toolType === 'audit' && (
              <div className="space-y-4">
                <p className={`${textClasses}`}>
                  Generate comprehensive audit reports for compliance frameworks.
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border border-border bg-surface-alt">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">
                          Q4 2024 Compliance Report
                        </h4>
                        <p className="text-sm text-secondary">
                          Generated on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-surface-alt">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">
                          GDPR Compliance Audit
                        </h4>
                        <p className="text-sm text-secondary">
                          Last updated 3 days ago
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </TooltipProvider>
  )
}

export default Dashboard
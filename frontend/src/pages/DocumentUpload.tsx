import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Checkbox } from '../components/ui/checkbox'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import DragDropZone from '../components/ui/drag-drop-zone'
import { SkeletonList } from '../components/ui/skeleton'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  File, 
  Archive,
  Image,
  Video,
  Music,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { apiService } from '../services/api'
import { ComplianceAnalysis } from '../types'

const REGULATIONS = [
  { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
  { id: 'sox', name: 'SOX', description: 'Sarbanes-Oxley Act' },
  { id: 'ccpa', name: 'CCPA', description: 'California Consumer Privacy Act' },
  { id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
  { id: 'pci-dss', name: 'PCI-DSS', description: 'Payment Card Industry Data Security Standard' },
  { id: 'iso27001', name: 'ISO 27001', description: 'Information Security Management System' },
]

interface FileUpload {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error'
  progress: number
  analysisProgress: number
  complianceResult?: ComplianceAnalysis
  error?: string
}

interface DocumentUploadProps {
  isDarkMode: boolean
  onToggleTheme: () => void
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ isDarkMode }) => {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>(['gdpr', 'sox'])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isRegulationsExpanded, setIsRegulationsExpanded] = useState(true)
  const [isScanning, setIsScanning] = useState(false)

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    const name = file.name.toLowerCase()
    
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
      return <FileText className="w-8 h-8 text-slate-600 dark:text-slate-400" />
    }
    if (type.includes('image')) {
      return <Image className="w-8 h-8 text-green-500" />
    }
    if (type.includes('video')) {
      return <Video className="w-8 h-8 text-purple-500" />
    }
    if (type.includes('audio')) {
      return <Music className="w-8 h-8 text-orange-500" />
    }
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) {
      return <Archive className="w-8 h-8 text-yellow-500" />
    }
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|zip)$/i)) {
      return 'File type not supported. Please upload PDF, Word, TXT, or ZIP files.'
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return 'File size must be less than 50MB'
    }
    
    return null
  }

  const handleFilesSelected = async (fileList: FileList) => {
    setIsScanning(true)
    
    // Simulate client-side scanning delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newFiles: FileUpload[] = []
    const errors: string[] = []

    Array.from(fileList).forEach((file, index) => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        newFiles.push({
          id: `${Date.now()}-${index}`,
          file,
          status: 'pending',
          progress: 0,
          analysisProgress: 0
        })
      }
    })

    if (errors.length > 0) {
      setGlobalError(errors.join('\n'))
    } else {
      setGlobalError(null)
    }

    setFiles(prev => [...prev, ...newFiles])
    setIsScanning(false)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleRegulationToggle = (regulationId: string) => {
    setSelectedRegulations(prev => 
      prev.includes(regulationId)
        ? prev.filter(id => id !== regulationId)
        : [...prev, regulationId]
    )
  }

  const simulateProgress = (
    fileId: string,
    progressType: 'progress' | 'analysisProgress',
    duration: number
  ) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const currentProgress = file[progressType]
          if (currentProgress >= 100) {
            clearInterval(interval)
            return file
          }
          return {
            ...file,
            [progressType]: Math.min(100, currentProgress + Math.random() * 15)
          }
        }
        return file
      }))
    }, duration / 10)
  }

  const uploadFile = async (fileUpload: FileUpload) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'uploading' as const, progress: 0 }
          : f
      ))

      // Simulate upload progress
      simulateProgress(fileUpload.id, 'progress', 2000)

      const uploadResponse = await apiService.uploadDocument(fileUpload.file)
      
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'Upload failed')
      }

      // Update to analyzing status
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'analyzing' as const, progress: 100, analysisProgress: 0 }
          : f
      ))

      // Simulate analysis progress
      simulateProgress(fileUpload.id, 'analysisProgress', 3000)

      const analysisResponse = await apiService.analyzeDocumentCompliance(
        uploadResponse.data.documentId,
        selectedRegulations
      )

      if (!analysisResponse.success || !analysisResponse.data) {
        throw new Error(analysisResponse.error || 'Analysis failed')
      }

      // Update to completed status
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { 
              ...f, 
              status: 'completed' as const, 
              analysisProgress: 100,
              complianceResult: analysisResponse.data 
            }
          : f
      ))

    } catch (err) {
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              error: err instanceof Error ? err.message : 'An error occurred' 
            }
          : f
      ))
    }
  }

  const uploadAllFiles = async () => {
    if (files.length === 0 || selectedRegulations.length === 0) return

    const pendingFiles = files.filter(f => f.status === 'pending')
    
    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  const retryFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      uploadFile(file)
    }
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }

  const clearAll = () => {
    setFiles([])
    setGlobalError(null)
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'uploading': return 'info'
      case 'analyzing': return 'warning'
      case 'completed': return 'success'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'uploading': return <Upload className="w-3 h-3" />
      case 'analyzing': return <Zap className="w-3 h-3" />
      case 'completed': return <CheckCircle2 className="w-3 h-3" />
      case 'error': return <AlertTriangle className="w-3 h-3" />
      default: return <Info className="w-3 h-3" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Queued'
      case 'uploading': return 'Uploading'
      case 'analyzing': return 'Analyzing'
      case 'completed': return 'Complete'
      case 'error': return 'Failed'
      default: return 'Unknown'
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return isDarkMode ? 'text-green-400' : 'text-green-600'
    if (score >= 60) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
    return isDarkMode ? 'text-red-400' : 'text-red-600'
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const uploadingCount = files.filter(f => f.status === 'uploading').length
  const analyzingCount = files.filter(f => f.status === 'analyzing').length
  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length
  const totalFiles = files.length
  const overallProgress = totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0

  return (
    <TooltipProvider>
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Document Upload
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Upload multiple documents and check compliance against regulatory frameworks
          </p>
        </div>

        {globalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{globalError}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <Card className={`mb-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Upload Documents
            </CardTitle>
            <CardDescription className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              Support for PDF, Word, TXT, and ZIP files (max 50MB each). Drag multiple files or folders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropZone
              onFilesSelected={handleFilesSelected}
              multiple={true}
              accept=".pdf,.doc,.docx,.txt,.zip"
              isDarkMode={isDarkMode}
            />
          </CardContent>
        </Card>

        {/* Regulations Selection */}
        <Card className={`mb-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Compliance Frameworks
                </CardTitle>
                <CardDescription className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Select the regulatory frameworks to check compliance against
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {selectedRegulations.length}/{REGULATIONS.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRegulationsExpanded(!isRegulationsExpanded)}
                  className={`md:hidden ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {isRegulationsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`${!isRegulationsExpanded ? 'hidden md:block' : ''}`}>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Frameworks</TabsTrigger>
                <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {REGULATIONS.map((regulation) => (
                    <div key={regulation.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-600 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <Checkbox
                        id={regulation.id}
                        checked={selectedRegulations.includes(regulation.id)}
                        onCheckedChange={() => handleRegulationToggle(regulation.id)}
                        className="mt-0.5"
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <label
                          htmlFor={regulation.id}
                          className={`text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {regulation.name}
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {regulation.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="privacy" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {REGULATIONS.filter(reg => ['gdpr', 'ccpa', 'hipaa'].includes(reg.id)).map((regulation) => (
                    <div key={regulation.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-600 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <Checkbox
                        id={`privacy-${regulation.id}`}
                        checked={selectedRegulations.includes(regulation.id)}
                        onCheckedChange={() => handleRegulationToggle(regulation.id)}
                        className="mt-0.5"
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <label
                          htmlFor={`privacy-${regulation.id}`}
                          className={`text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {regulation.name}
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {regulation.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="financial" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {REGULATIONS.filter(reg => ['sox', 'pci-dss', 'iso27001'].includes(reg.id)).map((regulation) => (
                    <div key={regulation.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-600 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <Checkbox
                        id={`financial-${regulation.id}`}
                        checked={selectedRegulations.includes(regulation.id)}
                        onCheckedChange={() => handleRegulationToggle(regulation.id)}
                        className="mt-0.5"
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <label
                          htmlFor={`financial-${regulation.id}`}
                          className={`text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {regulation.name}
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {regulation.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

                {/* File List */}
        {(files.length > 0 || isScanning) && (
          <Card className={`mb-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    Files ({isScanning ? '...' : files.length})
                  </CardTitle>
                  <CardDescription className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                    {isScanning ? (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full animate-pulse"></div>
                        <span>Scanning files...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                            {pendingCount} pending
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full mr-1"></span>
                            {uploadingCount} uploading
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                            {analyzingCount} analyzing
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            {completedCount} completed
                          </span>
                          {errorCount > 0 && (
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                              {errorCount} errors
                            </span>
                          )}
                        </div>
                        {totalFiles > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-500'}>
                                Overall Progress
                              </span>
                              <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                                {completedCount}/{totalFiles} files ({Math.round(overallProgress)}%)
                              </span>
                            </div>
                            <Progress value={overallProgress} className="h-1" />
                          </div>
                        )}
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {!isScanning && completedCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompleted}
                      className={isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}
                    >
                      Clear Completed
                    </Button>
                  )}
                  {!isScanning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      className={isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="space-y-4">
                  <SkeletonList items={3} isDarkMode={isDarkMode} />
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((fileUpload) => (
                  <div
                    key={fileUpload.id}
                    className={`p-4 rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getFileIcon(fileUpload.file)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {fileUpload.file.name}
                            </h4>
                            <Badge variant={getStatusVariant(fileUpload.status)} className="gap-1">
                              {getStatusIcon(fileUpload.status)}
                              {getStatusText(fileUpload.status)}
                            </Badge>
                          </div>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {formatFileSize(fileUpload.file.size)} • {fileUpload.file.type || 'Unknown type'}
                          </p>
                          
                          <Separator className="my-3" />
                          
                          {/* Status-specific information */}
                          {fileUpload.status === 'pending' && (
                            <div className="flex items-center text-xs">
                              <Clock className="w-3 h-3 mr-1 text-gray-400" />
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-500'}>
                                Waiting in queue...
                              </span>
                            </div>
                          )}
                          
                          {fileUpload.status === 'completed' && (
                            <div className="flex items-center text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                              <span className="text-green-600">
                                Processing completed successfully
                              </span>
                            </div>
                          )}
                          
                          {/* Progress Bars */}
                          {fileUpload.status === 'uploading' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                  <Upload className="w-3 h-3 mr-1 text-slate-600 dark:text-slate-400" />
                                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                                    {getStatusText(fileUpload.status)}...
                                  </span>
                                </div>
                                <Badge variant="info" className="text-xs">
                                  {Math.round(fileUpload.progress)}%
                                </Badge>
                              </div>
                              <Progress value={fileUpload.progress} className="h-2" />
                            </div>
                          )}
                          
                          {fileUpload.status === 'analyzing' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                  <Zap className="w-3 h-3 mr-1 text-yellow-500" />
                                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                                    Analyzing compliance...
                                  </span>
                                </div>
                                <Badge variant="warning" className="text-xs">
                                  {Math.round(fileUpload.analysisProgress)}%
                                </Badge>
                              </div>
                              <Progress value={fileUpload.analysisProgress} className="h-2" />
                            </div>
                          )}
                          
                          {/* Error Message */}
                          {fileUpload.status === 'error' && fileUpload.error && (
                            <div className={`mt-2 p-2 rounded text-xs border ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                              {fileUpload.error}
                            </div>
                          )}
                          
                          {/* Compliance Results */}
                          {fileUpload.status === 'completed' && fileUpload.complianceResult && (
                            <div className={`mt-3 p-3 rounded border ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>Compliance Analysis</span>
                                <span className={`text-sm font-bold ${getComplianceColor(fileUpload.complianceResult.overallScore)}`}>
                                  {fileUpload.complianceResult.overallScore}%
                                </span>
                              </div>
                              <div className="space-y-1">
                                {fileUpload.complianceResult.regulations.slice(0, 3).map((reg, index) => (
                                  <div key={index} className="flex items-center justify-between text-xs">
                                    <span className={isDarkMode ? 'text-green-400' : 'text-green-700'}>{reg.name}</span>
                                    <span className={`font-medium ${getComplianceColor(reg.score)}`}>
                                      {reg.score}%
                                    </span>
                                  </div>
                                                                 ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        {fileUpload.status === 'error' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retryFile(fileUpload.id)}
                                className={isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-600' : ''}
                              >
                                Retry
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Retry uploading this file</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {fileUpload.status === 'completed' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-600' : ''}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View detailed analysis</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileUpload.id)}
                              className={`${isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-slate-600' : 'text-gray-400 hover:text-red-600'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove file from list</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sticky Upload Button */}
        {files.length > 0 && !isScanning && pendingCount > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={uploadAllFiles}
                  disabled={pendingCount === 0 || selectedRegulations.length === 0}
                  size="lg"
                  className={`${isDarkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-gray-900 hover:bg-gray-800 text-white'
              } shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3`}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Analyze ({pendingCount})
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload and analyze all pending files</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default DocumentUpload 
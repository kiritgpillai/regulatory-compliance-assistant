import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Checkbox } from '../components/ui/checkbox'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
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

const DocumentUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>(['gdpr', 'sox'])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [complianceResult, setComplianceResult] = useState<ComplianceAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        setError(null)
      }
    }
  }, [])

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document')
      return false
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('File size must be less than 10MB')
      return false
    }
    
    return true
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        setError(null)
      }
    }
  }

  const handleRegulationToggle = (regulationId: string) => {
    setSelectedRegulations(prev => 
      prev.includes(regulationId)
        ? prev.filter(id => id !== regulationId)
        : [...prev, regulationId]
    )
  }

  const simulateProgress = (
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    duration: number
  ) => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 10
      })
    }, duration / 10)
  }

  const uploadDocument = async () => {
    if (!selectedFile || selectedRegulations.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    
    // Simulate upload progress
    simulateProgress(setUploadProgress, 2000)

    try {
      const uploadResponse = await apiService.uploadDocument(selectedFile)
      
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'Upload failed')
      }

      setUploadProgress(100)
      setUploading(false)
      
      // Start analysis
      setAnalyzing(true)
      setAnalysisProgress(0)
      simulateProgress(setAnalysisProgress, 5000)

      const analysisResponse = await apiService.analyzeDocumentCompliance(
        uploadResponse.data.documentId,
        selectedRegulations
      )

      if (!analysisResponse.success || !analysisResponse.data) {
        throw new Error(analysisResponse.error || 'Analysis failed')
      }

      setAnalysisProgress(100)
      setAnalyzing(false)
      setComplianceResult(analysisResponse.data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUploading(false)
      setAnalyzing(false)
      setUploadProgress(0)
      setAnalysisProgress(0)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setComplianceResult(null)
    setError(null)
    setUploadProgress(0)
    setAnalysisProgress(0)
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'non-compliant': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Upload</h1>
          <p className="text-gray-600 mt-2">
            Upload your documents and check compliance against regulatory frameworks
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Support for PDF and Word documents (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading || analyzing}
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    Drop your document here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, DOC, DOCX files up to 10MB
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regulation Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Regulations</CardTitle>
            <CardDescription>
              Choose which regulatory frameworks to check compliance against
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REGULATIONS.map(regulation => (
                <div key={regulation.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={regulation.id}
                    checked={selectedRegulations.includes(regulation.id)}
                    onCheckedChange={() => handleRegulationToggle(regulation.id)}
                    disabled={uploading || analyzing}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={regulation.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {regulation.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {regulation.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload Button */}
        <div className="mb-6">
          <Button
            onClick={uploadDocument}
            disabled={!selectedFile || selectedRegulations.length === 0 || uploading || analyzing}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Upload and Analyze'}
          </Button>
        </div>

        {/* Progress Indicators */}
        {(uploading || uploadProgress > 0) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {(analyzing || analysisProgress > 0) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Results */}
        {complianceResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Compliance Analysis Results</span>
              </CardTitle>
              <CardDescription>
                Overall compliance score: {' '}
                <span className={`font-bold ${getComplianceColor(complianceResult.overallScore)}`}>
                  {complianceResult.overallScore}%
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {complianceResult.regulations.map(regulation => (
                  <div key={regulation.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{regulation.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(regulation.status)}`}>
                          {regulation.status}
                        </span>
                        <span className={`font-bold ${getComplianceColor(regulation.score)}`}>
                          {regulation.score}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <Progress value={regulation.score} className="h-2" />
                    </div>

                    {regulation.issues.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-red-700 mb-2">Issues Found:</h4>
                        <ul className="text-sm text-red-600 space-y-1">
                          {regulation.issues.map((issue, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {regulation.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Recommendations:</h4>
                        <ul className="text-sm text-blue-600 space-y-1">
                          {regulation.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Analysis completed on {new Date(complianceResult.lastAnalyzed).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload 
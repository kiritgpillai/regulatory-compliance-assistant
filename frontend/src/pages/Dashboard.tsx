import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { apiService } from '../services/api'
import { Document } from '../types'

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      const response = await apiService.getDocuments()
      if (response.success && response.data) {
        setDocuments(response.data)
      }
      setLoading(false)
    }

    fetchDocuments()
  }, [])

  const compliantDocs = documents.filter(doc => 
    doc.complianceAnalysis?.overallScore && doc.complianceAnalysis.overallScore >= 80
  ).length

  const totalDocs = documents.length
  const pendingAnalysis = documents.filter(doc => doc.status === 'analyzing').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your regulatory compliance status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocs}</div>
              <p className="text-xs text-muted-foreground">
                Documents uploaded for analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliant Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{compliantDocs}</div>
              <p className="text-xs text-muted-foreground">
                Documents meeting compliance standards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingAnalysis}</div>
              <p className="text-xs text-muted-foreground">
                Documents currently being analyzed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your compliance workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Link to="/upload">
                <Button>Upload New Document</Button>
              </Link>
              <Link to="/search">
                <Button variant="outline">Search Regulations</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              Your most recently uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No documents uploaded yet. 
                <Link to="/upload" className="text-blue-600 hover:underline ml-1">
                  Upload your first document
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doc.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                        doc.status === 'analyzing' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.complianceAnalysis && (
                        <span className="text-sm font-medium">
                          {doc.complianceAnalysis.overallScore}% compliant
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard 
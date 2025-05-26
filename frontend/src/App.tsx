import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import SearchResults from './pages/SearchResults'
import DocumentUpload from './pages/DocumentUpload'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/upload" element={<DocumentUpload />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 
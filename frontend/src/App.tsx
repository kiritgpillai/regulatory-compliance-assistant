import { useState, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header, { HeaderRef } from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import SearchResults from './pages/SearchResults'
import DocumentUpload from './pages/DocumentUpload'
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts'

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const headerRef = useRef<HeaderRef>(null)
  const location = useLocation()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // The search will be handled by the Dashboard component
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    
    // Force scrollbar refresh
    setTimeout(() => {
      const scrollableElements = document.querySelectorAll('.custom-scrollbar, .custom-scrollbar-thin')
      scrollableElements.forEach(element => {
        const el = element as HTMLElement
        // Force a style recalculation
        el.style.overflow = 'hidden'
        el.offsetHeight // Trigger reflow
        el.style.overflow = 'auto'
      })
      
      // Also refresh the main body scrollbar
      document.body.style.overflow = 'hidden'
      document.body.offsetHeight
      document.body.style.overflow = 'auto'
    }, 50)
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const openUpload = () => {
    // Navigate to upload page or open upload modal
    window.location.href = '/upload'
  }

  const focusSearch = () => {
    headerRef.current?.focusSearch()
  }

  // Keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    focusSearch,
    openUpload,
    toggleSidebar,
    toggleTheme
  })

  useKeyboardShortcuts({ shortcuts })

  // Persist theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Only show sidebar toggle on dashboard page
  const showSidebarToggle = location.pathname === '/'

  return (
    <div 
      className="min-h-screen bg-bg text-primary"
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <Header 
        ref={headerRef}
        onSearch={handleSearch}
        onToggleSidebar={showSidebarToggle ? toggleSidebar : undefined}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleTheme={toggleTheme}
        systemHealth={true}
      />
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              searchQuery={searchQuery}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={toggleSidebar}
              onToggleTheme={toggleTheme}
            />
          } 
        />
        <Route path="/search" element={<SearchResults />} />
        <Route 
          path="/upload" 
          element={<DocumentUpload />} 
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  )
}

export default App 
import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Search, Menu, ChevronLeft, Upload, Home, Sun, Moon, ChevronDown } from 'lucide-react'

interface HeaderProps {
  onSearch?: (query: string) => void
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onToggleTheme?: () => void
  systemHealth?: boolean
}

export interface HeaderRef {
  focusSearch: () => void
}

const Header = forwardRef<HeaderRef, HeaderProps>(({
  onSearch,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onToggleTheme,
  systemHealth = true
}, ref) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Popular searches data
  const popularSearches = [
    'GDPR compliance requirements',
    'SOX audit procedures',
    'data protection policies',
    'financial disclosure rules',
    'cybersecurity frameworks'
  ]

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus()
    }
  }))

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim())
      setShowDropdown(false)
    }
  }

  const handlePopularSearchClick = (query: string) => {
    setSearchQuery(query)
    if (onSearch) {
      onSearch(query)
    }
    setShowDropdown(false)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicks on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setShowDropdown(false)
      }
    }, 150)
  }

  return (
    <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
        {/* Left side - Menu toggle and title */}
        <div className="flex items-center space-x-4">
          {onToggleSidebar && (
            <Button
              onClick={onToggleSidebar}
              variant="ghost"
              size="sm"
              className="transition-all duration-200"
            >
              <div className="relative w-5 h-5">
                <Menu 
                  className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 rotate-90 scale-75'
                  }`} 
                />
                <ChevronLeft 
                  className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed 
                      ? 'opacity-0 -rotate-90 scale-75' 
                      : 'opacity-100 rotate-0 scale-100'
                  }`} 
                />
              </div>
            </Button>
          )}
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Titillium Web, sans-serif' }}>
            ComplyMate
          </h1>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search compliance documents... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="pl-10 pr-10"
                aria-label="Search compliance documents"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown */}
              {showDropdown && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg z-50 max-h-60 overflow-y-auto custom-scrollbar-thin shadow-xl backdrop-blur-sm"
                >
                  <div className="p-3">
                    <div className="text-xs font-medium px-2 py-1 mb-3 text-muted uppercase tracking-wide">
                      Popular Searches
                    </div>
                    <div className="space-y-1">
                      {popularSearches.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handlePopularSearchClick(query)}
                          className="w-full text-left px-3 py-2.5 text-sm rounded-md transition-all duration-200 text-secondary hover:text-primary hover:bg-hover-bg group flex items-center"
                        >
                          <Search className="w-4 h-4 mr-3 text-muted group-hover:text-primary transition-colors" />
                          <span className="flex-1">{query}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right side - Dashboard button, Upload button, system health, and theme toggle */}
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="transition-all duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          
          <Link to="/upload">
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </Link>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${systemHealth ? 'bg-success' : 'bg-error'} rounded-full animate-pulse`}></div>
            <span className={`text-sm ${systemHealth ? 'text-success' : 'text-error'}`}>
              {systemHealth ? 'healthy' : 'issues'}
            </span>
          </div>
          
          {onToggleTheme && (
            <Button
              onClick={onToggleTheme}
              variant="ghost"
              size="sm"
              className="transition-all duration-200 hover:text-accent-primary"
            >
              <Sun className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
})

export default Header 
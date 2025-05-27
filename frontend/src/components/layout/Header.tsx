import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Search, Menu, ChevronLeft, Upload, Home, Sun, Moon, ChevronDown } from 'lucide-react'

interface HeaderProps {
  onSearch?: (query: string) => void
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  isDarkMode?: boolean
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
  isDarkMode = false,
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

  const headerClasses = isDarkMode 
    ? 'bg-slate-800 border-slate-700' 
    : 'bg-white border-gray-200'
  
  const textClasses = isDarkMode 
    ? 'text-slate-400' 
    : 'text-gray-600'

  return (
    <header className={`${headerClasses} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
        {/* Left side - Menu toggle and title */}
        <div className="flex items-center space-x-4">
          {onToggleSidebar && (
            <Button
              onClick={onToggleSidebar}
              variant="ghost"
              size="sm"
              className={`${textClasses} hover:text-${isDarkMode ? 'white' : 'gray-900'} hover:bg-${isDarkMode ? 'slate-700' : 'gray-100'} transition-all duration-200`}
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
          <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Regulatory Compliance
          </h1>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${textClasses}`} />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search compliance documents... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className={`pl-10 pr-10 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                aria-label="Search compliance documents"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textClasses} hover:text-${isDarkMode ? 'white' : 'gray-900'}`}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown */}
              {showDropdown && (
                <div 
                  ref={dropdownRef}
                  className={`absolute top-full left-0 right-0 mt-1 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto`}
                >
                  <div className="p-2">
                    <div className={`text-xs font-medium ${textClasses} px-3 py-2 mb-1`}>
                      Popular Searches
                    </div>
                    {popularSearches.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handlePopularSearchClick(query)}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-${isDarkMode ? 'slate-600' : 'gray-100'} ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                      >
                        <Search className="w-3 h-3 inline mr-2 opacity-50" />
                        {query}
                      </button>
                    ))}
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
              className={`${textClasses} hover:text-${isDarkMode ? 'white' : 'gray-900'} hover:bg-${isDarkMode ? 'slate-700' : 'gray-100'}`}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          
          <Link to="/upload">
            <Button
              variant="outline"
              size="sm"
              className={`${isDarkMode 
                ? 'border-slate-600 text-slate-200 bg-slate-800/50 hover:bg-slate-700 hover:text-white hover:border-slate-400 shadow-sm' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 shadow-sm'
              } transition-all duration-200`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </Link>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${systemHealth ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
            <span className={`text-sm ${textClasses}`}>
              {systemHealth ? 'healthy' : 'issues'}
            </span>
          </div>
          
          {onToggleTheme && (
            <Button
              onClick={onToggleTheme}
              variant="ghost"
              size="sm"
              className={`${textClasses} hover:text-${isDarkMode ? 'white' : 'gray-900'} hover:bg-${isDarkMode ? 'slate-700' : 'gray-100'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
})

export default Header 
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'

const Header: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Regulatory Compliance Assistant
            </Link>
          </div>
          
          <nav className="flex space-x-4">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
              >
                Dashboard
              </Button>
            </Link>
            
            <Link to="/search">
              <Button
                variant={isActive('/search') ? 'default' : 'ghost'}
                size="sm"
              >
                Search
              </Button>
            </Link>
            
            <Link to="/upload">
              <Button
                variant={isActive('/upload') ? 'default' : 'ghost'}
                size="sm"
              >
                Upload
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header 
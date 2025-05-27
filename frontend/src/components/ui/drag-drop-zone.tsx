import React, { useState, useRef } from 'react'
import { Upload, FileText, FolderOpen, Archive, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DragDropZoneProps {
  onFilesSelected: (files: FileList) => void
  accept?: string
  multiple?: boolean
  className?: string
  isDarkMode?: boolean
  compact?: boolean
}

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesSelected,
  accept = '.pdf,.doc,.docx,.txt,.zip',
  multiple = true,
  className,
  isDarkMode = false,
  compact = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only set drag over to false if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFilesSelected(files)
    }
    // Reset the input value so the same file can be selected again
    e.target.value = ''
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFolderClick = () => {
    folderInputRef.current?.click()
  }

  const baseClasses = cn(
    'border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer relative overflow-hidden',
    isDragOver 
      ? 'border-slate-500 bg-slate-50 dark:bg-slate-800/50 scale-[1.02]' 
      : isDarkMode 
        ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50' 
        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
    compact ? 'p-4' : 'p-8',
    className
  )

  const textClasses = isDarkMode ? 'text-slate-300' : 'text-gray-600'
  const mutedTextClasses = isDarkMode ? 'text-slate-500' : 'text-gray-500'
  const accentTextClasses = isDarkMode ? 'text-slate-300' : 'text-gray-700'

  return (
    <div
      className={baseClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleFileClick}
    >
      {/* File input for regular files */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Folder input for directory uploads */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - webkitdirectory is not in the standard types but is supported
        webkitdirectory=""
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-slate-500/10 border-2 border-slate-500 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Upload className={`w-12 h-12 mx-auto mb-2 ${accentTextClasses}`} />
            <p className={`text-lg font-medium ${accentTextClasses}`}>
              Drop files here
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center text-center">
        {compact ? (
          <>
            <Upload className={`w-6 h-6 mb-2 ${textClasses}`} />
            <p className={`text-sm font-medium ${textClasses}`}>
              Upload Files
            </p>
          </>
        ) : (
          <>
            <div className="flex space-x-3 mb-6">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <FileText className={`w-6 h-6 ${textClasses}`} />
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <Archive className={`w-6 h-6 ${textClasses}`} />
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <FolderOpen className={`w-6 h-6 ${textClasses}`} />
              </div>
            </div>
            
            <p className={`text-xl font-medium mb-2 ${textClasses}`}>
              Drag & drop files or folders here
            </p>
            <p className={`text-sm ${mutedTextClasses} mb-4`}>
              Supports PDF, DOC, DOCX, TXT, ZIP files up to 50MB each
            </p>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileClick()
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Browse Files
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFolderClick()
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-2" />
                Browse Folder
              </button>
            </div>
            
            <p className={`text-xs mt-3 ${mutedTextClasses}`}>
              {multiple ? 'Multiple files and folders supported' : 'Single file only'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default DragDropZone 
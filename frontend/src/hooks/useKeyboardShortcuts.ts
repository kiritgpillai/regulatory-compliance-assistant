import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  callback: () => void
  description: string
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey
        const metaMatch = !!shortcut.metaKey === event.metaKey
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey
        const altMatch = !!shortcut.altKey === event.altKey

        return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

// Predefined shortcuts
export const createDefaultShortcuts = (callbacks: {
  focusSearch: () => void
  openUpload: () => void
  toggleSidebar: () => void
  toggleTheme: () => void
}) => [
  {
    key: 'k',
    metaKey: true,
    callback: callbacks.focusSearch,
    description: 'Focus search (⌘K)'
  },
  {
    key: 'u',
    ctrlKey: true,
    callback: callbacks.openUpload,
    description: 'Open upload (Ctrl+U)'
  },
  {
    key: 'b',
    ctrlKey: true,
    callback: callbacks.toggleSidebar,
    description: 'Toggle sidebar (Ctrl+B)'
  },
  {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.toggleTheme,
    description: 'Toggle theme (Ctrl+Shift+D)'
  }
] 
import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import NavigationContent from './NavigationContent'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export default function Sidebar({ isMobileOpen: controlledMobileOpen, onMobileOpenChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check localStorage for saved preference (desktop only)
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  const [internalMobileOpen, setInternalMobileOpen] = useState(false)
  
  // Use controlled state if provided, otherwise use internal state
  const isMobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen
  const setIsMobileOpen = onMobileOpenChange || setInternalMobileOpen

  // Close mobile sidebar when clicking outside or when screen size changes to desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (window.innerWidth < 768 && isMobileOpen && !target.closest('.sidebar-container')) {
        setIsMobileOpen(false)
      }
    }

    const handleResize = () => {
      // Close mobile sidebar when switching to desktop view
      if (window.innerWidth >= 768 && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobileOpen, setIsMobileOpen])

  const toggleCollapsed = () => {
    // On mobile, toggle open/closed instead of collapsed/expanded
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen)
    } else {
      // On desktop, toggle collapsed/expanded
      const newState = !isCollapsed
      setIsCollapsed(newState)
      localStorage.setItem('sidebarCollapsed', String(newState))
    }
  }

  const handleMobileClose = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile: Hidden by default, shown when isMobileOpen is true */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={handleMobileClose} />
        <div className={`sidebar-container fixed inset-y-0 left-0 w-64 flex flex-col bg-white transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="/images/logo.jpg" 
                    alt="Hockey-Assistant Logo" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Hockey-Assistant
                </span>
              </div>
            </div>
            
            <div className="mt-5 flex-grow flex flex-col">
              <NavigationContent isCollapsed={false} onNavigate={handleMobileClose} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Always visible, can be collapsed/expanded */}
      <div className={`hidden md:flex ${isCollapsed ? 'w-16' : 'w-64'} flex-col transition-all duration-300`}>
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200 relative">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src="/images/logo.jpg" 
                  alt="Hockey-Assistant Logo" 
                  className="w-8 h-8 rounded-lg object-cover"
                />
              </div>
              {!isCollapsed && (
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Hockey-Assistant
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <NavigationContent isCollapsed={isCollapsed} />
          </div>

          {/* Desktop toggle button for collapse/expand */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:block absolute bottom-4 right-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors z-10"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

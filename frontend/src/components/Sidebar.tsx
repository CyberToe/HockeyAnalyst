import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import NavigationContent from './NavigationContent'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} flex flex-col transition-all duration-300`}>
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

        {/* Toggle button - visible on mobile */}
        <button
          onClick={toggleCollapsed}
          className="md:hidden absolute bottom-4 right-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors z-10"
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
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import NavigationContent from './NavigationContent'

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/teams/') && path.includes('/games/')) return 'Game Tracking'
    if (path.includes('/teams/') && path.includes('/analytics')) return 'Team Analytics'
    if (path.includes('/teams/')) return 'Team Management'
    if (path.includes('/dashboard')) return 'Dashboard'
    if (path.includes('/analytics')) return 'Analytics'
    if (path.includes('/settings')) return 'Settings'
    return 'Hockey Analytics'
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* User info and signout */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="/images/logo.jpg" 
                    alt="Hockey Analytics Logo" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Hockey Analytics
                </span>
              </div>
              <button
                type="button"
                className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            {/* Mobile navigation content */}
            <div className="flex-1 overflow-y-auto py-4">
              <NavigationContent onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

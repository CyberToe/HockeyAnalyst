import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'

export default function Header() {
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
    if (path.includes('/profile')) return 'Profile Settings'
    if (path.includes('/analytics')) return 'Analytics'
    if (path.includes('/settings')) return 'Settings'
    return 'Hockey-Assistant'
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* User info and signout */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/profile')}
              className="text-right hover:bg-gray-50 rounded-md px-3 py-2 transition-colors duration-200"
              title="View profile"
            >
              <p className="text-sm font-medium text-gray-700">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </button>
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
    </div>
  )
}

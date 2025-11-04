import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [betaBannerClosed, setBetaBannerClosed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('betaBannerClosed') === 'true'
    }
    return false
  })

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const closeBetaBanner = () => {
    setBetaBannerClosed(true)
    localStorage.setItem('betaBannerClosed', 'true')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileOpenChange={setIsMobileSidebarOpen} />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Beta Banner */}
          {!betaBannerClosed && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 sm:px-6 lg:px-8 relative">
              <button
                onClick={closeBetaBanner}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 rounded-md text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 transition-colors"
                aria-label="Close banner"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <p className="text-sm text-yellow-800 text-center pr-8">
                Hockey-Assistant.com is currently in beta. Please feel free to use the application but we ask that you please let us know what you think and send comments you have by emailing{' '}
                <a href="mailto:suggestion@hockey-assistant.com" className="font-medium text-yellow-900 hover:text-yellow-950 underline">
                  suggestion@hockey-assistant.com
                </a>
              </p>
            </div>
          )}
          <Header onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

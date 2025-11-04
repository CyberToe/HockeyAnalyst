import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Beta Banner */}
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 sm:px-6 lg:px-8">
            <p className="text-sm text-yellow-800 text-center">
              Hockey-Assistant.com is currently in beta. Please feel free to use the application but we ask that you please let us know what you think and send comments you have by emailing{' '}
              <a href="mailto:suggestion@hockey-assistant.com" className="font-medium text-yellow-900 hover:text-yellow-950 underline">
                suggestion@hockey-assistant.com
              </a>
            </p>
          </div>
          <Header />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

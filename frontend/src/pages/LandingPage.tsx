import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'
import toast from 'react-hot-toast'

const DEMO_USER_ID = '6a3bea9a-047f-4fde-b1ee-e8df8db68f5d'

export default function LandingPage() {
  const navigate = useNavigate()
  const { demoLogin } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true)
      await demoLogin(DEMO_USER_ID)
      toast.success('Welcome to the demo!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Demo login error:', error)
      toast.error('Failed to start demo. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header with Login/Create Account */}
      <header className="w-full px-6 py-4 flex justify-end">
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="max-w-5xl w-full">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img 
                src="/images/logo.jpg" 
                alt="Hockey Assistant Logo" 
                className="h-12 w-12 rounded-lg object-cover shadow-lg"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
              Hockey Assistant
            </h1>
            <p className="text-base text-gray-600">
              Comprehensive hockey statistics tracking and analysis
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* Statistics Tracking */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="bg-primary-100 rounded-lg p-1.5 mr-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Create and manage comprehensive statistics for your team and players
              </p>
            </div>

            {/* Player Stats */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="bg-primary-100 rounded-lg p-1.5 mr-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Player Stats</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Track individual player performance and statistics throughout the season
              </p>
            </div>

            {/* Shot Tracking */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="bg-primary-100 rounded-lg p-1.5 mr-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Shot Tracking</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Track shots on goal, misses, and scored shots with visual rink positioning
              </p>
            </div>

            {/* Faceoffs */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="bg-primary-100 rounded-lg p-1.5 mr-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Faceoffs</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Record and analyze faceoff wins and losses for strategic insights
              </p>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="bg-primary-100 rounded-lg p-1.5 mr-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Track goals scored with detailed information about each scoring play
              </p>
            </div>

            {/* Assists */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="bg-primary-100 rounded-lg p-1.5 mr-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Assists</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Record assists and track player contributions to team scoring
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-6 flex gap-4 justify-center items-center">
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Try Demo'}
            </button>
            <Link
              to="/register"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-colors shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}


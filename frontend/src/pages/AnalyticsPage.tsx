import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../lib/api'

export default function AnalyticsPage() {
  const { teamId } = useParams<{ teamId: string }>()

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', teamId],
    queryFn: () => analyticsApi.getTeamAnalytics(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const analytics = analyticsData

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Analytics not found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load analytics data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Analytics</h1>
        <p className="mt-1 text-gray-600">
          Comprehensive analytics dashboard coming soon...
        </p>
        
        {/* Overview Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🏒</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Shots</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.overview.totalShots}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🥅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Goals</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.overview.totalGoals}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Shooting %</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.overview.shootingPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Goal Diff</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.overview.goalDifference > 0 ? '+' : ''}{analytics.overview.goalDifference}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats Preview */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Players</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600">Detailed player statistics will be displayed here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

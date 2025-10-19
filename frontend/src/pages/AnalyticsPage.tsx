import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gamesApi, analyticsApi } from '../lib/api'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CalendarDaysIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

type AnalysisType = 'players' | 'games'

export default function AnalyticsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [analysisType, setAnalysisType] = useState<AnalysisType>('players')
  const [selectedGameId, setSelectedGameId] = useState<string>('all')
  const [showGameDropdown, setShowGameDropdown] = useState(false)

  // Fetch games for the team
  const { data: gamesData } = useQuery({
    queryKey: ['games', teamId],
    queryFn: () => gamesApi.getGames(teamId!).then(res => res.data),
    enabled: !!teamId
  })


  // Fetch player analytics
  const { data: playerAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['playerAnalytics', teamId, selectedGameId],
    queryFn: () => analyticsApi.getPlayerAnalytics(teamId!, selectedGameId).then(res => res.data),
    enabled: !!teamId && analysisType === 'players'
  })

  const handleAnalysisTypeChange = (type: AnalysisType) => {
    setAnalysisType(type)
    if (type === 'games') {
      setShowGameDropdown(false)
    }
  }

  const handleGameSelection = (gameId: string) => {
    setSelectedGameId(gameId)
    setShowGameDropdown(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Analyze player and team performance across games
        </p>
      </div>

      {/* Analysis Type Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Analysis Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleAnalysisTypeChange('players')}
            className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
              analysisType === 'players'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Players Analysis</h3>
                <p className="text-sm text-gray-600">Analyze individual player statistics</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAnalysisTypeChange('games')}
            className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
              analysisType === 'games'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <CalendarDaysIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Games Analysis</h3>
                <p className="text-sm text-gray-600">Analyze team performance by game</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Players Analysis */}
      {analysisType === 'players' && (
        <div className="space-y-6">
          {/* Game Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Game</h3>
            <div className="relative">
              <button
                onClick={() => setShowGameDropdown(!showGameDropdown)}
                className="w-full md:w-64 flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <span className="block truncate">
                  {selectedGameId === 'all' 
                    ? 'All Games' 
                    : gamesData?.games?.find((game: any) => game.id === selectedGameId)?.opponent || 'Select a game'
                  }
                </span>
                {showGameDropdown ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {showGameDropdown && (
                <div className="absolute z-10 mt-1 w-full md:w-64 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  <button
                    onClick={() => handleGameSelection('all')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    All Games
                  </button>
                  {gamesData?.games?.map((game: any) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameSelection(game.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      {game.opponent || `Game ${new Date(game.createdAt).toLocaleDateString()}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Player Statistics Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
              <p className="text-sm text-gray-600">
                {selectedGameId === 'all' ? 'All games' : 'Selected game'}
              </p>
            </div>

            {analyticsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading player statistics...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shots
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Goals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assists
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faceoffs Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faceoffs Won
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faceoff %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {playerAnalytics?.players?.map((player: any) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {player.number || '#'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {player.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.stats?.shots || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.stats?.goals || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.stats?.assists || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.stats?.faceoffsTaken || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.stats?.faceoffsWon || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.stats?.faceoffsTaken > 0 
                            ? `${((player.stats.faceoffsWon / player.stats.faceoffsTaken) * 100).toFixed(1)}%`
                            : '0.0%'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Games Analysis */}
      {analysisType === 'games' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Games Analysis</h3>
            <p className="mt-1 text-sm text-gray-500">Under construction</p>
            <p className="mt-2 text-sm text-gray-600">
              This feature is coming soon. We're working on comprehensive game analysis tools.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
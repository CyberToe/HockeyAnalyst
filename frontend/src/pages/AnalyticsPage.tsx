import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gamesApi, analyticsApi } from '../lib/api'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CalendarDaysIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import ShotVisualization from '../components/ShotVisualization'
import { exportGameAnalysisToPDF } from '../utils/pdfExport'

type AnalysisType = 'players' | 'games'

export default function AnalyticsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [analysisType, setAnalysisType] = useState<AnalysisType>('players')
  const [selectedGameId, setSelectedGameId] = useState<string>('all')
  const [selectedGameAnalysisId, setSelectedGameAnalysisId] = useState<string>('')
  const [showGameDropdown, setShowGameDropdown] = useState(false)
  const [showGameAnalysisDropdown, setShowGameAnalysisDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Refs for shot visualizations
  const shotVizRefs = useRef<(HTMLDivElement | null)[]>([])

  // Fetch games for the team
  const { data: gamesData } = useQuery({
    queryKey: ['games', teamId],
    queryFn: () => gamesApi.getGames(teamId!).then(res => res.data),
    enabled: !!teamId
  })


  // Fetch player analytics
  const { data: playerAnalytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['playerAnalytics', teamId, selectedGameId],
    queryFn: () => analyticsApi.getPlayerAnalytics(teamId!, selectedGameId).then(res => res.data),
    enabled: !!teamId && analysisType === 'players'
  })

  // Fetch game analytics
  const { data: gameAnalytics, isLoading: gameAnalyticsLoading, error: gameAnalyticsError } = useQuery({
    queryKey: ['gameAnalytics', selectedGameAnalysisId],
    queryFn: () => analyticsApi.getGameAnalytics(selectedGameAnalysisId).then(res => res.data),
    enabled: !!selectedGameAnalysisId && analysisType === 'games'
  })

  // Debug logging
  console.log('Analytics Debug:', {
    teamId,
    selectedGameId,
    analysisType,
    playerAnalytics,
    analyticsLoading,
    analyticsError
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

  const handleGameAnalysisSelection = (gameId: string) => {
    setSelectedGameAnalysisId(gameId)
    setShowGameAnalysisDropdown(false)
  }

  const handlePDFExport = async () => {
    if (!gameAnalytics) return
    
    setIsExporting(true)
    try {
      // Get all shot visualization elements
      const shotElements = shotVizRefs.current.filter(Boolean) as HTMLElement[]
      
      await exportGameAnalysisToPDF(gameAnalytics, shotElements)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
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
            ) : analyticsError ? (
              <div className="p-6 text-center">
                <p className="text-red-600">Error loading player statistics</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analyticsError.message?.includes('404') 
                    ? 'Analytics API not available. Please ensure the backend is deployed with the latest code.'
                    : analyticsError.message
                  }
                </p>
              </div>
            ) : !playerAnalytics?.players || playerAnalytics.players.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No player data available</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedGameId === 'all' 
                    ? 'No players found for this team' 
                    : 'No players found for the selected game'
                  }
                </p>
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
        <div className="space-y-6">
          {/* Game Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Game</h3>
              {selectedGameAnalysisId && gameAnalytics && (
                <button
                  onClick={handlePDFExport}
                  disabled={isExporting}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowGameAnalysisDropdown(!showGameAnalysisDropdown)}
                className="w-full md:w-64 flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <span className="block truncate">
                  {selectedGameAnalysisId 
                    ? gamesData?.games?.find((game: any) => game.id === selectedGameAnalysisId)?.opponent || 'Select a game'
                    : 'Select a game'
                  }
                </span>
                {showGameAnalysisDropdown ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {showGameAnalysisDropdown && (
                <div className="absolute z-10 mt-1 w-full md:w-64 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {gamesData?.games?.map((game: any) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameAnalysisSelection(game.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      {game.opponent || `Game ${new Date(game.createdAt).toLocaleDateString()}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Game Analysis Content */}
          {selectedGameAnalysisId ? (
            <>
              {gameAnalyticsLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading game analysis...</p>
                  </div>
                </div>
              ) : gameAnalyticsError ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <p className="text-red-600">Error loading game analysis</p>
                    <p className="text-sm text-gray-500 mt-1">{gameAnalyticsError.message}</p>
                  </div>
                </div>
              ) : gameAnalytics ? (
                <div className="space-y-6">
                  {/* Shot Visualizations */}
                  <div className="space-y-6">
                    <div ref={(el) => shotVizRefs.current[0] = el}>
                      <ShotVisualization
                        shots={gameAnalytics.shotTimeline || []}
                        period={1}
                        title="Period 1"
                      />
                    </div>
                    <div ref={(el) => shotVizRefs.current[1] = el}>
                      <ShotVisualization
                        shots={gameAnalytics.shotTimeline || []}
                        period={2}
                        title="Period 2"
                      />
                    </div>
                    <div ref={(el) => shotVizRefs.current[2] = el}>
                      <ShotVisualization
                        shots={gameAnalytics.shotTimeline || []}
                        period={3}
                        title="Period 3"
                      />
                    </div>
                    <div ref={(el) => shotVizRefs.current[3] = el}>
                      <ShotVisualization
                        shots={gameAnalytics.shotTimeline || []}
                        period="all"
                        title="All Periods"
                      />
                    </div>
                  </div>

                  {/* Game Overview */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{gameAnalytics.overview?.teamShots || 0}</div>
                        <div className="text-sm text-gray-600">Team Shots</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{gameAnalytics.overview?.teamGoals || 0}</div>
                        <div className="text-sm text-gray-600">Team Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{gameAnalytics.overview?.opponentShots || 0}</div>
                        <div className="text-sm text-gray-600">Opponent Shots</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{gameAnalytics.overview?.opponentGoals || 0}</div>
                        <div className="text-sm text-gray-600">Opponent Goals</div>
                      </div>
                    </div>
                  </div>

                  {/* Player Statistics */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
                    </div>

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
                          {gameAnalytics.playerStats?.map((player: any) => (
                            <tr key={player.player.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-primary-600">
                                        {player.player.number || '#'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {player.player.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {player.statistics.shots}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {player.statistics.goals}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {player.statistics.assists || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {player.statistics.faceoffsTaken || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {player.statistics.faceoffsWon || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {player.statistics.faceoffsTaken > 0 
                                  ? `${((player.statistics.faceoffsWon / player.statistics.faceoffsTaken) * 100).toFixed(1)}%`
                                  : '0.0%'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Game Selected</h3>
                    <p className="mt-1 text-sm text-gray-500">Please select a game to view analysis</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Game Selected</h3>
                <p className="mt-1 text-sm text-gray-500">Please select a game to view analysis</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
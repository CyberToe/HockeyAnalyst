import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { gamesApi, playersApi, analyticsApi } from '../lib/api'
import { 
  ChartBarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import ShotVisualization from '../components/ShotVisualization'
import toast from 'react-hot-toast'

interface Game {
  id: string
  opponent?: string
  createdAt: string
}

interface Player {
  id: string
  name: string
  number?: number
}

export default function AnalyticsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  
  // State for selected games and players
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  
  // Track if we've initialized (to prevent re-initialization after user deselects all)
  const [hasInitializedGames, setHasInitializedGames] = useState(false)
  const [hasInitializedPlayers, setHasInitializedPlayers] = useState(false)
  
  // Refs for shot visualizations
  const shotVizRefs = useRef<(HTMLDivElement | null)[]>([])

  // Fetch games for the team
  const { data: gamesData } = useQuery({
    queryKey: ['games', teamId],
    queryFn: () => gamesApi.getGames(teamId!).then(res => res.data),
    enabled: !!teamId
  })

  // Fetch players for the team
  const { data: playersData } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => playersApi.getPlayers(teamId!).then(res => res.data),
    enabled: !!teamId
  })

  // Initialize selected games and players when data loads (only once)
  useEffect(() => {
    if (gamesData?.games && !hasInitializedGames) {
      setSelectedGames(new Set(gamesData.games.map((game: Game) => game.id)))
      setHasInitializedGames(true)
    }
  }, [gamesData, hasInitializedGames])

  useEffect(() => {
    if (playersData?.players && !hasInitializedPlayers) {
      setSelectedPlayers(new Set(playersData.players.map((player: Player) => player.id)))
      setHasInitializedPlayers(true)
    }
  }, [playersData, hasInitializedPlayers])

  // Fetch analytics for selected games and players
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', teamId, Array.from(selectedGames), Array.from(selectedPlayers)],
    queryFn: async () => {
      if (selectedGames.size === 0) return null;
      
      // Fetch game analytics for each selected game
      const gameAnalyticsPromises = Array.from(selectedGames).map(gameId => 
        analyticsApi.getGameAnalytics(gameId).then(res => res.data)
      );
      
      const gameAnalyticsResults = await Promise.all(gameAnalyticsPromises);
      
      // Combine the data from all games
      const combinedShotTimeline = gameAnalyticsResults.flatMap(result => result.shotTimeline || []);
      const combinedPeriodStats = gameAnalyticsResults.flatMap(result => result.periodStats || []);
      const combinedPlayerStats = gameAnalyticsResults.flatMap(result => result.playerStats || []);
      
      // Calculate combined overview
      const combinedOverview = gameAnalyticsResults.reduce((acc, result) => {
        const overview = result.overview || {};
        return {
          teamShots: (acc.teamShots || 0) + (overview.teamShots || 0),
          teamGoals: (acc.teamGoals || 0) + (overview.teamGoals || 0),
          opponentShots: (acc.opponentShots || 0) + (overview.opponentShots || 0),
          opponentGoals: (acc.opponentGoals || 0) + (overview.opponentGoals || 0)
        };
      }, {});
      
      // Aggregate player stats
      const playerStatsMap = new Map();
      combinedPlayerStats.forEach(playerStat => {
        const playerId = playerStat.player.id;
        if (playerStatsMap.has(playerId)) {
          const existing = playerStatsMap.get(playerId);
          existing.statistics.shots += playerStat.statistics.shots;
          existing.statistics.goals += playerStat.statistics.goals;
          existing.statistics.assists += playerStat.statistics.assists;
          existing.statistics.faceoffsTaken += playerStat.statistics.faceoffsTaken;
          existing.statistics.faceoffsWon += playerStat.statistics.faceoffsWon;
        } else {
          playerStatsMap.set(playerId, {
            ...playerStat,
            statistics: { ...playerStat.statistics }
          });
        }
      });
      
      return {
        shotTimeline: combinedShotTimeline,
        periodStats: combinedPeriodStats,
        playerStats: Array.from(playerStatsMap.values()),
        overview: combinedOverview,
        players: Array.from(playerStatsMap.values()).map(ps => ({
          id: ps.player.id,
          name: ps.player.name,
          number: ps.player.number,
          stats: ps.statistics
        }))
      };
    },
    enabled: !!teamId && selectedGames.size > 0 && selectedPlayers.size > 0
  })

  const handleGameToggle = (gameId: string) => {
    const newSelectedGames = new Set(selectedGames)
    if (newSelectedGames.has(gameId)) {
      newSelectedGames.delete(gameId)
    } else {
      newSelectedGames.add(gameId)
    }
    setSelectedGames(newSelectedGames)
  }

  const handlePlayerToggle = (playerId: string) => {
    const newSelectedPlayers = new Set(selectedPlayers)
    if (newSelectedPlayers.has(playerId)) {
      newSelectedPlayers.delete(playerId)
    } else {
      newSelectedPlayers.add(playerId)
    }
    setSelectedPlayers(newSelectedPlayers)
  }

  const handleDeselectAllGames = () => {
    setSelectedGames(new Set())
  }

  const handleDeselectAllPlayers = () => {
    setSelectedPlayers(new Set())
  }

  const handleSelectAllGames = () => {
    if (gamesData?.games) {
      setSelectedGames(new Set(gamesData.games.map((game: Game) => game.id)))
    }
  }

  const handleSelectAllPlayers = () => {
    if (playersData?.players) {
      setSelectedPlayers(new Set(playersData.players.map((player: Player) => player.id)))
    }
  }

  // Email report mutation
  const emailReportMutation = useMutation({
    mutationFn: (data: { gameIds: string[], playerIds: string[] }) => 
      analyticsApi.sendEmailReport(teamId!, data),
    onSuccess: (data) => {
      toast.success(data.data.message || 'Report sent successfully to your email!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send email report')
    }
  })

  const handleSendEmailReport = () => {
    if (selectedGames.size === 0 || selectedPlayers.size === 0) {
      toast.error('Please select at least one game and one player')
      return
    }
    emailReportMutation.mutate({
      gameIds: Array.from(selectedGames),
      playerIds: Array.from(selectedPlayers)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Analyze player and team performance across selected games and players
        </p>
      </div>

      {/* Game Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Games</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleSelectAllGames}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllGames}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Deselect All
            </button>
          </div>
        </div>
        
        {gamesData?.games && gamesData.games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gamesData.games.map((game: Game) => (
              <label key={game.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGames.has(game.id)}
                  onChange={() => handleGameToggle(game.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {game.opponent || `Game ${new Date(game.createdAt).toLocaleDateString()}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(game.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No games available</p>
        )}
      </div>

      {/* Player Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Players</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleSelectAllPlayers}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllPlayers}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Deselect All
            </button>
          </div>
        </div>
        
        {playersData?.players && playersData.players.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {playersData.players
              .sort((a: Player, b: Player) => (a.number || 999) - (b.number || 999))
              .map((player: Player) => (
              <label key={player.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPlayers.has(player.id)}
                  onChange={() => handlePlayerToggle(player.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {player.number ? `#${player.number} ` : ''}{player.name}
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No players available</p>
        )}
      </div>

      {/* Email Report Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={handleSendEmailReport}
          disabled={selectedGames.size === 0 || selectedPlayers.size === 0 || emailReportMutation.isPending}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <EnvelopeIcon className="h-5 w-5" />
          {emailReportMutation.isPending ? 'Sending...' : 'Email Report'}
        </button>
        <p className="mt-2 text-sm text-gray-600">
          Send an analytics report to your registered email address with all the data shown below
        </p>
      </div>

      {/* Analytics Content */}
      {selectedGames.size > 0 && selectedPlayers.size > 0 ? (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : analyticsError ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <p className="text-red-600">Error loading analytics</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analyticsError.message?.includes('404') 
                    ? 'Analytics API not available. Please ensure the backend is deployed with the latest code.'
                    : analyticsError.message
                  }
                </p>
              </div>
            </div>
          ) : analyticsData ? (
            <>
              {/* Debug logging */}
              {(() => {
                console.log('Analytics Data Debug:', {
                  analyticsData,
                  shotTimeline: analyticsData.shotTimeline,
                  periodStats: analyticsData.periodStats,
                  selectedGames: Array.from(selectedGames),
                  selectedPlayers: Array.from(selectedPlayers)
                });
                return null;
              })()}
              
              {/* Shot Visualizations for each period */}
              <div className="space-y-6">
                <div ref={(el) => shotVizRefs.current[0] = el}>
                  <ShotVisualization
                    shots={analyticsData.shotTimeline || []}
                    period={1}
                    title="Period 1"
                    periodAttackingDirection={analyticsData.periodStats?.find((p: any) => p.period.periodNumber === 1)?.period.attackingDirection}
                  />
                </div>
                <div ref={(el) => shotVizRefs.current[1] = el}>
                  <ShotVisualization
                    shots={analyticsData.shotTimeline || []}
                    period={2}
                    title="Period 2"
                    periodAttackingDirection={analyticsData.periodStats?.find((p: any) => p.period.periodNumber === 2)?.period.attackingDirection}
                  />
                </div>
                <div ref={(el) => shotVizRefs.current[2] = el}>
                  <ShotVisualization
                    shots={analyticsData.shotTimeline || []}
                    period={3}
                    title="Period 3"
                    periodAttackingDirection={analyticsData.periodStats?.find((p: any) => p.period.periodNumber === 3)?.period.attackingDirection}
                  />
                </div>
                <div ref={(el) => shotVizRefs.current[3] = el}>
                  <ShotVisualization
                    shots={analyticsData.shotTimeline || []}
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
                    <div className="text-2xl font-bold text-primary-600">{analyticsData.overview?.teamShots || 0}</div>
                    <div className="text-sm text-gray-600">Team Shots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.overview?.teamGoals || 0}</div>
                    <div className="text-sm text-gray-600">Team Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{analyticsData.overview?.opponentShots || 0}</div>
                    <div className="text-sm text-gray-600">Opponent Shots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analyticsData.overview?.opponentGoals || 0}</div>
                    <div className="text-sm text-gray-600">Opponent Goals</div>
                  </div>
                </div>
              </div>

              {/* Player Statistics */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
                  <p className="text-sm text-gray-600">
                    Statistics for selected players across selected games
                  </p>
                </div>

                {analyticsData.players && analyticsData.players.length > 0 ? (
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
                        {analyticsData.players
                          .filter((player: any) => selectedPlayers.has(player.id))
                          .sort((a: any, b: any) => (a.number || 999) - (b.number || 999))
                          .map((player: any) => (
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
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-600">No player data available for selected players</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <p className="text-gray-600">No analytics data available</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select Games and Players</h3>
            <p className="mt-1 text-sm text-gray-500">Please select at least one game and one player to view analytics</p>
          </div>
        </div>
      )}
    </div>
  )
}
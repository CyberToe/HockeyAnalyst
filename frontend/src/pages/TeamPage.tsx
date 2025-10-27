import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { teamsApi, playersApi, gamesApi } from '../lib/api'
import { PlusIcon, UserGroupIcon, CalendarIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import CreatePlayerModal from '../components/CreatePlayerModal'
import CreateGameModal from '../components/CreateGameModal'
import toast from 'react-hot-toast'

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false)
  const [showCreateGameModal, setShowCreateGameModal] = useState(false)

  const copyTeamCode = async (teamCode: string) => {
    try {
      await navigator.clipboard.writeText(teamCode)
      toast.success('Team code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy team code')
    }
  }

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => playersApi.getPlayers(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ['games', teamId],
    queryFn: () => gamesApi.getGames(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  const { refetch: refetchPlayers } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => playersApi.getPlayers(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  if (teamLoading || playersLoading || gamesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const team = teamData?.team
  const players = playersData?.players || []
  const games = gamesData?.games || []

  if (!team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        <p className="mt-1 text-sm text-gray-500">The team you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-gray-600">{team.description}</p>
            )}
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Team Code:</span>
                <div className="inline-flex items-center space-x-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {team.teamCode}
                  </span>
                  <button
                    onClick={() => copyTeamCode(team.teamCode)}
                    className="inline-flex items-center p-1 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    title="Copy team code"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <span>{team.members?.length || 0} members</span>
            </div>
          </div>
          <Link
            to={`/teams/${teamId}/analytics`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Players</dt>
                  <dd className="text-lg font-medium text-gray-900">{players.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Games</dt>
                  <dd className="text-lg font-medium text-gray-900">{games.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/images/logo.jpg" 
                  alt="Hockey Assistant Logo" 
                  className="h-8 w-8 rounded-lg object-cover"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Shots</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {games.reduce((total: number, game: any) => total + (game._count?.shots || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Players</h3>
              <button 
                onClick={() => setShowCreatePlayerModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Player
              </button>
            </div>
            
            {players.length === 0 ? (
              <p className="text-gray-500 text-sm">No players added yet.</p>
            ) : (
              <div className="space-y-2">
                {players.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center">
                      {player.number && (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 text-sm font-medium mr-3">
                          {player.number}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-900">{player.name}</span>
                    </div>
                    <button className="text-sm text-primary-600 hover:text-primary-900">
                      View Stats
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Games Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Games</h3>
              <button 
                onClick={() => setShowCreateGameModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                New Game
              </button>
            </div>
            
            {games.length === 0 ? (
              <p className="text-gray-500 text-sm">No games recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {games.slice(0, 5).map((game: any) => (
                  <div key={game.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        vs {game.opponent || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {game.startTime ? new Date(game.startTime).toLocaleDateString() : 'No date set'}
                      </p>
                    </div>
                    <Link
                      to={`/teams/${teamId}/games/${game.id}`}
                      className="text-sm text-primary-600 hover:text-primary-900"
                    >
                      Track Game
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Player Modal */}
      <CreatePlayerModal
        isOpen={showCreatePlayerModal}
        onClose={() => setShowCreatePlayerModal(false)}
        onSuccess={() => {
          setShowCreatePlayerModal(false)
          refetchPlayers()
        }}
        teamId={teamId!}
      />

      {/* Create Game Modal */}
      <CreateGameModal
        isOpen={showCreateGameModal}
        onClose={() => setShowCreateGameModal(false)}
        onSuccess={() => {
          setShowCreateGameModal(false)
          refetchGames()
        }}
        teamId={teamId!}
      />
    </div>
  )
}

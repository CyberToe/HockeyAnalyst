import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  PlusIcon, 
  UserGroupIcon, 
  UserPlusIcon,
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { teamsApi } from '../lib/api'
import CreateTeamModal from '../components/CreateTeamModal'
import JoinTeamModal from '../components/JoinTeamModal'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  const copyTeamCode = async (teamCode: string) => {
    try {
      await navigator.clipboard.writeText(teamCode)
      toast.success('Team code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy team code')
    }
  }

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await teamsApi.deleteTeam(teamId, true)
      toast.success('Team deleted successfully!')
      refetch()
    } catch (error) {
      // Error is handled by API interceptor
    }
  }

  const disableTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to disable "${teamName}"? Disabled teams will be moved to the disabled section.`)) {
      return
    }

    try {
      await teamsApi.updateTeam(teamId, { state: 'DISABLED' })
      toast.success('Team disabled successfully!')
      refetch()
    } catch (error) {
      // Error is handled by API interceptor
    }
  }

  const { data: teamsData, isLoading, refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getTeams().then(res => res.data),
  })

  const teams = teamsData?.teams || []
  const activeTeams = teams.filter((team: any) => team.state === 'ACTIVE')
  const disabledTeams = teams.filter((team: any) => team.state === 'DISABLED')

  const renderTeamTile = (team: any) => (
    <div key={team.id} className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {team.imageUrl ? (
              <img 
                src={team.imageUrl} 
                alt={`${team.name} team image`}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            )}
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {team.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  team.type === 'STANDARD_MONTHLY' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {team.type === 'STANDARD_MONTHLY' ? 'Premium' : 'Free'}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  team.state === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {team.state === 'ACTIVE' ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
            {team.description && (
              <p className="text-sm text-gray-500 mt-1">
                {team.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            {team.members?.length || 0} members
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            {team._count?.players || 0} players
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {team._count?.games || 0} games
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className="inline-flex items-center space-x-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Team Code: {team.teamCode}
              </span>
              <button
                onClick={() => copyTeamCode(team.teamCode)}
                className="inline-flex items-center p-1 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                title="Copy team code"
              >
                <ClipboardDocumentIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <Link
            to={`/teams/${team.id}/players`}
            className="flex-1 bg-primary-600 text-white text-center px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Players
          </Link>
          <Link
            to={`/teams/${team.id}/games`}
            className="flex-1 bg-primary-600 text-white text-center px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Games
          </Link>
          <Link
            to={`/teams/${team.id}/analytics`}
            className="flex-1 bg-primary-600 text-white text-center px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Analytics
          </Link>
          {team.state === 'ACTIVE' && (
            <button
              onClick={() => disableTeam(team.id, team.name)}
              className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              title="Disable team"
            >
              Disable
            </button>
          )}
          <button
            onClick={() => deleteTeam(team.id, team.name)}
            className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Delete team"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Your Teams
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your hockey teams and track game statistics
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Join Team
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new team or joining an existing one.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Team
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Teams */}
          {activeTeams.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Teams</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeTeams.map(renderTeamTile)}
              </div>
            </div>
          )}

          {/* Disabled Teams */}
          {disabledTeams.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Disabled Teams</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {disabledTeams.map(renderTeamTile)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          refetch()
        }}
      />
      
      <JoinTeamModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          setShowJoinModal(false)
          refetch()
        }}
      />
    </div>
  )
}

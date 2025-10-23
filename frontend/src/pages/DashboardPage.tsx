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
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { teamsApi } from '../lib/api'
import CreateTeamModal from '../components/CreateTeamModal'
import JoinTeamModal from '../components/JoinTeamModal'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [disabledTeamsCollapsed, setDisabledTeamsCollapsed] = useState(true)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [teamToDisable, setTeamToDisable] = useState<{id: string, name: string} | null>(null)

  const copyTeamCode = async (teamCode: string) => {
    try {
      await navigator.clipboard.writeText(teamCode)
      toast.success('Team code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy team code')
    }
  }


  const handleDisableClick = (teamId: string, teamName: string) => {
    setTeamToDisable({ id: teamId, name: teamName })
    setShowDisableConfirm(true)
  }

  const confirmDisableTeam = async () => {
    if (!teamToDisable) return

    try {
      await teamsApi.updateTeam(teamToDisable.id, { state: 'DISABLED' })
      toast.success('Team disabled successfully!')
      refetch()
      setShowDisableConfirm(false)
      setTeamToDisable(null)
    } catch (error) {
      // Error is handled by API interceptor
    }
  }

  const cancelDisableTeam = () => {
    setShowDisableConfirm(false)
    setTeamToDisable(null)
  }

  const updateTeamImage = async (teamId: string, imageFile: File) => {
    try {
      // Convert image file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string
        await teamsApi.updateTeam(teamId, { imageUrl })
        toast.success('Team image updated successfully!')
        refetch()
      }
      reader.readAsDataURL(imageFile)
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
  
  console.log('Disabled teams count:', disabledTeams.length)
  console.log('Disabled teams collapsed state:', disabledTeamsCollapsed)

  const renderTeamTile = (team: any) => (
    <div key={team.id} className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 relative">
            {team.imageUrl ? (
              <img 
                src={team.imageUrl} 
                alt={`${team.name} team image`}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  updateTeamImage(team.id, file)
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Click to update team image"
            />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {team.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  team.type === 'BASIC_FREE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {team.type === 'BASIC_FREE' ? 'Free' : 
                   team.type === 'STANDARD_MONTHLY' ? 'Standard Monthly' :
                   team.type === 'STANDARD_YEARLY' ? 'Standard Yearly' : 'Standard'}
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
            className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              team.state === 'DISABLED' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            onClick={team.state === 'DISABLED' ? (e) => e.preventDefault() : undefined}
          >
            Players
          </Link>
          <Link
            to={`/teams/${team.id}/games`}
            className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              team.state === 'DISABLED' 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            onClick={team.state === 'DISABLED' ? (e) => e.preventDefault() : undefined}
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
              onClick={() => handleDisableClick(team.id, team.name)}
              className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              title="Disable team"
            >
              Disable
            </button>
          )}
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
              <button
                onClick={() => {
                  console.log('Current collapsed state:', disabledTeamsCollapsed)
                  setDisabledTeamsCollapsed(!disabledTeamsCollapsed)
                }}
                className="flex items-center text-lg font-medium text-gray-900 mb-4 hover:text-gray-700 transition-colors duration-200"
              >
                <span className="mr-2">Disabled Teams ({disabledTeams.length})</span>
                {disabledTeamsCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              {disabledTeamsCollapsed === false && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {disabledTeams.map(renderTeamTile)}
                </div>
              )}
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

      {/* Disable Team Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={cancelDisableTeam}
            />
            
            {/* Modal content */}
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Disable Team
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to disable "{teamToDisable?.name}"? Disabled teams will be moved to the disabled section.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDisableTeam}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Disable Team
                </button>
                <button
                  type="button"
                  onClick={cancelDisableTeam}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

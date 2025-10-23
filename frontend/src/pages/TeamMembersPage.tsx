import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { teamsApi } from '../lib/api'
import { 
  ArrowLeftIcon, 
  UserGroupIcon, 
  UserIcon,
  CrownIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function TeamMembersPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const { data: teamData, isLoading: teamLoading, refetch } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  const promoteMemberMutation = useMutation({
    mutationFn: (userId: string) => teamsApi.promoteUser(teamId!, userId),
    onSuccess: () => {
      toast.success('Member promoted to manager successfully!')
      refetch()
      setShowPromoteConfirm(false)
      setSelectedMember(null)
    },
    onError: () => {
      toast.error('Failed to promote member')
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(teamId!, userId),
    onSuccess: () => {
      toast.success('Member removed successfully!')
      refetch()
      setShowRemoveConfirm(false)
      setSelectedMember(null)
    },
    onError: () => {
      toast.error('Failed to remove member')
    }
  })

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const team = teamData?.team
  const members = teamData?.members || []

  if (!team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        <p className="mt-1 text-sm text-gray-500">The team you're looking for doesn't exist.</p>
      </div>
    )
  }

  // Check if current user is a manager
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const currentUserMember = members.find((member: any) => member.user.id === currentUser.id)
  const isManager = currentUserMember?.role === 'admin'

  const handlePromoteClick = (member: any) => {
    setSelectedMember(member)
    setShowPromoteConfirm(true)
  }

  const handleRemoveClick = (member: any) => {
    setSelectedMember(member)
    setShowRemoveConfirm(true)
  }

  const confirmPromote = () => {
    if (selectedMember) {
      promoteMemberMutation.mutate(selectedMember.user.id)
    }
  }

  const confirmRemove = () => {
    if (selectedMember) {
      removeMemberMutation.mutate(selectedMember.user.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name} - Members</h1>
              <p className="mt-1 text-sm text-gray-500">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {isManager && (
            <button
              onClick={() => navigate(`/teams/${teamId}/invite`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {members.map((member: any) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {member.role === 'admin' ? (
                    <CrownIcon className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.displayName || member.user.email}
                    </p>
                    {member.role === 'admin' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Manager
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {isManager && member.role !== 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePromoteClick(member)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Promote to Manager
                  </button>
                  <button
                    onClick={() => handleRemoveClick(member)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Promote Confirmation Modal */}
      {showPromoteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPromoteConfirm(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CrownIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Promote to Manager
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to promote "{selectedMember?.user.displayName || selectedMember?.user.email}" to manager? 
                      They will have the same permissions as you.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmPromote}
                  disabled={promoteMemberMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {promoteMemberMutation.isPending ? 'Promoting...' : 'Promote to Manager'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromoteConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRemoveConfirm(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Remove Member
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to remove "{selectedMember?.user.displayName || selectedMember?.user.email}" from this team? 
                      They will lose access to all team data.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmRemove}
                  disabled={removeMemberMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {removeMemberMutation.isPending ? 'Removing...' : 'Remove Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
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

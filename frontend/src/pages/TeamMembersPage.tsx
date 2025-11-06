import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { teamsApi } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { 
  ArrowLeftIcon, 
  UserIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function TeamMembersPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false)
  const [showDemoteConfirm, setShowDemoteConfirm] = useState(false)
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

  const demoteMemberMutation = useMutation({
    mutationFn: (userId: string) => teamsApi.demoteUser(teamId!, userId),
    onSuccess: () => {
      toast.success('Manager demoted to member successfully!')
      refetch()
      setShowDemoteConfirm(false)
      setSelectedMember(null)
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to demote manager'
      toast.error(message)
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

  const updateReadOnlyMutation = useMutation({
    mutationFn: ({ userId, readOnly }: { userId: string; readOnly: boolean }) => 
      teamsApi.updateMemberReadOnly(teamId!, userId, readOnly),
    onSuccess: () => {
      toast.success('Member read-only status updated successfully!')
      refetch()
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update read-only status'
      toast.error(message)
    }
  })

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Try different possible data structures
  const team = teamData?.team || teamData
  const members = teamData?.members || teamData?.teamMembers || team?.members || []
  
  console.log('Full team data response:', teamData)
  console.log('Team object:', team)
  console.log('Members array:', members)
  console.log('Members length:', members.length)
  console.log('Team members property:', team?.members)

  if (!team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        <p className="mt-1 text-sm text-gray-500">The team you're looking for doesn't exist.</p>
      </div>
    )
  }

  // Check if current user is a manager
  const currentUserMember = members.find((member: any) => member.user.id === user?.id)
  const isManager = currentUserMember?.role === 'admin'

  const handlePromoteClick = (member: any) => {
    setSelectedMember(member)
    setShowPromoteConfirm(true)
  }

  const handleDemoteClick = (member: any) => {
    // Check if this is the last manager
    const managerCount = members.filter((m: any) => m.role === 'admin').length
    if (managerCount <= 1) {
      toast.error('Cannot demote the last manager of the team')
      return
    }
    setSelectedMember(member)
    setShowDemoteConfirm(true)
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

  const confirmDemote = () => {
    if (selectedMember) {
      demoteMemberMutation.mutate(selectedMember.user.id)
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
                    <div className="h-8 w-8 text-yellow-500 flex items-center justify-center">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
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
                    {member.readOnly && member.role !== 'admin' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Read Only
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {isManager && (
                <div className="flex space-x-2">
                  {member.role === 'admin' ? (
                    <button
                      onClick={() => handleDemoteClick(member)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      Demote to Member
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePromoteClick(member)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Promote to Manager
                      </button>
                      <button
                        onClick={() => updateReadOnlyMutation.mutate({ userId: member.user.id, readOnly: !member.readOnly })}
                        disabled={updateReadOnlyMutation.isPending}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {member.readOnly ? 'Enable Editing' : 'Set Read Only'}
                      </button>
                    </>
                  )}
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
                  <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
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

      {/* Demote Confirmation Modal */}
      {showDemoteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDemoteConfirm(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Demote Manager
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to demote "{selectedMember?.user.displayName || selectedMember?.user.email}" from manager to member? 
                      They will lose manager permissions.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDemote}
                  disabled={demoteMemberMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {demoteMemberMutation.isPending ? 'Demoting...' : 'Demote to Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoteConfirm(false)}
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

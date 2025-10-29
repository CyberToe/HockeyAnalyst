import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi, playersApi } from '../lib/api'
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Player {
  id: string
  name: string
  number?: number
  type: 'TEAM_PLAYER' | 'SUBSTITUTE'
}

export default function TeamPlayersPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const queryClient = useQueryClient()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null)

  // Fetch team data
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  // Fetch players data
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => playersApi.getPlayers(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  // Create player mutation
  const createPlayerMutation = useMutation({
    mutationFn: (data: { name: string; number?: number; type?: 'TEAM_PLAYER' | 'SUBSTITUTE' }) => 
      playersApi.createPlayer(teamId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] })
      // Also invalidate game players queries to update any open game pages
      queryClient.invalidateQueries({ queryKey: ['gamePlayers'] })
      setShowCreateModal(false)
      toast.success('Player created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create player')
    }
  })

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: { name: string; number?: number; type?: 'TEAM_PLAYER' | 'SUBSTITUTE' } }) => 
      playersApi.updatePlayer(playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] })
      setShowEditModal(false)
      setEditingPlayer(null)
      toast.success('Player updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update player')
    }
  })

  // Delete player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: (playerId: string) => playersApi.deletePlayer(playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] })
      setShowDeleteModal(false)
      setPlayerToDelete(null)
      toast.success('Player deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete player')
    }
  })

  const handleCreatePlayer = (data: { name: string; number?: number }) => {
    createPlayerMutation.mutate(data)
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setShowEditModal(true)
  }

  const handleUpdatePlayer = (data: { name: string; number?: number }) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ playerId: editingPlayer.id, data })
    }
  }

  const handleDeletePlayer = (playerId: string) => {
    setPlayerToDelete(playerId)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (playerToDelete) {
      deletePlayerMutation.mutate(playerToDelete)
    }
  }

  const cancelDelete = () => {
    setPlayerToDelete(null)
    setShowDeleteModal(false)
  }

  if (teamLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!teamData?.team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        <p className="text-gray-500">The team you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{teamData.team.name} - Players</h1>
          <p className="text-gray-600">Manage team players</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Player
        </button>
      </div>

      {/* Players List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {playersData?.players && playersData.players.length > 0 ? (
          <div>
            {/* Team Players Section */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Team Players</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {playersData.players
                .filter((player: Player) => player.type === 'TEAM_PLAYER')
                .map((player: Player) => (
                <li key={player.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {player.number || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                        {player.number && (
                          <div className="text-sm text-gray-500">#{player.number}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPlayer(player)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Substitutes Section */}
            {playersData.players.some((player: Player) => player.type === 'SUBSTITUTE') && (
              <>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Substitutes</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {playersData.players
                    .filter((player: Player) => player.type === 'SUBSTITUTE')
                    .map((player: Player) => (
                    <li key={player.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {player.number || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                            {player.number && (
                              <div className="text-sm text-gray-500">#{player.number}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No players</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new player.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Player
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Player Modal */}
      {showCreateModal && (
        <CreatePlayerModal
          onSubmit={handleCreatePlayer}
          onClose={() => setShowCreateModal(false)}
          isLoading={createPlayerMutation.isPending}
        />
      )}

      {/* Edit Player Modal */}
      {showEditModal && editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onSubmit={handleUpdatePlayer}
          onClose={() => {
            setShowEditModal(false)
            setEditingPlayer(null)
          }}
          isLoading={updatePlayerMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Player
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this player? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePlayerMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletePlayerMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Create Player Modal Component
function CreatePlayerModal({ onSubmit, onClose, isLoading }: {
  onSubmit: (data: { name: string; number?: number; type?: 'TEAM_PLAYER' | 'SUBSTITUTE' }) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({ name: '', number: '', type: 'TEAM_PLAYER' as 'TEAM_PLAYER' | 'SUBSTITUTE' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        number: formData.number ? parseInt(formData.number) : undefined,
        type: formData.type
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Player</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter player name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jersey Number (Optional)
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter jersey number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'TEAM_PLAYER' | 'SUBSTITUTE' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="TEAM_PLAYER">Team Player</option>
              <option value="SUBSTITUTE">Substitute</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Player Modal Component
function EditPlayerModal({ player, onSubmit, onClose, isLoading }: {
  player: Player
  onSubmit: (data: { name: string; number?: number; type?: 'TEAM_PLAYER' | 'SUBSTITUTE' }) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({ 
    name: player.name, 
    number: player.number?.toString() || '',
    type: player.type
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        number: formData.number ? parseInt(formData.number) : undefined,
        type: formData.type
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Player</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter player name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jersey Number (Optional)
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter jersey number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'TEAM_PLAYER' | 'SUBSTITUTE' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="TEAM_PLAYER">Team Player</option>
              <option value="SUBSTITUTE">Substitute</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

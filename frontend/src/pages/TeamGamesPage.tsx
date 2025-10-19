import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi, gamesApi } from '../lib/api'
import { PlusIcon, TrashIcon, PencilIcon, PlayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Game {
  id: string
  opponent?: string
  location?: string
  startTime?: string
  notes?: string
  createdAt: string
}

export default function TeamGamesPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)

  // Fetch team data
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  // Fetch games data
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', teamId],
    queryFn: () => gamesApi.getGames(teamId!).then(res => res.data),
    enabled: !!teamId,
  })

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: (data: { opponent?: string; location?: string; startTime?: string; notes?: string }) => 
      gamesApi.createGame(teamId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', teamId] })
      setShowCreateModal(false)
      toast.success('Game created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create game')
    }
  })

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: ({ gameId, data }: { gameId: string; data: { opponent?: string; location?: string; startTime?: string; notes?: string } }) => 
      gamesApi.updateGame(gameId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', teamId] })
      setShowEditModal(false)
      setEditingGame(null)
      toast.success('Game updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update game')
    }
  })

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: (gameId: string) => gamesApi.deleteGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', teamId] })
      setShowDeleteModal(false)
      setGameToDelete(null)
      toast.success('Game deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete game')
    }
  })

  const handleCreateGame = (data: { opponent?: string; location?: string; startTime?: string; notes?: string }) => {
    createGameMutation.mutate(data)
  }

  const handleEditGame = (game: Game) => {
    setEditingGame(game)
    setShowEditModal(true)
  }

  const handleUpdateGame = (data: { opponent?: string; location?: string; startTime?: string; notes?: string }) => {
    if (editingGame) {
      updateGameMutation.mutate({ gameId: editingGame.id, data })
    }
  }

  const handleDeleteGame = (gameId: string) => {
    setGameToDelete(gameId)
    setShowDeleteModal(true)
  }

  const handleEnterGame = (gameId: string) => {
    navigate(`/teams/${teamId}/games/${gameId}`)
  }

  const confirmDelete = () => {
    if (gameToDelete) {
      deleteGameMutation.mutate(gameToDelete)
    }
  }

  const cancelDelete = () => {
    setGameToDelete(null)
    setShowDeleteModal(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (teamLoading || gamesLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">{teamData.team.name} - Games</h1>
          <p className="text-gray-600">Manage team games and enter game statistics</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Game
        </button>
      </div>

      {/* Games List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {gamesData?.games && gamesData.games.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {gamesData.games.map((game: Game) => (
              <li key={game.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {game.opponent || 'Unnamed Game'}
                        </h3>
                        <div className="mt-1 text-sm text-gray-500">
                          {game.startTime && (
                            <p>Start: {formatDate(game.startTime)}</p>
                          )}
                          {game.location && (
                            <p>Location: {game.location}</p>
                          )}
                          {game.notes && (
                            <p className="mt-1">Notes: {game.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEnterGame(game.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Enter Game
                        </button>
                        <button
                          onClick={() => handleEditGame(game)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No games</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new game.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <CreateGameModal
          onSubmit={handleCreateGame}
          onClose={() => setShowCreateModal(false)}
          isLoading={createGameMutation.isPending}
        />
      )}

      {/* Edit Game Modal */}
      {showEditModal && editingGame && (
        <EditGameModal
          game={editingGame}
          onSubmit={handleUpdateGame}
          onClose={() => {
            setShowEditModal(false)
            setEditingGame(null)
          }}
          isLoading={updateGameMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Game
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this game? This action cannot be undone and will remove all associated data.
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
                disabled={deleteGameMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteGameMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Create Game Modal Component
function CreateGameModal({ onSubmit, onClose, isLoading }: {
  onSubmit: (data: { opponent?: string; location?: string; startTime?: string; notes?: string }) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({ 
    opponent: '', 
    location: '', 
    startTime: '', 
    notes: '' 
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      opponent: formData.opponent.trim() || undefined,
      location: formData.location.trim() || undefined,
      startTime: formData.startTime || undefined,
      notes: formData.notes.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Game</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opponent (Optional)
            </label>
            <input
              type="text"
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter opponent name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter game location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter any additional notes"
            />
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
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Game Modal Component
function EditGameModal({ game, onSubmit, onClose, isLoading }: {
  game: Game
  onSubmit: (data: { opponent?: string; location?: string; startTime?: string; notes?: string }) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({ 
    opponent: game.opponent || '', 
    location: game.location || '', 
    startTime: game.startTime ? new Date(game.startTime).toISOString().slice(0, 16) : '', 
    notes: game.notes || '' 
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      opponent: formData.opponent.trim() || undefined,
      location: formData.location.trim() || undefined,
      startTime: formData.startTime || undefined,
      notes: formData.notes.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Game</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opponent (Optional)
            </label>
            <input
              type="text"
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter opponent name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter game location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter any additional notes"
            />
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
              {isLoading ? 'Updating...' : 'Update Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

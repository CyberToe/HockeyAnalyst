import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { gamesApi, goalsApi, faceoffsApi, gamePlayersApi } from '../lib/api'
import ShotTracker from '../components/ShotTracker'
import toast from 'react-hot-toast'

interface Player {
  id: string
  name: string
  number?: number
  type: 'TEAM_PLAYER' | 'SUBSTITUTE'
}

interface GamePlayer {
  id: string
  gameId: string
  playerId: string
  included: boolean
  number?: number
  player: Player
}

export default function GamePage() {
  const { gameId } = useParams<{ teamId: string; gameId: string }>()
  const [selectedTracker, setSelectedTracker] = useState<string>('shot-tracker')
  const [lastShotPeriod, setLastShotPeriod] = useState<number | 'all'>(1)

  // Goals and Assists state
  const [selectedPlayerForGoal, setSelectedPlayerForGoal] = useState<Player | null>(null)
  const [scorer, setScorer] = useState<Player | null>(null)
  const [assister1, setAssister1] = useState<Player | null>(null)
  const [assister2, setAssister2] = useState<Player | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)
  
  // Faceoffs manual update state
  const [showManualUpdateModal, setShowManualUpdateModal] = useState(false)
  const [faceoffToUpdate, setFaceoffToUpdate] = useState<any>(null)
  const [manualTaken, setManualTaken] = useState(0)
  const [manualWon, setManualWon] = useState(0)


  const trackingOptions = [
    { value: 'shot-tracker', label: 'Shot Tracker' },
    { value: 'goals-assists', label: 'Goals & Assists' },
    { value: 'faceoffs', label: 'Faceoffs' },
    { value: 'players', label: 'Player Selection' }
  ]

  const handleTrackerChange = (value: string) => {
    setSelectedTracker(value)
  }

  // Goals and Assists functions
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayerForGoal(player)
  }

  const handleActionSelect = (action: 'scorer' | 'assister1' | 'assister2') => {
    if (!selectedPlayerForGoal) return

    if (action === 'scorer') {
      setScorer(selectedPlayerForGoal)
    } else if (action === 'assister1') {
      setAssister1(selectedPlayerForGoal)
    } else if (action === 'assister2') {
      setAssister2(selectedPlayerForGoal)
    }
    setSelectedPlayerForGoal(null)
  }

  const handleSubmitGoal = () => {
    if (!scorer) return

    const goalData = {
      scorerPlayerId: scorer.id,
      assister1PlayerId: assister1?.id,
      assister2PlayerId: assister2?.id,
      period: 1, // Default to period 1 for now
    }

    createGoalMutation.mutate(goalData)
    setScorer(null)
    setAssister1(null)
    setAssister2(null)
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId)
    setShowDeleteModal(true)
  }

  const confirmDeleteGoal = () => {
    if (goalToDelete) {
      deleteGoalMutation.mutate(goalToDelete)
      setGoalToDelete(null)
      setShowDeleteModal(false)
    }
  }

  const cancelDeleteGoal = () => {
    setGoalToDelete(null)
    setShowDeleteModal(false)
  }

  // Faceoffs manual update functions
  const handleManualUpdate = (faceoff: any) => {
    setFaceoffToUpdate(faceoff)
    setManualTaken(faceoff.taken)
    setManualWon(faceoff.won)
    setShowManualUpdateModal(true)
  }

  const handleManualUpdateSubmit = () => {
    if (faceoffToUpdate && manualWon <= manualTaken) {
      updateFaceoffMutation.mutate({
        faceoffId: faceoffToUpdate.id,
        taken: manualTaken,
        won: manualWon
      })
      setShowManualUpdateModal(false)
      setFaceoffToUpdate(null)
    } else if (manualWon > manualTaken) {
      toast.error('Won cannot exceed taken')
    }
  }

  const cancelManualUpdate = () => {
    setShowManualUpdateModal(false)
    setFaceoffToUpdate(null)
  }

  const { data: gameData, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gamesApi.getGame(gameId!).then(res => res.data),
    enabled: !!gameId,
  })

  // Fetch goals data
  const { data: goalsData, refetch: refetchGoals } = useQuery({
    queryKey: ['goals', gameId],
    queryFn: () => goalsApi.getGoals(gameId!).then(res => res.data),
    enabled: !!gameId,
  })

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (data: {
      scorerPlayerId: string;
      assister1PlayerId?: string;
      assister2PlayerId?: string;
      period: number;
    }) => goalsApi.createGoal(gameId!, data),
    onSuccess: () => {
      refetchGoals()
      toast.success('Goal recorded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record goal')
    }
  })

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => goalsApi.deleteGoal(goalId),
    onSuccess: () => {
      refetchGoals()
      toast.success('Goal removed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove goal')
    }
  })

  // Fetch faceoffs data
  const { data: faceoffsData, refetch: refetchFaceoffs } = useQuery({
    queryKey: ['faceoffs', gameId],
    queryFn: () => faceoffsApi.getFaceoffs(gameId!).then(res => res.data),
    enabled: !!gameId,
  })

  // Fetch game players data
  const { data: gamePlayersData, refetch: refetchGamePlayers } = useQuery({
    queryKey: ['gamePlayers', gameId],
    queryFn: () => gamePlayersApi.getGamePlayers(gameId!).then(res => res.data),
    enabled: !!gameId,
  })


  // Add player to faceoffs mutation
  const addPlayerToFaceoffsMutation = useMutation({
    mutationFn: (data: { playerId: string }) => faceoffsApi.addPlayer(gameId!, data),
    onSuccess: () => {
      refetchFaceoffs()
      toast.success('Player added to faceoffs tracking')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add player to faceoffs')
    }
  })

  // Increment faceoff mutation
  const incrementFaceoffMutation = useMutation({
    mutationFn: ({ faceoffId, won }: { faceoffId: string; won: boolean }) => 
      faceoffsApi.incrementFaceoff(faceoffId, { won }),
    onSuccess: () => {
      refetchFaceoffs()
      toast.success('Faceoff updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update faceoff')
    }
  })

  // Update faceoff mutation
  const updateFaceoffMutation = useMutation({
    mutationFn: ({ faceoffId, taken, won }: { faceoffId: string; taken: number; won: number }) => 
      faceoffsApi.updateFaceoff(faceoffId, { taken, won }),
    onSuccess: () => {
      refetchFaceoffs()
      toast.success('Faceoff updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update faceoff')
    }
  })

  // Delete faceoff mutation
  const deleteFaceoffMutation = useMutation({
    mutationFn: (faceoffId: string) => faceoffsApi.deleteFaceoff(faceoffId),
    onSuccess: () => {
      refetchFaceoffs()
      toast.success('Player removed from faceoffs tracking')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove player from faceoffs')
    }
  })

  // Game players mutations
  const updateGamePlayerMutation = useMutation({
    mutationFn: ({ gamePlayerId, data }: { gamePlayerId: string; data: { included?: boolean; number?: number } }) =>
      gamePlayersApi.updateGamePlayer(gamePlayerId, data),
    onSuccess: () => {
      refetchGamePlayers()
      toast.success('Player updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update player')
    }
  })


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const game = gameData?.game

  if (!game) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Game not found</h3>
        <p className="mt-1 text-sm text-gray-500">The game you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {game.opponent ? `vs ${game.opponent}` : 'Game'}
          </h1>
          
          {/* Tracking Options Buttons */}
          <div className="flex gap-3">
            {trackingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTrackerChange(option.value)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTracker === option.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {selectedTracker === 'shot-tracker' ? (
          <ShotTracker 
            lastSelectedPeriod={lastShotPeriod}
            onPeriodChange={setLastShotPeriod}
            gamePlayers={gamePlayersData?.gamePlayers}
          />
        ) : selectedTracker === 'goals-assists' ? (
          <div className="space-y-6">
            {/* Goals and Assists Section */}
            {gamePlayersData?.gamePlayers && gamePlayersData.gamePlayers.filter((gp: GamePlayer) => gp.included).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Goals and Assists</h3>
                
                {/* Player Selection */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Select Player</h4>
                  <div className="flex flex-wrap gap-1">
                    {gamePlayersData.gamePlayers
                      .filter((gp: GamePlayer) => gp.included)
                      .sort((a: GamePlayer, b: GamePlayer) => (a.number || 999) - (b.number || 999))
                      .map((gamePlayer: GamePlayer) => (
                      <button
                        key={gamePlayer.player.id}
                        onClick={() => handlePlayerSelect(gamePlayer.player)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selectedPlayerForGoal === gamePlayer.player
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {gamePlayer.number ? `#${gamePlayer.number} ` : ''}{gamePlayer.player.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Assign Actions</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleActionSelect('scorer')}
                      disabled={!selectedPlayerForGoal}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !selectedPlayerForGoal
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : scorer
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {scorer ? `Score: #${scorer.number} ${scorer.name}` : 'Score'}
                    </button>
                    <button
                      onClick={() => handleActionSelect('assister1')}
                      disabled={!selectedPlayerForGoal}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !selectedPlayerForGoal
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : assister1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {assister1 ? `Assist: #${assister1.number} ${assister1.name}` : 'Assist 1'}
                    </button>
                    <button
                      onClick={() => handleActionSelect('assister2')}
                      disabled={!selectedPlayerForGoal}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !selectedPlayerForGoal
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : assister2
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {assister2 ? `Assist: #${assister2.number} ${assister2.name}` : 'Assist 2'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mb-4">
                  <button
                    onClick={handleSubmitGoal}
                    disabled={!scorer || createGoalMutation.isPending}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      !scorer || createGoalMutation.isPending
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {createGoalMutation.isPending ? 'Submitting...' : 'Submit Goal'}
                  </button>
                </div>

                {/* Goals List */}
                {goalsData?.goals && goalsData.goals.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Recorded Goals</h4>
                    </div>
                    <div className="space-y-2">
                      {goalsData.goals.map((goal: any) => (
                        <div key={goal.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              Goal - Period {goal.period} ({new Date(goal.createdAt).toLocaleTimeString()})
                            </div>
                            <div className="text-xs text-gray-600">
                              Scorer: #{goal.scorer?.number} {goal.scorer?.name}
                              {goal.assister1 && ` | Assist 1: #${goal.assister1.number} ${goal.assister1.name}`}
                              {goal.assister2 && ` | Assist 2: #${goal.assister2.number} ${goal.assister2.name}`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            disabled={deleteGoalMutation.isPending}
                            className={`ml-2 text-sm transition-colors ${
                              deleteGoalMutation.isPending
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                          >
                            {deleteGoalMutation.isPending ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : selectedTracker === 'faceoffs' ? (
          <div className="space-y-6">
            {/* Faceoffs Section */}
            {gamePlayersData?.gamePlayers && gamePlayersData.gamePlayers.filter((gp: GamePlayer) => gp.included).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Faceoffs Tracking</h3>
                
                {/* Player Selection */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Add Player to Faceoffs Tracking</h4>
                  <div className="flex flex-wrap gap-1">
                    {gamePlayersData.gamePlayers
                      .filter((gamePlayer: GamePlayer) => 
                        gamePlayer.included && 
                        !faceoffsData?.faceoffs?.some((f: any) => f.playerId === gamePlayer.player.id)
                      )
                      .sort((a: GamePlayer, b: GamePlayer) => (a.number || 999) - (b.number || 999))
                      .map((gamePlayer: GamePlayer) => (
                        <button
                          key={gamePlayer.player.id}
                          onClick={() => addPlayerToFaceoffsMutation.mutate({ playerId: gamePlayer.player.id })}
                          disabled={addPlayerToFaceoffsMutation.isPending}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            addPlayerToFaceoffsMutation.isPending
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {gamePlayer.number ? `#${gamePlayer.number} ` : ''}{gamePlayer.player.name}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Faceoffs List */}
                {faceoffsData?.faceoffs && faceoffsData.faceoffs.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Faceoffs Tracking</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faceoffs Taken</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faceoffs Won</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {faceoffsData.faceoffs
                            .sort((a: any, b: any) => (a.player.number || 999) - (b.player.number || 999))
                            .map((faceoff: any) => (
                            <tr key={faceoff.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {faceoff.player.number ? `#${faceoff.player.number} ` : ''}{faceoff.player.name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">{faceoff.taken}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{faceoff.won}</td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => incrementFaceoffMutation.mutate({ faceoffId: faceoff.id, won: true })}
                                    disabled={incrementFaceoffMutation.isPending}
                                    className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium disabled:opacity-50"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() => incrementFaceoffMutation.mutate({ faceoffId: faceoff.id, won: false })}
                                    disabled={incrementFaceoffMutation.isPending}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                                  >
                                    -
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleManualUpdate(faceoff)}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                                  >
                                    Manual
                                  </button>
                                  <button
                                    onClick={() => deleteFaceoffMutation.mutate(faceoff.id)}
                                    disabled={deleteFaceoffMutation.isPending}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : selectedTracker === 'players' ? (
          <div className="space-y-6">
            {/* Player Selection Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Game Roster</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select which players are participating in this game and set their jersey numbers.
              </p>
              
              {gamePlayersData?.gamePlayers && gamePlayersData.gamePlayers.length > 0 ? (
                <div className="space-y-4">
                  {/* Team Players Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Team Players</h4>
                    <div className="space-y-2">
                      {gamePlayersData.gamePlayers
                        .filter((gp: GamePlayer) => gp.player.type === 'TEAM_PLAYER')
                        .map((gamePlayer: GamePlayer) => (
                        <div key={gamePlayer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={gamePlayer.included}
                              onChange={(e) => updateGamePlayerMutation.mutate({
                                gamePlayerId: gamePlayer.id,
                                data: { included: e.target.checked }
                              })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{gamePlayer.player.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500">Jersey #</label>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={gamePlayer.number || ''}
                              onChange={(e) => updateGamePlayerMutation.mutate({
                                gamePlayerId: gamePlayer.id,
                                data: { number: e.target.value ? parseInt(e.target.value) : undefined }
                              })}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="?"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Substitutes Section */}
                  {gamePlayersData.gamePlayers.some((gp: GamePlayer) => gp.player.type === 'SUBSTITUTE') && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Substitutes</h4>
                      <div className="space-y-2">
                        {gamePlayersData.gamePlayers
                          .filter((gp: GamePlayer) => gp.player.type === 'SUBSTITUTE')
                          .map((gamePlayer: GamePlayer) => (
                          <div key={gamePlayer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={gamePlayer.included}
                                onChange={(e) => updateGamePlayerMutation.mutate({
                                  gamePlayerId: gamePlayer.id,
                                  data: { included: e.target.checked }
                                })}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{gamePlayer.player.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="text-xs text-gray-500">Jersey #</label>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={gamePlayer.number || ''}
                                onChange={(e) => updateGamePlayerMutation.mutate({
                                  gamePlayerId: gamePlayer.id,
                                  data: { number: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="?"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No players found for this game.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Delete Goal Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteGoal}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGoal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Update Modal */}
      {showManualUpdateModal && faceoffToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manual Update - {faceoffToUpdate.player.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faceoffs Taken
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualTaken}
                  onChange={(e) => setManualTaken(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faceoffs Won
                </label>
                <input
                  type="number"
                  min="0"
                  max={manualTaken}
                  value={manualWon}
                  onChange={(e) => setManualWon(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {manualWon > manualTaken && (
                <p className="text-red-600 text-sm">Won cannot exceed taken</p>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={cancelManualUpdate}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualUpdateSubmit}
                disabled={updateFaceoffMutation.isPending || manualWon > manualTaken}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  updateFaceoffMutation.isPending || manualWon > manualTaken
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {updateFaceoffMutation.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

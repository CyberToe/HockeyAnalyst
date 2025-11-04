import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamesApi, shotsApi } from '../lib/api'
import toast from 'react-hot-toast'

interface Period {
  id: string
  periodNumber: number
  attackingDirection: 'left' | 'right' | null
}

interface Player {
  id: string
  name: string
  number?: number
  type: 'TEAM_PLAYER' | 'SUBSTITUTE'
}

interface Game {
  id: string
  periods: Period[]
  team: {
    id: string
    name: string
    players: Player[]
  }
}

interface ShotTrackerProps {
  lastSelectedPeriod?: number | 'all'
  onPeriodChange?: (period: number | 'all') => void
  gamePlayers?: Array<{
    id: string
    gameId: string
    playerId: string
    included: boolean
    number?: number
    player: {
      id: string
      name: string
      number?: number
      type: 'TEAM_PLAYER' | 'SUBSTITUTE'
    }
  }>
}

export default function ShotTracker({ lastSelectedPeriod = 1, onPeriodChange, gamePlayers }: ShotTrackerProps) {
  const { gameId } = useParams<{ gameId: string }>()
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // State for period selection (1, 2, 3, or 'all')
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(lastSelectedPeriod)
  
  // State for attacking direction
  const [attackingDirection, setAttackingDirection] = useState<'left' | 'right'>('right')
  
  // State for scoring mode
  const [scoringMode, setScoringMode] = useState<'SCORE' | 'MISS'>('MISS')
  
  // State for selected player - default to AGAINST
  const [selectedPlayer, setSelectedPlayer] = useState<Player | 'AGAINST' | null>('AGAINST')
  
  // State for shots
  const [shots, setShots] = useState<Array<{
    id: string
    xCoord: number
    yCoord: number
    rinkWidth?: number
    rinkHeight?: number
    scored: boolean
    scoredAgainst: boolean
    shooter?: Player | null
    period: Period
    takenAt: string
    attackingDirectionWhenShot: 'left' | 'right'
  }>>([])
  
  // State for tooltip
  const [tooltip, setTooltip] = useState<{
    show: boolean
    x: number
    y: number
    shot: typeof shots[0] | null
  }>({
    show: false,
    x: 0,
    y: 0,
    shot: null
  })

  // State for reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false)

  

  // Fetch game data with periods
  const { data: gameData, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gamesApi.getGame(gameId!).then(res => res.data),
    enabled: !!gameId,
  })

  // Fetch shots data
  const { data: shotsData, refetch: refetchShots } = useQuery({
    queryKey: ['shots', gameId],
    queryFn: () => shotsApi.getShots(gameId!).then(res => res.data),
    enabled: !!gameId,
  })


  // Update multiple periods mutation
  const updateMultiplePeriodsMutation = useMutation({
    mutationFn: (periods: Array<{ periodNumber: number; attackingDirection: 'left' | 'right' }>) =>
      gamesApi.updateMultiplePeriods(gameId!, periods),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      toast.success('Periods updated successfully')
    },
    onError: () => {
      toast.error('Failed to update periods')
    }
  })

  const game = gameData?.game as Game | undefined

  // Create periods mutation
  const createPeriodsMutation = useMutation({
    mutationFn: () => gamesApi.createPeriods(gameId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
    },
    onError: () => {
      toast.error('Failed to create periods')
    }
  })

  // Create shot mutation
  const createShotMutation = useMutation({
    mutationFn: (data: {
      periodId: string
      shooterPlayerId?: string
      xCoord: number
      yCoord: number
      scored: boolean
      scoredAgainst: boolean
    }) => shotsApi.createShot(gameId!, data),
    onSuccess: () => {
      refetchShots()
      toast.success('Shot recorded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record shot')
    }
  })

  // Delete shot mutation (for undo)
  const deleteShotMutation = useMutation({
    mutationFn: (shotId: string) => shotsApi.deleteShot(shotId),
    onSuccess: () => {
      refetchShots()
      toast.success('Shot removed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove shot')
    }
  })

  // Delete all shots mutation (for reset)
  const deleteAllShotsMutation = useMutation({
    mutationFn: (periodId?: string) => 
      periodId ? shotsApi.deleteAllShotsForPeriod(periodId) : shotsApi.deleteAllShotsForGame(gameId!),
    onSuccess: () => {
      refetchShots()
      toast.success('All shots cleared')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to clear shots')
    }
  })

  // Initialize periods if they don't exist
  useEffect(() => {
    if (game && game.periods.length === 0) {
      // Create periods with default attacking directions
      createPeriodsMutation.mutate()
    }
  }, [game])

  // Process shots data when it changes
  useEffect(() => {
    if (shotsData?.shots) {
      const processedShots = shotsData.shots.map((shot: any) => ({
        id: shot.id,
        xCoord: shot.xCoord,
        yCoord: shot.yCoord,
        rinkWidth: shot.rinkWidth,
        rinkHeight: shot.rinkHeight,
        scored: shot.scored,
        scoredAgainst: shot.scoredAgainst,
        shooter: shot.shooter,
        period: shot.period,
        takenAt: shot.takenAt,
        attackingDirectionWhenShot: shot.period.attackingDirection || 'right'
      }))
      setShots(processedShots)
    }
  }, [shotsData])

  // Debug game data (removed for production)
  // useEffect(() => {
  //   if (game) {
  //     console.log('Game data loaded:', {
  //       hasTeam: !!game.team,
  //       hasPlayers: !!game.team?.players,
  //       playerCount: game.team?.players?.length || 0,
  //       players: game.team?.players,
  //       teamId: game.team?.id,
  //       teamName: game.team?.name,
  //       fullGameData: game
  //     })
  //   }
  // }, [game])

  // Draw the hockey rink on canvas
  const drawRink = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Background (ice)
    ctx.fillStyle = '#e8f4f8'
    ctx.fillRect(0, 0, width, height)

    // Rink outline
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, width, height)

    // Center line (red)
    ctx.strokeStyle = '#c41e3a'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()

    // Blue lines
    ctx.strokeStyle = '#0033a0'
    ctx.lineWidth = 4
    
    // Left blue line
    ctx.beginPath()
    ctx.moveTo(width * 0.33, 0)
    ctx.lineTo(width * 0.33, height)
    ctx.stroke()
    
    // Right blue line
    ctx.beginPath()
    ctx.moveTo(width * 0.66, 0)
    ctx.lineTo(width * 0.66, height)
    ctx.stroke()

    // Face-off circles (radius 64, moved closer to creases horizontally)
    drawFaceoffCircle(ctx, width * 0.15, height * 0.25, 64)  // Top left - moved closer to left crease
    drawFaceoffCircle(ctx, width * 0.15, height * 0.75, 64)  // Bottom left - moved closer to left crease
    drawFaceoffCircle(ctx, width * 0.85, height * 0.25, 64)  // Top right - moved closer to right crease
    drawFaceoffCircle(ctx, width * 0.85, height * 0.75, 64)  // Bottom right - moved closer to right crease

    // Center face-off circle (match size with other circles)
    drawFaceoffCircle(ctx, width * 0.5, height * 0.5, 64)

    // Goal creases
    drawGoalCrease(ctx, width * 0.05, height * 0.5)
    drawGoalCrease(ctx, width * 0.95, height * 0.5)

    // Red lines behind goal creases
    drawRedLinesBehindCreases(ctx, width, height)

    // Draw shot markers
    drawShotMarkers(ctx, width)
  }

  // Draw face-off circle
  const drawFaceoffCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.strokeStyle = '#c41e3a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Center dot
    ctx.fillStyle = '#c41e3a'
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw goal crease
  const drawGoalCrease = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#0033a0'
    ctx.fillStyle = 'rgba(0, 51, 160, 0.1)'
    ctx.lineWidth = 2

    ctx.beginPath()
    if (x < canvasRef.current!.width / 2) {
      // Left goal
      ctx.arc(x, y, 30, -Math.PI / 2, Math.PI / 2)
    } else {
      // Right goal
      ctx.arc(x, y, 30, Math.PI / 2, -Math.PI / 2)
    }
    ctx.fill()
    ctx.stroke()
  }

  // Draw red lines behind goal creases
  const drawRedLinesBehindCreases = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#c41e3a'
    ctx.lineWidth = 3

    // Left goal red line (behind left crease) - extends to top and bottom boards
    ctx.beginPath()
    ctx.moveTo(width * 0.05, 0)  // Start at top board
    ctx.lineTo(width * 0.05, height)  // End at bottom board
    ctx.stroke()

    // Right goal red line (behind right crease) - extends to top and bottom boards
    ctx.beginPath()
    ctx.moveTo(width * 0.95, 0)  // Start at top board
    ctx.lineTo(width * 0.95, height)  // End at bottom board
    ctx.stroke()
  }

  // Draw shot markers
  const drawShotMarkers = (ctx: CanvasRenderingContext2D, width: number) => {
    const filteredShots = shots.filter(shot => {
      if (selectedPeriod === 'all') return true
      return shot.period.periodNumber === selectedPeriod
    })

    filteredShots.forEach(shot => {
      // For backwards compatibility: if rink dimensions are not saved, use coordinates as-is
      let x = shot.xCoord
      let y = shot.yCoord
      
      // Only scale if rink dimensions were saved
      if (shot.rinkWidth && shot.rinkHeight) {
        const scaleX = width / shot.rinkWidth
        const scaleY = canvasRef.current!.height / shot.rinkHeight
        x = shot.xCoord * scaleX
        y = shot.yCoord * scaleY
      }

      // If current attacking direction is different from when shot was taken, flip coordinates
      if (attackingDirection !== shot.attackingDirectionWhenShot) {
        x = width - x
      }

      // Determine marker style based on shot properties
      let fillColor, strokeColor, isFilled

      if (shot.scored && !shot.scoredAgainst) {
        // Score - For
        fillColor = '#38ef7d'
        strokeColor = '#11998e'
        isFilled = true
      } else if (shot.scored && shot.scoredAgainst) {
        // Score - Against
        fillColor = '#ff6a00'
        strokeColor = '#ee0979'
        isFilled = true
      } else if (!shot.scored && !shot.scoredAgainst) {
        // Miss - For
        fillColor = 'transparent'
        strokeColor = '#00f2fe'
        isFilled = false
      } else {
        // Miss - Against
        fillColor = 'transparent'
        strokeColor = '#fa709a'
        isFilled = false
      }

      // Draw marker
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      
      if (isFilled) {
        ctx.fillStyle = fillColor
        ctx.fill()
      }
      
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 3
      ctx.stroke()

      // Add glow effect for scores
      if (shot.scored) {
        ctx.shadowColor = strokeColor
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })
  }

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedPeriod === 'all') {
      toast.error('Please select a specific period (1, 2, or 3) to add shots')
      return
    }

    if (!selectedPlayer) {
      toast.error('Please select a player or AGAINST before adding shots')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY
    
    // Find the current period
    const currentPeriod = game?.periods.find(p => p.periodNumber === selectedPeriod)
    if (!currentPeriod) {
      toast.error('Period not found')
      return
    }

    // Create shot data
    const shotData = {
      periodId: currentPeriod.id,
      shooterPlayerId: selectedPlayer === 'AGAINST' ? undefined : selectedPlayer.id,
      xCoord: x,
      yCoord: y,
      rinkWidth: canvas.width,
      rinkHeight: canvas.height,
      scored: scoringMode === 'SCORE',
      scoredAgainst: selectedPlayer === 'AGAINST'
    }
    
    createShotMutation.mutate(shotData)
  }

  // Handle canvas mouse move for tooltip
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    // Check if mouse is over any shot marker
    const filteredShots = shots.filter(shot => {
      if (selectedPeriod === 'all') return true
      return shot.period.periodNumber === selectedPeriod
    })

    let foundShot = null
    for (const shot of filteredShots) {
      // For backwards compatibility: if rink dimensions are not saved, use coordinates as-is
      let shotX = shot.xCoord
      let shotY = shot.yCoord
      
      // Only scale if rink dimensions were saved
      if (shot.rinkWidth && shot.rinkHeight) {
        const scaleX = canvas.width / shot.rinkWidth
        const scaleY = canvas.height / shot.rinkHeight
        shotX = shot.xCoord * scaleX
        shotY = shot.yCoord * scaleY
      }
      
      // If current attacking direction is different from when shot was taken, flip coordinates
      if (attackingDirection !== shot.attackingDirectionWhenShot) {
        shotX = canvas.width - shotX
      }

      const distance = Math.sqrt((x - shotX) ** 2 + (y - shotY) ** 2)
      if (distance <= 12) {
        foundShot = shot
        break
      }
    }

    if (foundShot) {
      setTooltip({
        show: true,
        x: event.clientX,
        y: event.clientY,
        shot: foundShot
      })
    } else {
      setTooltip({
        show: false,
        x: 0,
        y: 0,
        shot: null
      })
    }
  }

  // Handle undo last shot
  const handleUndo = () => {
    const filteredShots = shots.filter(shot => {
      if (selectedPeriod === 'all') return true
      return shot.period.periodNumber === selectedPeriod
    })

    if (filteredShots.length === 0) {
      toast.error('No shots to undo')
      return
    }

    // Get the most recent shot
    const lastShot = filteredShots.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0]
    deleteShotMutation.mutate(lastShot.id)
  }

  // Handle reset shots
  const handleReset = () => {
    setShowResetModal(true)
  }

  // Confirm reset shots
  const confirmReset = () => {
    if (selectedPeriod === 'all') {
      deleteAllShotsMutation.mutate(undefined)
    } else {
      const currentPeriod = game?.periods.find(p => p.periodNumber === selectedPeriod)
      if (currentPeriod) {
        deleteAllShotsMutation.mutate(currentPeriod.id)
      }
    }
    setShowResetModal(false)
  }

  // Cancel reset
  const cancelReset = () => {
    setShowResetModal(false)
  }

  // Calculate stats for displayed shots
  const calculateStats = () => {
    const filteredShots = shots.filter(shot => {
      if (selectedPeriod === 'all') return true
      return shot.period.periodNumber === selectedPeriod
    })

    const forShots = filteredShots.filter(shot => !shot.scoredAgainst)
    const againstShots = filteredShots.filter(shot => shot.scoredAgainst)
    
    const forScores = forShots.filter(shot => shot.scored)
    const againstScores = againstShots.filter(shot => shot.scored)

    return {
      forShots: forShots.length,
      forScores: forScores.length,
      againstShots: againstShots.length,
      againstScores: againstScores.length
    }
  }

  const stats = calculateStats()

  // Draw rink when component mounts or shots change
  useEffect(() => {
    // Small delay to ensure canvas is rendered
    const timer = setTimeout(() => {
      drawRink()
    }, 10)
    return () => clearTimeout(timer)
  }, [game, shots, selectedPeriod, attackingDirection])

  // Sync selectedPeriod when lastSelectedPeriod changes (when switching back from other trackers)
  useEffect(() => {
    setSelectedPeriod(lastSelectedPeriod)
  }, [lastSelectedPeriod])

  // Update attacking direction based on selected period
  const updateAttackingDirection = (newDirection: 'left' | 'right') => {
    if (selectedPeriod === 'all') {
      // For "All" period, always set to attacking right
      setAttackingDirection('right')
      return
    }

    // Don't update if periods don't exist yet
    if (!game || game.periods.length === 0) {
      return
    }

    setAttackingDirection(newDirection)
    
    // Apply the attacking direction logic based on the selected period
    let periodsToUpdate: Array<{ periodNumber: number; attackingDirection: 'left' | 'right' }> = []
    
    if (selectedPeriod === 1) {
      // Period 1: Update period 2 to be opposite, period 3 to match
      periodsToUpdate = [
        { periodNumber: 1, attackingDirection: newDirection },
        { periodNumber: 2, attackingDirection: newDirection === 'right' ? 'left' : 'right' },
        { periodNumber: 3, attackingDirection: newDirection }
      ]
    } else if (selectedPeriod === 2) {
      // Period 2: Update periods 1 and 3 to be opposite
      periodsToUpdate = [
        { periodNumber: 2, attackingDirection: newDirection },
        { periodNumber: 1, attackingDirection: newDirection === 'right' ? 'left' : 'right' },
        { periodNumber: 3, attackingDirection: newDirection === 'right' ? 'left' : 'right' }
      ]
    } else if (selectedPeriod === 3) {
      // Period 3: Update period 1 to match, period 2 to be opposite
      periodsToUpdate = [
        { periodNumber: 3, attackingDirection: newDirection },
        { periodNumber: 1, attackingDirection: newDirection },
        { periodNumber: 2, attackingDirection: newDirection === 'right' ? 'left' : 'right' }
      ]
    }
    
    if (periodsToUpdate.length > 0) {
      updateMultiplePeriodsMutation.mutate(periodsToUpdate)
    }
  }

  // Get current attacking direction for selected period
  useEffect(() => {
    if (game && selectedPeriod !== 'all') {
      const period = game.periods.find(p => p.periodNumber === selectedPeriod)
      if (period?.attackingDirection) {
        setAttackingDirection(period.attackingDirection)
      }
    } else if (selectedPeriod === 'all') {
      setAttackingDirection('right')
    }
  }, [game, selectedPeriod])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Game not found</h3>
        <p className="mt-1 text-sm text-gray-500">The game you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className={`${
      scoringMode === 'MISS' && selectedPlayer === 'AGAINST' 
        ? 'bg-orange-50' 
        : scoringMode === 'SCORE' && selectedPlayer === 'AGAINST'
        ? 'bg-red-50'
        : scoringMode === 'SCORE' && selectedPlayer && selectedPlayer !== 'AGAINST'
        ? 'bg-green-50'
        : scoringMode === 'MISS' && selectedPlayer && selectedPlayer !== 'AGAINST'
        ? 'bg-blue-50'
        : 'bg-gray-50'
    }`}>
      <div className={`shadow rounded-lg p-6 ${
        scoringMode === 'MISS' && selectedPlayer === 'AGAINST' 
          ? 'bg-orange-100' 
          : scoringMode === 'SCORE' && selectedPlayer === 'AGAINST'
          ? 'bg-red-100'
          : scoringMode === 'SCORE' && selectedPlayer && selectedPlayer !== 'AGAINST'
          ? 'bg-green-100'
          : scoringMode === 'MISS' && selectedPlayer && selectedPlayer !== 'AGAINST'
          ? 'bg-blue-100'
          : 'bg-white'
      }`}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Shot Tracker</h2>
      

      {/* State Bar */}
      <div className={`rounded-lg p-4 mb-6 text-center ${
        scoringMode === 'MISS' && selectedPlayer === 'AGAINST' 
          ? 'bg-orange-100 border-2 border-orange-300' 
          : scoringMode === 'SCORE' && selectedPlayer === 'AGAINST'
          ? 'bg-red-100 border-2 border-red-300'
          : scoringMode === 'SCORE' && selectedPlayer && selectedPlayer !== 'AGAINST'
          ? 'bg-green-100 border-2 border-green-300'
          : scoringMode === 'MISS' && selectedPlayer && selectedPlayer !== 'AGAINST'
          ? 'bg-blue-100 border-2 border-blue-300'
          : 'bg-gray-100 border-2 border-gray-300'
      }`}>
        <div className="text-sm font-bold text-gray-800">
          <span className="font-bold">{scoringMode}</span> - <span className="font-bold">
            {selectedPlayer === 'AGAINST' ? 'AGAINST' : selectedPlayer ? selectedPlayer.name : 'No Player Selected'}
          </span>
        </div>
      </div>

      {/* Control Buttons Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Controls</h3>
        <div className="flex flex-wrap items-center gap-6">
          {/* Scoring Group */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Scoring</div>
            <div className="flex space-x-2">
              <button
                onClick={() => setScoringMode('SCORE')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scoringMode === 'SCORE'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SCORE
              </button>
              <button
                onClick={() => setScoringMode('MISS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scoringMode === 'MISS'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                MISS
              </button>
            </div>
          </div>

          {/* Period Selection Group */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Period</div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedPeriod(1)
                  onPeriodChange?.(1)
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Period 1
              </button>
              <button
                onClick={() => {
                  setSelectedPeriod(2)
                  onPeriodChange?.(2)
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 2
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Period 2
              </button>
              <button
                onClick={() => {
                  setSelectedPeriod(3)
                  onPeriodChange?.(3)
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 3
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Period 3
              </button>
              <button
                onClick={() => {
                  setSelectedPeriod('all')
                  onPeriodChange?.('all')
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Attacking Direction Group */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Attacking Direction</div>
            <button
              onClick={() => updateAttackingDirection(attackingDirection === 'right' ? 'left' : 'right')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                attackingDirection === 'right'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${(updateMultiplePeriodsMutation.isPending || createPeriodsMutation.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={updateMultiplePeriodsMutation.isPending || createPeriodsMutation.isPending}
            >
              {updateMultiplePeriodsMutation.isPending 
                ? 'Updating...' 
                : createPeriodsMutation.isPending
                ? 'Creating Periods...'
                : attackingDirection === 'right' ? 'Attacking Right' : 'Attacking Left'
              }
            </button>
          </div>

          {/* Shot Management Buttons */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Shot Management</div>
            <div className="flex space-x-2">
              <button
                onClick={handleUndo}
                disabled={deleteShotMutation.isPending || shots.length === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deleteShotMutation.isPending || shots.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {deleteShotMutation.isPending ? 'Removing...' : 'Undo Last Shot'}
              </button>
              <button
                onClick={handleReset}
                disabled={deleteAllShotsMutation.isPending || shots.length === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  deleteAllShotsMutation.isPending || shots.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {deleteAllShotsMutation.isPending 
                  ? 'Clearing...' 
                  : selectedPeriod === 'all' 
                    ? 'Reset All Shots' 
                    : `Reset Period ${selectedPeriod} Shots`
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Player Selection Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Player Selection</h3>
        <div className="flex flex-wrap gap-1">
          {/* Against Button */}
          <button
            onClick={() => setSelectedPlayer('AGAINST')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors border-2 ${
              selectedPlayer === 'AGAINST'
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
            }`}
          >
            AGAINST
          </button>
          
          {/* Game Players */}
          {gamePlayers && gamePlayers.length > 0 ? (
            gamePlayers
              .filter(gp => gp.included)
              .sort((a, b) => (a.number || 999) - (b.number || 999))
              .map((gamePlayer) => (
              <button
                key={gamePlayer.player.id}
                onClick={() => setSelectedPlayer(gamePlayer.player)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedPlayer === gamePlayer.player
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {gamePlayer.number ? `#${gamePlayer.number} ` : ''}{gamePlayer.player.name}
              </button>
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center py-2">
              <div>No players selected for this game</div>
              <div className="mt-1">
                <span className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
                  Go to Player Selection tab to add players
                </span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Hockey Rink */}
      <div className={`mb-6 rounded-lg p-4 ${
        scoringMode === 'MISS' && selectedPlayer === 'AGAINST' 
          ? 'bg-orange-100' 
          : scoringMode === 'SCORE' && selectedPlayer === 'AGAINST'
          ? 'bg-red-100'
          : scoringMode === 'SCORE' && selectedPlayer && selectedPlayer !== 'AGAINST'
          ? 'bg-green-100'
          : scoringMode === 'MISS' && selectedPlayer && selectedPlayer !== 'AGAINST'
          ? 'bg-blue-100'
          : 'bg-blue-100'
      }`}>
        
        {/* Desktop: Rink with stats on sides */}
        <div className="hidden md:flex items-center justify-center gap-4">
          {/* Left Stats - FOR */}
          <div className="flex flex-col items-center space-y-4 bg-green-50 rounded-lg p-4 min-w-[120px]">
            <div className="text-center">
              <div className="text-lg font-bold text-green-800">FOR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.forShots}</div>
              <div className="text-xs text-green-700">Shots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.forScores}</div>
              <div className="text-xs text-green-700">Scores</div>
            </div>
          </div>

          {/* Rink Canvas Container (desktop) */}
          <div className="relative bg-blue-100 rounded-lg p-4 flex-1 max-w-4xl">
            <div className="w-full" style={{ aspectRatio: '2 / 1' }}>
              <canvas 
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full h-full border-4 border-gray-800 rounded-lg cursor-crosshair"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
              />
            </div>
            
            {/* Rink Labels */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
              <div className="text-center">
                <div className="font-medium">
                  {attackingDirection === 'right' ? 'Home Goal' : 'Scoring Goal'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Neutral Zone</div>
              </div>
              <div className="text-center">
                <div className="font-medium">
                  {attackingDirection === 'right' ? 'Scoring Goal' : 'Home Goal'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Stats - AGAINST */}
          <div className="flex flex-col items-center space-y-4 bg-red-50 rounded-lg p-4 min-w-[120px]">
            <div className="text-center">
              <div className="text-lg font-bold text-red-800">AGAINST</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.againstShots}</div>
              <div className="text-xs text-red-700">Shots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.againstScores}</div>
              <div className="text-xs text-red-700">Scores</div>
            </div>
          </div>
        </div>

        {/* Mobile: Rink with stats below */}
        <div className="md:hidden">
          {/* Rink Canvas Container (mobile) */}
          <div className="flex justify-center">
            <div className="relative bg-blue-100 rounded-lg p-4 w-full">
              <div className="w-full" style={{ aspectRatio: '2 / 1' }}>
                <canvas 
                  ref={canvasRef}
                  width={800}
                  height={400}
                  className="w-full h-full border-4 border-gray-800 rounded-lg cursor-crosshair"
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                />
              </div>
              
              {/* Rink Labels */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                <div className="text-center">
                  <div className="font-medium">
                    {attackingDirection === 'right' ? 'Home Goal' : 'Scoring Goal'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Neutral Zone</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {attackingDirection === 'right' ? 'Scoring Goal' : 'Home Goal'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - FOR and AGAINST below rink */}
          <div className="flex justify-center gap-4 mt-2">
            {/* Stats - FOR */}
            <div className="flex items-center gap-4 bg-green-50 rounded-lg px-4 py-2">
              <div className="text-center">
                <div className="text-sm font-bold text-green-800">FOR</div>
              </div>
              <div className="text-center border-l border-green-300 pl-4">
                <div className="text-xl font-bold text-green-600">{stats.forShots}</div>
                <div className="text-xs text-green-700">Shots</div>
              </div>
              <div className="text-center border-l border-green-300 pl-4">
                <div className="text-xl font-bold text-green-600">{stats.forScores}</div>
                <div className="text-xs text-green-700">Scores</div>
              </div>
            </div>

            {/* Stats - AGAINST */}
            <div className="flex items-center gap-4 bg-red-50 rounded-lg px-4 py-2">
              <div className="text-center">
                <div className="text-sm font-bold text-red-800">AGAINST</div>
              </div>
              <div className="text-center border-l border-red-300 pl-4">
                <div className="text-xl font-bold text-red-600">{stats.againstShots}</div>
                <div className="text-xs text-red-700">Shots</div>
              </div>
              <div className="text-center border-l border-red-300 pl-4">
                <div className="text-xl font-bold text-red-600">{stats.againstScores}</div>
                <div className="text-xs text-red-700">Scores</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend - Centered below stats */}
        <div className="flex justify-center mt-4">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#38ef7d', border: '2px solid #11998e'}}></div>
              <span className="text-gray-600">Score - For</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'transparent', border: '2px solid #00f2fe'}}></div>
              <span className="text-gray-600">Miss - For</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ff6a00', border: '2px solid #ee0979'}}></div>
              <span className="text-gray-600">Score - Against</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'transparent', border: '2px solid #fa709a'}}></div>
              <span className="text-gray-600">Miss - Against</span>
            </div>
          </div>
        </div>
      </div>
      </div>


      {/* Tooltip */}
      {tooltip.show && tooltip.shot && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-semibold mb-1 flex items-center gap-2">
            {tooltip.shot.scored ? (
              <span className="text-green-400">✓</span>
            ) : (
              <span className="text-red-400">✗</span>
            )}
            {tooltip.shot.scored ? 'SCORE' : 'MISS'} - {tooltip.shot.scoredAgainst ? 'AGAINST' : 'FOR'}
          </div>
          {tooltip.shot.shooter && (
            <div className="mb-1">
              Player: {tooltip.shot.shooter.number ? `#${tooltip.shot.shooter.number} ` : ''}{tooltip.shot.shooter.name}
            </div>
          )}
          <div className="mb-1">
            Period: {tooltip.shot.period.periodNumber}
          </div>
          <div className="text-gray-300">
            {new Date(tooltip.shot.takenAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Reset
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all shots for{' '}
              {selectedPeriod === 'all' ? 'all periods' : `Period ${selectedPeriod}`}?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelReset}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={deleteAllShotsMutation.isPending}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  deleteAllShotsMutation.isPending
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {deleteAllShotsMutation.isPending ? 'Clearing...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

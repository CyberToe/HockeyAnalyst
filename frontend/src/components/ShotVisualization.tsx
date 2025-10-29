import { useRef, useEffect } from 'react'

interface Shot {
  id: string
  xCoord: number
  yCoord: number
  scored: boolean
  scoredAgainst: boolean
  shooter?: {
    id: string
    name: string
    number?: number
  }
  takenAt: string
  period: number
  attackingDirection?: 'left' | 'right' | null
}

interface ShotVisualizationProps {
  shots: Shot[]
  period: number | 'all'
  title: string
  periodAttackingDirection?: 'left' | 'right' | null
}

export default function ShotVisualization({ shots, period, title, periodAttackingDirection }: ShotVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Filter shots by period
  const filteredShots = period === 'all' 
    ? shots 
    : shots.filter(shot => shot.period === period)

  // Separate shots for and against
  const shotsFor = filteredShots.filter(shot => !shot.scoredAgainst)
  const shotsAgainst = filteredShots.filter(shot => shot.scoredAgainst)

  // Calculate statistics
  const shotsForCount = shotsFor.length
  const goalsForCount = shotsFor.filter(shot => shot.scored).length
  const shotsAgainstCount = shotsAgainst.length
  const goalsAgainstCount = shotsAgainst.filter(shot => shot.scored).length

  // Draw the hockey rink on canvas (same as ShotTracker)
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

    // Face-off circles (80% smaller, moved closer to creases horizontally)
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
    drawShotMarkers(ctx)
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

  // Draw shot markers (same logic as ShotTracker)
  const drawShotMarkers = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const width = canvas.width

    // Debug logging
    console.log(`Drawing shots for period ${period}:`, {
      period,
      periodAttackingDirection,
      totalShots: filteredShots.length,
      shots: filteredShots.map(shot => ({
        id: shot.id,
        xCoord: shot.xCoord,
        attackingDirection: shot.attackingDirection
      }))
    })

    filteredShots.forEach(shot => {
      let x = shot.xCoord
      let y = shot.yCoord

      // Mirror shots based on attacking direction
      // For each period rink, the attacking direction should be right
      // If the goal is saved as attacking left, flip the node, else just draw the node as saved
      if (period === 'all') {
        // For "All Periods", mirror shots that were taken when attacking direction was 'left'
        if (shot.attackingDirection === 'left') {
          console.log(`Mirroring shot ${shot.id} for all periods (left direction)`)
          x = width - x
        }
      } else {
        // For individual periods, mirror shots if the period's attacking direction was 'left'
        // This ensures all periods show attacking right (flip left-direction shots)
        if (periodAttackingDirection === 'left') {
          console.log(`Mirroring shot ${shot.id} for period ${period} (left direction)`)
          x = width - x
        }
      }

      // Determine marker style based on shot properties (same as ShotTracker)
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
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }


  // Draw rink when component mounts or shots change
  useEffect(() => {
    drawRink()
  }, [filteredShots])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          {shotsForCount} shots for, {goalsForCount} goals | {shotsAgainstCount} shots against, {goalsAgainstCount} goals
        </div>
      </div>

      <div className="relative">
        {/* Legend - Same as ShotTracker */}
        <div className="flex justify-center mb-4">
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

        {/* Canvas for rink */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="border border-gray-300 rounded-lg"
          />
        </div>

      </div>
    </div>
  )
}

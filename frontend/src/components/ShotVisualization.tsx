import { useState } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'

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
}

interface ShotVisualizationProps {
  shots: Shot[]
  period: number | 'all'
  title: string
}

export default function ShotVisualization({ shots, period, title }: ShotVisualizationProps) {
  const [hoveredShot, setHoveredShot] = useState<Shot | null>(null)

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

  // Convert coordinates to percentage for positioning on the rink
  const getPositionStyle = (xCoord: number, yCoord: number) => {
    // Assuming coordinates are normalized between 0-1
    // Adjust these values based on your actual coordinate system
    const x = xCoord * 100
    const y = yCoord * 100
    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          {shotsForCount} shots for, {goalsForCount} goals | {shotsAgainstCount} shots against, {goalsAgainstCount} goals
        </div>
      </div>

      <div className="relative">
        {/* Rink Background */}
        <div className="relative w-full h-96 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden">
          {/* Rink lines and markings would go here */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4/5 h-4/5 border-2 border-gray-400 rounded-lg bg-white">
              {/* Center line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-400"></div>
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              {/* Goal lines */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400"></div>
            </div>
          </div>

          {/* Shots For (Left side) */}
          <div className="absolute left-4 top-4 bottom-4 w-1/3">
            <div className="text-xs font-medium text-gray-700 mb-2">Shots For</div>
            <div className="text-xs text-gray-600">
              {shotsForCount} shots, {goalsForCount} goals
            </div>
          </div>

          {/* Shots Against (Right side) */}
          <div className="absolute right-4 top-4 bottom-4 w-1/3 text-right">
            <div className="text-xs font-medium text-gray-700 mb-2">Shots Against</div>
            <div className="text-xs text-gray-600">
              {shotsAgainstCount} shots, {goalsAgainstCount} goals
            </div>
          </div>

          {/* Shot markers */}
          {filteredShots.map((shot) => (
            <div
              key={shot.id}
              className="absolute cursor-pointer z-10"
              style={getPositionStyle(shot.xCoord, shot.yCoord)}
              onMouseEnter={() => setHoveredShot(shot)}
              onMouseLeave={() => setHoveredShot(null)}
            >
              <div
                className={`w-3 h-3 rounded-full border-2 ${
                  shot.scored
                    ? 'bg-green-500 border-green-700'
                    : shot.scoredAgainst
                    ? 'bg-red-500 border-red-700'
                    : 'bg-blue-500 border-blue-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Shot tooltip */}
        {hoveredShot && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm">
              <div className="font-medium">
                {hoveredShot.shooter ? `${hoveredShot.shooter.name} (${hoveredShot.shooter.number || 'N/A'})` : 'Unknown Player'}
              </div>
              <div className="text-gray-600">
                {hoveredShot.scored ? 'Goal' : 'Shot'} - Period {hoveredShot.period}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(hoveredShot.takenAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 border-2 border-green-700 rounded-full mr-2"></div>
            <span>Goal</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 border-2 border-blue-700 rounded-full mr-2"></div>
            <span>Shot</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 border-2 border-red-700 rounded-full mr-2"></div>
            <span>Goal Against</span>
          </div>
        </div>
      </div>
    </div>
  )
}

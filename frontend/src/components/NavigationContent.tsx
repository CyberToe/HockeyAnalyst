import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '../lib/api'
import { 
  HomeIcon, 
  UserGroupIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
]

interface NavigationContentProps {
  onNavigate?: () => void // Callback for mobile navigation
}

export default function NavigationContent({ onNavigate }: NavigationContentProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const location = useLocation()

  // Fetch user's teams
  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getTeams().then(res => res.data),
  })

  // Auto-expand team when navigating to team-specific pages
  useEffect(() => {
    const path = location.pathname
    const teamMatch = path.match(/^\/teams\/([^\/]+)/)
    if (teamMatch && teamsData?.teams) {
      const teamId = teamMatch[1]
      const teamExists = teamsData.teams.some((team: any) => team.id === teamId)
      if (teamExists && !expandedTeams.has(teamId)) {
        setExpandedTeams(prev => new Set([...prev, teamId]))
      }
    }
  }, [location.pathname, teamsData?.teams, expandedTeams])

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <nav className="flex-1 px-2 space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={handleNavClick}
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive
                ? 'bg-primary-100 text-primary-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.icon
            className="mr-3 flex-shrink-0 h-5 w-5"
            aria-hidden="true"
          />
          {item.name}
        </NavLink>
      ))}

      {/* Teams Section - Only show active teams */}
      {teamsData?.teams && teamsData.teams.filter((team: any) => team.state === 'ACTIVE').length > 0 && (
        <div className="mt-4">
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Teams
          </div>
          {teamsData.teams.filter((team: any) => team.state === 'ACTIVE').map((team: any) => (
            <div key={team.id} className="mt-1">
              <button
                onClick={() => toggleTeam(team.id)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex-shrink-0 h-5 w-5 flex items-center justify-center">
                    {team.imageUrl ? (
                      <img 
                        src={team.imageUrl} 
                        alt={`${team.name} team logo`}
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      <UserGroupIcon className="h-5 w-5" />
                    )}
                  </div>
                  {team.name}
                </div>
                {expandedTeams.has(team.id) ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
              
              {expandedTeams.has(team.id) && (
                <div className="ml-4 space-y-1">
                  <NavLink
                    to={`/teams/${team.id}/players`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <UserGroupIcon className="mr-3 flex-shrink-0 h-4 w-4" />
                    Players
                  </NavLink>
                  <NavLink
                    to={`/teams/${team.id}/games`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <CalendarDaysIcon className="mr-3 flex-shrink-0 h-4 w-4" />
                    Games
                  </NavLink>
                  <NavLink
                    to={`/teams/${team.id}/analytics`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <ChartBarIcon className="mr-3 flex-shrink-0 h-4 w-4" />
                    Analytics
                  </NavLink>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}

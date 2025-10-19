import { NavLink } from 'react-router-dom'
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
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
]

export default function Sidebar() {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

  // Fetch user's teams
  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getTeams().then(res => res.data),
  })

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏒</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              Hockey Analytics
            </span>
          </div>
        </div>
        
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
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

            {/* Teams Section */}
            {teamsData?.teams && teamsData.teams.length > 0 && (
              <div className="mt-4">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Teams
                </div>
                {teamsData.teams.map((team: any) => (
                  <div key={team.id} className="mt-1">
                    <button
                      onClick={() => toggleTeam(team.id)}
                      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <UserGroupIcon className="mr-3 flex-shrink-0 h-5 w-5" />
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
        </div>

      </div>
    </div>
  )
}

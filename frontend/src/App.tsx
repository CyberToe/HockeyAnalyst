import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TeamPage from './pages/TeamPage'
import TeamPlayersPage from './pages/TeamPlayersPage'
import TeamGamesPage from './pages/TeamGamesPage'
import TeamMembersPage from './pages/TeamMembersPage'
import GamePage from './pages/GamePage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="teams/:teamId" element={<TeamPage />} />
        <Route path="teams/:teamId/players" element={<TeamPlayersPage />} />
        <Route path="teams/:teamId/members" element={<TeamMembersPage />} />
        <Route path="teams/:teamId/games" element={<TeamGamesPage />} />
        <Route path="teams/:teamId/games/:gameId" element={<GamePage />} />
        <Route path="teams/:teamId/analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App

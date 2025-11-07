import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
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
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
      </Route>
      <Route path="/profile" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProfilePage />} />
      </Route>
      <Route path="/teams/:teamId" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<TeamPage />} />
        <Route path="players" element={<TeamPlayersPage />} />
        <Route path="members" element={<TeamMembersPage />} />
        <Route path="games" element={<TeamGamesPage />} />
        <Route path="games/:gameId" element={<GamePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

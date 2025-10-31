import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token && token !== 'undefined' && token !== 'null' && token !== '') {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Clear invalid token
      if (token === 'undefined' || token === 'null') {
        localStorage.removeItem('auth_token')
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    const message = error.response?.data?.error || 'An error occurred'
    toast.error(message)
    
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { displayName?: string; email?: string }) =>
    api.put('/auth/me', data),
}

// Teams API
export const teamsApi = {
  getTeams: () => api.get('/teams'),
  createTeam: (data: { name: string; description?: string; imageUrl?: string; type?: string; state?: string }) =>
    api.post('/teams', data),
  joinTeam: (data: { teamCode: string }) => api.post('/teams/join', data),
  getTeam: (teamId: string) => api.get(`/teams/${teamId}`),
  updateTeam: (teamId: string, data: { name?: string; description?: string; imageUrl?: string; type?: string; state?: string }) =>
    api.put(`/teams/${teamId}`, data),
  deleteTeam: (teamId: string, confirm?: boolean) =>
    api.delete(`/teams/${teamId}`, { data: { confirm } }),
  promoteUser: (teamId: string, userId: string) =>
    api.post(`/teams/${teamId}/promote`, { userId }),
  demoteUser: (teamId: string, userId: string) =>
    api.post(`/teams/${teamId}/demote`, { userId }),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
}

// Team Images API
export const teamImagesApi = {
  uploadImage: (teamId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/team-images/${teamId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadImageBase64: (teamId: string, imageData: string) =>
    api.post(`/team-images/${teamId}/upload-base64`, { imageData }),
  deleteImage: (teamId: string) => api.delete(`/team-images/${teamId}`),
}

// Players API
export const playersApi = {
  getPlayers: (teamId: string) => api.get(`/players/teams/${teamId}`),
  createPlayer: (teamId: string, data: { name: string; number?: number; type?: 'TEAM_PLAYER' | 'SUBSTITUTE' }) =>
    api.post(`/players/teams/${teamId}`, data),
  updatePlayer: (playerId: string, data: { name?: string; number?: number; type?: 'TEAM_PLAYER' | 'SUBSTITUTE' }) =>
    api.put(`/players/${playerId}`, data),
  deletePlayer: (playerId: string) => api.delete(`/players/${playerId}`),
  getPlayerStats: (playerId: string) => api.get(`/players/${playerId}/stats`),
}

// Games API
export const gamesApi = {
  getGames: (teamId: string) => api.get(`/games/teams/${teamId}`),
  createGame: (teamId: string, data: { opponent?: string; location?: string; startTime?: string; notes?: string }) =>
    api.post(`/games/teams/${teamId}`, data),
  getGame: (gameId: string) => api.get(`/games/${gameId}`),
  updateGame: (gameId: string, data: { opponent?: string; location?: string; startTime?: string; notes?: string }) =>
    api.put(`/games/${gameId}`, data),
  updatePeriod: (gameId: string, periodNumber: number, data: { attackingDirection?: 'left' | 'right'; startedAt?: string; endedAt?: string }) =>
    api.put(`/games/${gameId}/periods/${periodNumber}`, data),
  createPeriods: (gameId: string) => api.post(`/games/${gameId}/periods`),
  updateMultiplePeriods: (gameId: string, periods: Array<{ periodNumber: number; attackingDirection: 'left' | 'right' }>) =>
    api.put(`/games/${gameId}/periods`, { periods }),
  deleteGame: (gameId: string) => api.delete(`/games/${gameId}`),
}

// Shots API
export const shotsApi = {
  getShots: (gameId: string) => api.get(`/shots/games/${gameId}`),
  createShot: (gameId: string, data: {
    periodId: string;
    shooterPlayerId?: string;
    xCoord: number;
    yCoord: number;
    rinkWidth?: number;
    rinkHeight?: number;
    scored: boolean;
    scoredAgainst?: boolean;
    notes?: string;
  }) => api.post(`/shots/games/${gameId}`, data),
  updateShot: (shotId: string, data: {
    shooterPlayerId?: string;
    xCoord?: number;
    yCoord?: number;
    rinkWidth?: number;
    rinkHeight?: number;
    scored?: boolean;
    scoredAgainst?: boolean;
    notes?: string;
  }) => api.put(`/shots/${shotId}`, data),
  deleteShot: (shotId: string) => api.delete(`/shots/${shotId}`),
  deleteAllShotsForGame: (gameId: string) => api.delete(`/shots/games/${gameId}/all`),
  deleteAllShotsForPeriod: (periodId: string) => api.delete(`/shots/periods/${periodId}/all`),
  getShot: (shotId: string) => api.get(`/shots/${shotId}`),
}

// Goals API
export const goalsApi = {
  getGoals: (gameId: string) => api.get(`/goals/games/${gameId}`),
  createGoal: (gameId: string, data: {
    scorerPlayerId: string;
    assister1PlayerId?: string;
    assister2PlayerId?: string;
    period: number;
    notes?: string;
  }) => api.post(`/goals/games/${gameId}`, data),
  updateGoal: (goalId: string, data: {
    scorerPlayerId?: string;
    assister1PlayerId?: string;
    assister2PlayerId?: string;
    period?: number;
    notes?: string;
  }) => api.put(`/goals/${goalId}`, data),
  deleteGoal: (goalId: string) => api.delete(`/goals/${goalId}`),
  deleteAllGoalsForGame: (gameId: string) => api.delete(`/goals/games/${gameId}/all`),
  getGoal: (goalId: string) => api.get(`/goals/${goalId}`),
}

// Faceoffs API
export const faceoffsApi = {
  getFaceoffs: (gameId: string) => api.get(`/faceoffs/games/${gameId}`),
  addPlayer: (gameId: string, data: { playerId: string }) => api.post(`/faceoffs/games/${gameId}`, data),
  incrementFaceoff: (faceoffId: string, data: { won: boolean }) => api.post(`/faceoffs/${faceoffId}/increment`, data),
  updateFaceoff: (faceoffId: string, data: { taken?: number; won?: number }) => api.put(`/faceoffs/${faceoffId}`, data),
  deleteFaceoff: (faceoffId: string) => api.delete(`/faceoffs/${faceoffId}`),
  getFaceoff: (faceoffId: string) => api.get(`/faceoffs/${faceoffId}`),
}

// Analytics API
export const analyticsApi = {
  getTeamAnalytics: (teamId: string) => api.get(`/analytics/teams/${teamId}`),
  getPlayerAnalytics: (teamId: string, gameId?: string) => {
    const params = gameId && gameId !== 'all' ? { gameId } : {}
    return api.get(`/analytics/teams/${teamId}/players`, { params })
  },
  getGameAnalytics: (gameId: string) => api.get(`/analytics/games/${gameId}`),
}

// Game Players API
export const gamePlayersApi = {
  getGamePlayers: (gameId: string) => api.get(`/game-players/games/${gameId}`),
  initializeGamePlayers: (gameId: string) => api.post(`/game-players/games/${gameId}/initialize`),
  updateGamePlayer: (gamePlayerId: string, data: { included?: boolean; number?: number }) =>
    api.put(`/game-players/${gamePlayerId}`, data),
  bulkUpdateGamePlayers: (gameId: string, updates: Array<{ gamePlayerId: string; included?: boolean; number?: number }>) =>
    api.put(`/game-players/games/${gameId}/bulk`, { updates }),
}

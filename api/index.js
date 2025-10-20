// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Initialize Prisma with error handling
let prisma;
try {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    prisma = null;
  } else {
    prisma = new PrismaClient();
    console.log('Prisma client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Prisma:', error);
  prisma = null;
}

console.log('API starting...');
console.log('Environment variables:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV
});

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'https://hockey-analyst.vercel.app',
    'https://*.vercel.app',
    process.env.FRONTEND_URL || 'https://hockey-analyst.vercel.app'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if Prisma is available
    if (!prisma) {
      console.log('Prisma not available, using mock response');
      return res.json({
        data: {
          user: {
            id: '1',
            email: email,
            displayName: 'Test User'
          },
          token: 'test-token-' + Date.now()
        }
      });
    }

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email }
          });

          console.log('User found:', user ? 'Yes' : 'No');
          if (user) {
            console.log('User password field:', user.password ? 'Set' : 'Not set');
          }

          if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Check password
          if (!user.passwordHash) {
            console.log('User has no password set');
            return res.status(401).json({ error: 'Invalid credentials' });
          }
          
          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register attempt:', { email: req.body.email });
    
    // Check if Prisma is available
    if (!prisma) {
      console.log('Prisma not available, using mock response');
      return res.status(201).json({
        data: {
          user: {
            id: '1',
            email: req.body.email || 'test@example.com',
            displayName: req.body.displayName || 'Test User'
          },
          token: 'test-token-' + Date.now()
        }
      });
    }

    const { email, password, displayName } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        displayName
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    console.log('Auth check attempt');
    
    res.json({
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User'
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Teams routes
app.get('/api/teams', async (req, res) => {
  try {
    console.log('Teams request');
    
    // Check if Prisma is available
    if (!prisma) {
      console.log('Prisma not available, using mock teams');
      return res.json([
        {
          id: '1',
          name: 'Test Team 1',
          description: 'A test team',
          teamCode: 'TEST123',
          createdAt: new Date().toISOString(),
          _count: {
            players: 5,
            games: 3
          }
        }
      ]);
    }

    // Get teams from database for the authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    console.log('Looking for teams for user:', decoded.userId);
    
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: decoded.userId
          }
        }
      },
      include: {
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      }
    });

    console.log('Found teams:', teams.length);
    console.log('Teams data:', teams);
    res.json({ teams: teams });
  } catch (error) {
    console.error('Teams error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Simple debug endpoint to check token
app.get('/api/debug/token', async (req, res) => {
  try {
    console.log('Debug: Checking token...');
    console.log('Headers:', req.headers);
    console.log('Authorization header:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        headers: req.headers,
        authHeader: authHeader
      });
    }

    const token = authHeader.substring(7);
    console.log('Token received:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('Token decoded:', decoded);
    
    res.json({
      success: true,
      token: token,
      decoded: decoded,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token debug error:', error);
    res.status(401).json({ 
      error: 'Token validation failed',
      message: error.message
    });
  }
});

// Debug endpoint to check user and teams
app.get('/api/debug/user-teams', async (req, res) => {
  try {
    console.log('Debug: Checking user and teams...');
    
    if (!prisma) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    console.log('Debug: User ID from token:', decoded.userId);
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    console.log('Debug: User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Debug: User email:', user.email);
    }
    
    // Get all teams (for debugging)
    const allTeams = await prisma.team.findMany({
      include: {
        members: true,
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      }
    });
    
    console.log('Debug: Total teams in database:', allTeams.length);
    
    // Get user's teams
    const userTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: decoded.userId
          }
        }
      },
      include: {
        members: true,
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      }
    });
    
    console.log('Debug: User teams:', userTeams.length);
    
    res.json({
      user: user ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      } : null,
      totalTeams: allTeams.length,
      userTeams: userTeams.length,
      allTeams: allTeams.map(team => ({
        id: team.id,
        name: team.name,
        teamCode: team.teamCode,
        members: team.members.length,
        memberIds: team.members.map(m => m.userId)
      })),
      userTeamsData: userTeams
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Test user creation endpoint (for debugging)
app.post('/api/test/create-user', async (req, res) => {
  try {
    console.log('Creating test user...');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    if (!prisma) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { email, password, displayName } = req.body;
    
    console.log('Parsed fields:', { email, password: password ? 'Set' : 'Not set', displayName });
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ 
        error: 'Email, password, and display name are required',
        received: { email, password: password ? 'Set' : 'Not set', displayName }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        displayName
      }
    });

    console.log('Test user created:', user.id);
    res.status(201).json({
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create test user',
      message: error.message
    });
  }
});

// Team detail route
app.get('/api/teams/:teamId', async (req, res) => {
  try {
    console.log('Team detail request for:', req.params.teamId);
    
    if (!prisma) {
      console.log('Prisma not available, using mock team');
      return res.json({
        id: req.params.teamId,
        name: 'Test Team',
        description: 'A test team',
        teamCode: 'TEST123',
        createdAt: new Date().toISOString(),
        _count: {
          players: 5,
          games: 3
        }
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    console.log('Looking for team:', req.params.teamId, 'user:', decoded.userId);
    
    // Check if user is a member of this team
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: req.params.teamId,
        userId: decoded.userId
      }
    });

    if (!teamMembership) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const team = await prisma.team.findUnique({
      where: {
        id: req.params.teamId
      },
      include: {
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('Found team:', team.name);
    res.json({ team: team });
  } catch (error) {
    console.error('Team detail error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Games routes
app.get('/api/games/teams/:teamId', async (req, res) => {
  try {
    console.log('Games request for team:', req.params.teamId);
    console.log('Request headers:', req.headers);
    
    if (!prisma) {
      console.log('Prisma not available, using mock games');
      return res.json({
        games: [
          {
            id: '1',
            opponent: 'Test Team',
            location: 'Test Arena',
            startTime: new Date().toISOString(),
            teamId: req.params.teamId
          }
        ]
      });
    }

    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided, returning 401');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('Token received:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('Token decoded:', decoded);
    
    console.log('Looking for games for team:', req.params.teamId, 'user:', decoded.userId);
    
    // Check if user is a member of this team
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: req.params.teamId,
        userId: decoded.userId
      }
    });

    if (!teamMembership) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const games = await prisma.game.findMany({
      where: {
        teamId: req.params.teamId
      },
      orderBy: {
        startTime: 'desc'
      },
      include: {
        _count: {
          select: {
            goals: true,
            shots: true,
            faceoffs: true
          }
        }
      }
    });

    console.log('Found games:', games.length);
    console.log('Games data:', games);
    res.json({ games: games });
  } catch (error) {
    console.error('Games error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Analytics routes
app.get('/api/analytics/teams/:teamId/players', async (req, res) => {
  try {
    console.log('Player analytics request for team:', req.params.teamId);
    console.log('Request headers:', req.headers);
    
    if (!prisma) {
      console.log('Prisma not available, using mock analytics');
      return res.json({
        players: [
          {
            id: '1',
            name: 'Test Player 1',
            number: 7,
            goals: 5,
            assists: 3,
            shots: 12,
            faceoffs: 8,
            faceoffWins: 5
          }
        ]
      });
    }

    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided, returning 401');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('Token received:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('Token decoded:', decoded);
    
    console.log('Looking for player analytics for team:', req.params.teamId, 'user:', decoded.userId);
    
    // Check if user is a member of this team
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: req.params.teamId,
        userId: decoded.userId
      }
    });

    if (!teamMembership) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    // Get player analytics
    const players = await prisma.player.findMany({
      where: {
        teamId: req.params.teamId
      },
      include: {
        goalsScored: {
          select: {
            id: true
          }
        },
        goalsAssisted1: {
          select: {
            id: true
          }
        },
        goalsAssisted2: {
          select: {
            id: true
          }
        },
        shots: {
          select: {
            id: true,
            scored: true
          }
        },
        faceoffs: {
          select: {
            taken: true,
            won: true
          }
        }
      }
    });

    // Calculate analytics for each player
    const playerAnalytics = players.map(player => {
      const goals = player.goalsScored.length;
      const assists = player.goalsAssisted1.length + player.goalsAssisted2.length;
      const shots = player.shots.length;
      const shotsOnGoal = player.shots.filter(shot => shot.scored).length;
      const faceoffs = player.faceoffs.reduce((sum, faceoff) => sum + faceoff.taken, 0);
      const faceoffWins = player.faceoffs.reduce((sum, faceoff) => sum + faceoff.won, 0);

      return {
        id: player.id,
        name: player.name,
        number: player.number,
        goals,
        assists,
        points: goals + assists,
        shots,
        shotsOnGoal,
        shootingPercentage: shots > 0 ? (shotsOnGoal / shots * 100).toFixed(1) : 0,
        faceoffs,
        faceoffWins,
        faceoffPercentage: faceoffs > 0 ? (faceoffWins / faceoffs * 100).toFixed(1) : 0
      };
    });

    console.log('Found player analytics:', playerAnalytics.length);
    console.log('Player analytics data:', playerAnalytics);
    res.json({ players: playerAnalytics });
  } catch (error) {
    console.error('Player analytics error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Game analytics endpoint
app.get('/api/analytics/games/:gameId', async (req, res) => {
  try {
    console.log('Game analytics request for game:', req.params.gameId);
    console.log('Request headers:', req.headers);
    
    if (!prisma) {
      console.log('Prisma not available, using mock game analytics');
      return res.json({
        game: {
          id: req.params.gameId,
          opponent: 'Test Team',
          startTime: new Date().toISOString(),
          goals: 3,
          shots: 15,
          faceoffs: 12
        }
      });
    }

    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided, returning 401');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('Token received:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('Token decoded:', decoded);
    
    console.log('Looking for game analytics for game:', req.params.gameId, 'user:', decoded.userId);
    
    // Get game details
    const game = await prisma.game.findUnique({
      where: {
        id: req.params.gameId
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: decoded.userId
              }
            }
          }
        },
        goals: {
          include: {
            scorer: true,
            assister1: true,
            assister2: true
          }
        },
        shots: {
          include: {
            shooter: true
          }
        },
        faceoffs: {
          include: {
            player: true
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of this team
    if (game.team.members.length === 0) {
      return res.status(403).json({ error: 'Access denied to this game' });
    }

    // Calculate game analytics
    const totalGoals = game.goals.length;
    const totalShots = game.shots.length;
    const totalShotsOnGoal = game.shots.filter(shot => shot.scored).length;
    const totalFaceoffs = game.faceoffs.reduce((sum, faceoff) => sum + faceoff.taken, 0);
    const totalFaceoffWins = game.faceoffs.reduce((sum, faceoff) => sum + faceoff.won, 0);

    const gameAnalytics = {
      id: game.id,
      opponent: game.opponent,
      location: game.location,
      startTime: game.startTime,
      teamId: game.teamId,
      totalGoals,
      totalShots,
      totalShotsOnGoal,
      shootingPercentage: totalShots > 0 ? (totalShotsOnGoal / totalShots * 100).toFixed(1) : 0,
      totalFaceoffs,
      totalFaceoffWins,
      faceoffPercentage: totalFaceoffs > 0 ? (totalFaceoffWins / totalFaceoffs * 100).toFixed(1) : 0,
      goals: game.goals.map(goal => ({
        id: goal.id,
        period: goal.period,
        scorer: goal.scorer ? {
          id: goal.scorer.id,
          name: goal.scorer.name,
          number: goal.scorer.number
        } : null,
        assister1: goal.assister1 ? {
          id: goal.assister1.id,
          name: goal.assister1.name,
          number: goal.assister1.number
        } : null,
        assister2: goal.assister2 ? {
          id: goal.assister2.id,
          name: goal.assister2.name,
          number: goal.assister2.number
        } : null,
        notes: goal.notes
      })),
      shots: game.shots.map(shot => ({
        id: shot.id,
        xCoord: shot.xCoord,
        yCoord: shot.yCoord,
        scored: shot.scored,
        shooter: shot.shooter ? {
          id: shot.shooter.id,
          name: shot.shooter.name,
          number: shot.shooter.number
        } : null,
        notes: shot.notes
      })),
      faceoffs: game.faceoffs.map(faceoff => ({
        id: faceoff.id,
        player: {
          id: faceoff.player.id,
          name: faceoff.player.name,
          number: faceoff.player.number
        },
        taken: faceoff.taken,
        won: faceoff.won
      }))
    };

    console.log('Found game analytics for game:', game.id);
    console.log('Game analytics data:', gameAnalytics);
    res.json({ game: gameAnalytics });
  } catch (error) {
    console.error('Game analytics error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Individual game endpoint
app.get('/api/games/:gameId', async (req, res) => {
  try {
    console.log('Game request for game:', req.params.gameId);
    
    if (!prisma) {
      console.log('Prisma not available, using mock game');
      return res.json({
        id: req.params.gameId,
        opponent: 'Test Team',
        location: 'Test Arena',
        startTime: new Date().toISOString(),
        teamId: 'test-team-id'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const game = await prisma.game.findUnique({
      where: {
        id: req.params.gameId
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: decoded.userId
              }
            }
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of this team
    if (game.team.members.length === 0) {
      return res.status(403).json({ error: 'Access denied to this game' });
    }

    console.log('Found game:', game.id);
    res.json(game);
  } catch (error) {
    console.error('Game error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Goals for a game
app.get('/api/goals/games/:gameId', async (req, res) => {
  try {
    console.log('Goals request for game:', req.params.gameId);
    
    if (!prisma) {
      console.log('Prisma not available, using mock goals');
      return res.json([
        {
          id: '1',
          period: 1,
          scorer: { id: '1', name: 'Test Player', number: 7 },
          assister1: null,
          assister2: null,
          notes: 'Test goal'
        }
      ]);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const game = await prisma.game.findUnique({
      where: {
        id: req.params.gameId
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: decoded.userId
              }
            }
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of this team
    if (game.team.members.length === 0) {
      return res.status(403).json({ error: 'Access denied to this game' });
    }

    const goals = await prisma.goal.findMany({
      where: {
        gameId: req.params.gameId
      },
      include: {
        scorer: true,
        assister1: true,
        assister2: true
      },
      orderBy: {
        period: 'asc'
      }
    });

    console.log('Found goals:', goals.length);
    res.json(goals);
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Faceoffs for a game
app.get('/api/faceoffs/games/:gameId', async (req, res) => {
  try {
    console.log('Faceoffs request for game:', req.params.gameId);
    
    if (!prisma) {
      console.log('Prisma not available, using mock faceoffs');
      return res.json([
        {
          id: '1',
          player: { id: '1', name: 'Test Player', number: 7 },
          taken: 5,
          won: 3
        }
      ]);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const game = await prisma.game.findUnique({
      where: {
        id: req.params.gameId
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: decoded.userId
              }
            }
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of this team
    if (game.team.members.length === 0) {
      return res.status(403).json({ error: 'Access denied to this game' });
    }

    const faceoffs = await prisma.faceoff.findMany({
      where: {
        gameId: req.params.gameId
      },
      include: {
        player: true
      },
      orderBy: {
        player: {
          name: 'asc'
        }
      }
    });

    console.log('Found faceoffs:', faceoffs.length);
    res.json(faceoffs);
  } catch (error) {
    console.error('Faceoffs error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Players routes
app.get('/api/players/teams/:teamId', async (req, res) => {
  try {
    console.log('Players request for team:', req.params.teamId);
    console.log('Request headers:', req.headers);
    
    if (!prisma) {
      console.log('Prisma not available, using mock players');
      return res.json({
        players: [
          {
            id: '1',
            name: 'Test Player 1',
            number: 7,
            teamId: req.params.teamId
          },
          {
            id: '2', 
            name: 'Test Player 2',
            number: 12,
            teamId: req.params.teamId
          }
        ]
      });
    }

    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided, returning 401');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('Token received:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('Token decoded:', decoded);
    
    console.log('Looking for players for team:', req.params.teamId, 'user:', decoded.userId);
    
    // Check if user is a member of this team
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: req.params.teamId,
        userId: decoded.userId
      }
    });

    if (!teamMembership) {
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    const players = await prisma.player.findMany({
      where: {
        teamId: req.params.teamId
      },
      orderBy: {
        number: 'asc'
      }
    });

    console.log('Found players:', players.length);
    console.log('Players data:', players);
    res.json({ players: players });
  } catch (error) {
    console.error('Players error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Simple test endpoint for players
app.get('/api/test/players', (req, res) => {
  res.json({
    players: [
      { id: '1', name: 'Test Player 1', number: 7 },
      { id: '2', name: 'Test Player 2', number: 12 }
    ]
  });
});

// Test players endpoint without auth
app.get('/api/test/players/teams/:teamId', (req, res) => {
  console.log('Test players endpoint called for team:', req.params.teamId);
  res.json({
    players: [
      { id: '1', name: 'Test Player 1', number: 7, teamId: req.params.teamId },
      { id: '2', name: 'Test Player 2', number: 12, teamId: req.params.teamId }
    ]
  });
});

// Debug endpoint to see all requests
app.use('/api/debug/requests', (req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('===================');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
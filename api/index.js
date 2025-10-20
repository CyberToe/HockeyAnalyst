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

// Players routes
app.get('/api/players/teams/:teamId', async (req, res) => {
  try {
    console.log('Players request for team:', req.params.teamId);
    
    if (!prisma) {
      console.log('Prisma not available, using mock players');
      return res.json([
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
      ]);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
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
    res.json(players);
  } catch (error) {
    console.error('Players error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
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
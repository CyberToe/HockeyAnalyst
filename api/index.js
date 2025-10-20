// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');

const app = express();

// Simple test without database first
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
    
    // For now, return a simple success response
    res.json({
      data: {
        user: {
          id: '1',
          email: req.body.email || 'test@example.com',
          displayName: 'Test User'
        },
        token: 'test-token-' + Date.now()
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
    
    // For now, return a simple success response
    res.status(201).json({
      data: {
        user: {
          id: '1',
          email: req.body.email || 'test@example.com',
          displayName: req.body.displayName || 'Test User'
        },
        token: 'test-token-' + Date.now()
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
    
    res.json([
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
  } catch (error) {
    console.error('Teams error:', error);
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
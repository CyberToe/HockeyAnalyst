// Vercel serverless function that imports and uses the backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
  });
});

// Import and setup routes with error handling
try {
  // Import Prisma client first
  require('../backend/dist/lib/prisma');
  
  // Import routes
  const authRoutes = require('../backend/dist/routes/auth-simple');
  const teamRoutes = require('../backend/dist/routes/teams');
  const playerRoutes = require('../backend/dist/routes/players');
  const gameRoutes = require('../backend/dist/routes/games');
  const shotRoutes = require('../backend/dist/routes/shots');
  const goalRoutes = require('../backend/dist/routes/goals');
  const faceoffRoutes = require('../backend/dist/routes/faceoffs');
  const analyticsRoutes = require('../backend/dist/routes/analytics');

  // Import middleware
  const { authenticateToken } = require('../backend/dist/middleware/auth');
  const { errorHandler } = require('../backend/dist/middleware/errorHandler');

  // Routes - remove the /api prefix since Vercel already adds it
  app.use('/auth', authRoutes);
  app.use('/teams', authenticateToken, teamRoutes);
  app.use('/players', authenticateToken, playerRoutes);
  app.use('/games', authenticateToken, gameRoutes);
  app.use('/shots', authenticateToken, shotRoutes);
  app.use('/goals', authenticateToken, goalRoutes);
  app.use('/faceoffs', authenticateToken, faceoffRoutes);
  app.use('/analytics', authenticateToken, analyticsRoutes);

  // Error handling middleware
  app.use(errorHandler);

} catch (error) {
  console.error('Error setting up API routes:', error);
  
  // Fallback error handler
  app.use('*', (req, res) => {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app for Vercel
module.exports = app;
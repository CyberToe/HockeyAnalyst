// Vercel serverless function that imports and uses the backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Prisma client to ensure it's initialized
require('../backend/dist/lib/prisma');

// Import routes (these are CommonJS modules)
let authRoutes, teamRoutes, playerRoutes, gameRoutes, shotRoutes, goalRoutes, faceoffRoutes, analyticsRoutes;
let authenticateToken, errorHandler;

try {
  authRoutes = require('../backend/dist/routes/auth-simple');
  teamRoutes = require('../backend/dist/routes/teams');
  playerRoutes = require('../backend/dist/routes/players');
  gameRoutes = require('../backend/dist/routes/games');
  shotRoutes = require('../backend/dist/routes/shots');
  goalRoutes = require('../backend/dist/routes/goals');
  faceoffRoutes = require('../backend/dist/routes/faceoffs');
  analyticsRoutes = require('../backend/dist/routes/analytics');

  // Import middleware
  const authMiddleware = require('../backend/dist/middleware/auth');
  const errorMiddleware = require('../backend/dist/middleware/errorHandler');
  
  authenticateToken = authMiddleware.authenticateToken;
  errorHandler = errorMiddleware.errorHandler;
} catch (error) {
  console.error('Error importing backend modules:', error);
  throw error;
}

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app for Vercel
module.exports = app;
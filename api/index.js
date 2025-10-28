// Vercel serverless function entry point
console.log('=== VERCEL FUNCTION DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('Environment check:', process.env.NODE_ENV !== 'production' && !process.env.VERCEL);
console.log('=============================');

// Import the backend directly
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Prisma client
const { PrismaClient } = require('@prisma/client');

// Import routes from backend dist (included via includeFiles)
const authRoutes = require('../backend/dist/routes/auth-simple').default;
const teamRoutes = require('../backend/dist/routes/teams').default;
const teamImageRoutes = require('../backend/dist/routes/team-images').default;
const playerRoutes = require('../backend/dist/routes/players').default;
const gamePlayerRoutes = require('../backend/dist/routes/game-players').default;
const gameRoutes = require('../backend/dist/routes/games').default;
const shotRoutes = require('../backend/dist/routes/shots').default;
const goalRoutes = require('../backend/dist/routes/goals').default;
const faceoffRoutes = require('../backend/dist/routes/faceoffs').default;
const analyticsRoutes = require('../backend/dist/routes/analytics').default;

// Import middleware from backend dist
const { errorHandler } = require('../backend/dist/middleware/errorHandler');
const { authenticateToken } = require('../backend/dist/middleware/auth');

const app = express();
const prisma = new PrismaClient();

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

// Security middleware
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/team-images', authenticateToken, teamImageRoutes);
app.use('/api/players', authenticateToken, playerRoutes);
app.use('/api/game-players', authenticateToken, gamePlayerRoutes);
app.use('/api/games', authenticateToken, gameRoutes);
app.use('/api/shots', authenticateToken, shotRoutes);
app.use('/api/goals', authenticateToken, goalRoutes);
app.use('/api/faceoffs', authenticateToken, faceoffRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app for Vercel
module.exports = app;

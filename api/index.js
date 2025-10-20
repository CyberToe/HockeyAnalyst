// Vercel API entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Import routes from compiled backend
const authRoutes = require('./backend/dist/routes/auth-simple');
const teamRoutes = require('./backend/dist/routes/teams');
const playerRoutes = require('./backend/dist/routes/players');
const gameRoutes = require('./backend/dist/routes/games');
const shotRoutes = require('./backend/dist/routes/shots');
const goalRoutes = require('./backend/dist/routes/goals');
const faceoffRoutes = require('./backend/dist/routes/faceoffs');
const analyticsRoutes = require('./backend/dist/routes/analytics');

// Import middleware
const { errorHandler } = require('./backend/dist/middleware/errorHandler');
const { authenticateToken } = require('./backend/dist/middleware/auth');

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/players', authenticateToken, playerRoutes);
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

module.exports = app;

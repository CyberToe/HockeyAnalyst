import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth-simple';
import teamRoutes from './routes/teams';
import playerRoutes from './routes/players';
import gameRoutes from './routes/games';
import shotRoutes from './routes/shots';
import goalRoutes from './routes/goals';
import faceoffRoutes from './routes/faceoffs';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

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

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Hockey Analytics API ready`);
  
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

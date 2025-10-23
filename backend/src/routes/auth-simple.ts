import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/auth';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Environment check:', {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_TOKEN ? 'Set' : 'Not set'
    });
    const { email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true
      }
    });

    // Generate token
    const jwtSecret = process.env.JWT_TOKEN || 'hockey-analytics-super-secret-key-2025-production-change-this';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate token
    const jwtSecret = process.env.JWT_TOKEN || 'hockey-analytics-super-secret-key-2025-production-change-this';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

    return res.json({
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { displayName, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(email !== undefined && { email })
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    return res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

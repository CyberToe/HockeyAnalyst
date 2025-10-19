import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_TOKEN || 'hockey-analytics-super-secret-key-2025-production-change-this';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, displayName: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { teamId } = req.params;
  const userId = req.userId;

  if (!userId || !teamId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

export const requireTeamMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { teamId } = req.params;
  const userId = req.userId;

  if (!userId || !teamId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Team membership required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify team membership' });
  }
};

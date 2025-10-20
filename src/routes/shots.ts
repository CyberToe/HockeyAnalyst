import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, createShotSchema, updateShotSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get game shots
router.get('/games/:gameId', async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;

    // Get game and verify team membership
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { team: true }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const shots = await prisma.shot.findMany({
      where: { gameId },
      include: {
        shooter: true,
        period: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: { takenAt: 'asc' }
    });

    res.json({ shots });
  } catch (error) {
    next(error);
  }
});

// Record new shot
router.post('/games/:gameId', validateSchema(createShotSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;
    const { periodId, shooterPlayerId, xCoord, yCoord, scored, scoredAgainst, notes } = req.body;

    // Get game and verify team membership
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { team: true }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify period belongs to the game
    const period = await prisma.period.findUnique({
      where: { id: periodId }
    });

    if (!period || period.gameId !== gameId) {
      return res.status(400).json({ error: 'Invalid period for this game' });
    }

    // Verify shooter belongs to the team (if provided)
    if (shooterPlayerId) {
      const shooter = await prisma.player.findUnique({
        where: { id: shooterPlayerId }
      });

      if (!shooter || shooter.teamId !== game.teamId) {
        return res.status(400).json({ error: 'Invalid shooter for this team' });
      }
    }

    const shot = await prisma.shot.create({
      data: {
        gameId,
        periodId,
        shooterPlayerId,
        xCoord,
        yCoord,
        scored,
        scoredAgainst,
        notes,
        createdBy: req.userId!
      },
      include: {
        shooter: true,
        period: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Shot recorded successfully',
      shot
    });
  } catch (error) {
    next(error);
  }
});

// Update shot
router.put('/:shotId', validateSchema(updateShotSchema), async (req: AuthRequest, res, next) => {
  try {
    const { shotId } = req.params;
    const { shooterPlayerId, xCoord, yCoord, scored, scoredAgainst, notes } = req.body;

    // Get shot and verify team membership
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: shot.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify shooter belongs to the team (if being updated)
    if (shooterPlayerId) {
      const shooter = await prisma.player.findUnique({
        where: { id: shooterPlayerId }
      });

      if (!shooter || shooter.teamId !== shot.game.teamId) {
        return res.status(400).json({ error: 'Invalid shooter for this team' });
      }
    }

    const updatedShot = await prisma.shot.update({
      where: { id: shotId },
      data: {
        ...(shooterPlayerId !== undefined && { shooterPlayerId }),
        ...(xCoord !== undefined && { xCoord }),
        ...(yCoord !== undefined && { yCoord }),
        ...(scored !== undefined && { scored }),
        ...(scoredAgainst !== undefined && { scoredAgainst }),
        ...(notes !== undefined && { notes })
      },
      include: {
        shooter: true,
        period: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      message: 'Shot updated successfully',
      shot: updatedShot
    });
  } catch (error) {
    next(error);
  }
});

// Delete shot
router.delete('/:shotId', async (req: AuthRequest, res, next) => {
  try {
    const { shotId } = req.params;

    // Get shot and verify team membership
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: shot.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.shot.delete({
      where: { id: shotId }
    });

    res.json({ message: 'Shot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete all shots for a game (for reset functionality)
router.delete('/games/:gameId/all', async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;

    // Get game and verify team membership
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { team: true }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await prisma.shot.deleteMany({
      where: { gameId }
    });

    res.json({ 
      message: 'All shots deleted successfully',
      deletedCount: result.count
    });
  } catch (error) {
    next(error);
  }
});

// Delete all shots for a specific period
router.delete('/periods/:periodId/all', async (req: AuthRequest, res, next) => {
  try {
    const { periodId } = req.params;

    // Get period and verify team membership
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: period.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await prisma.shot.deleteMany({
      where: { periodId }
    });

    res.json({ 
      message: 'All shots for period deleted successfully',
      deletedCount: result.count
    });
  } catch (error) {
    next(error);
  }
});

// Get shot details
router.get('/:shotId', async (req: AuthRequest, res, next) => {
  try {
    const { shotId } = req.params;

    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        game: {
          include: { team: true }
        },
        shooter: true,
        period: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: shot.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ shot });
  } catch (error) {
    next(error);
  }
});

export default router;

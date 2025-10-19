import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, createGameSchema, updateGameSchema, updatePeriodSchema, updateMultiplePeriodsSchema } from '../utils/validation';
import { AuthRequest, requireTeamMember } from '../middleware/auth';

const router = express.Router();

// Get team games
router.get('/teams/:teamId', requireTeamMember, async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;

    const games = await prisma.game.findMany({
      where: { teamId },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' }
        },
        _count: {
          select: { shots: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ games });
  } catch (error) {
    next(error);
  }
});

// Create new game
router.post('/teams/:teamId', requireTeamMember, validateSchema(createGameSchema), async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const { opponent, location, startTime, notes } = req.body;

    const game = await prisma.game.create({
      data: {
        teamId,
        opponent,
        location,
        startTime: startTime ? new Date(startTime) : null,
        notes,
        createdBy: req.userId!,
        periods: {
          create: [
            { periodNumber: 1, attackingDirection: 'right' },
            { periodNumber: 2, attackingDirection: 'left' },
            { periodNumber: 3, attackingDirection: 'right' }
          ]
        }
      },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' }
        }
      }
    });

    res.status(201).json({
      message: 'Game created successfully',
      game
    });
  } catch (error) {
    next(error);
  }
});

// Get game details
router.get('/:gameId', async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        team: {
          include: {
            players: {
              orderBy: { name: 'asc' }
            }
          }
        },
        periods: {
          orderBy: { periodNumber: 'asc' }
        },
        shots: {
          include: {
            shooter: true,
            period: true
          },
          orderBy: { takenAt: 'asc' }
        },
        _count: {
          select: { shots: true }
        }
      }
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

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Update game
router.put('/:gameId', validateSchema(updateGameSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;
    const { opponent, location, startTime, notes } = req.body;

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

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        ...(opponent !== undefined && { opponent }),
        ...(location !== undefined && { location }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(notes !== undefined && { notes })
      },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' }
        }
      }
    });

    res.json({
      message: 'Game updated successfully',
      game: updatedGame
    });
  } catch (error) {
    next(error);
  }
});

// Update period (attacking direction, start/end times)
router.put('/:gameId/periods/:periodNumber', validateSchema(updatePeriodSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gameId, periodNumber } = req.params;
    const { attackingDirection, startedAt, endedAt } = req.body;

    const periodNum = parseInt(periodNumber);
    if (periodNum < 1 || periodNum > 3) {
      return res.status(400).json({ error: 'Period number must be between 1 and 3' });
    }

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

    // Find the period
    const period = await prisma.period.findUnique({
      where: {
        gameId_periodNumber: {
          gameId,
          periodNumber: periodNum
        }
      }
    });

    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }

    const updatedPeriod = await prisma.period.update({
      where: { id: period.id },
      data: {
        ...(attackingDirection && { attackingDirection }),
        ...(startedAt && { startedAt: new Date(startedAt) }),
        ...(endedAt && { endedAt: new Date(endedAt) })
      }
    });

    res.json({
      message: 'Period updated successfully',
      period: updatedPeriod
    });
  } catch (error) {
    next(error);
  }
});

// Create periods for existing games that don't have them
router.post('/:gameId/periods', async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;

    // Get game and verify team membership
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { team: true, periods: true }
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

    // Only create periods if they don't exist
    if (game.periods.length === 0) {
      const periods = await prisma.$transaction([
        prisma.period.create({
          data: { gameId, periodNumber: 1, attackingDirection: 'right' }
        }),
        prisma.period.create({
          data: { gameId, periodNumber: 2, attackingDirection: 'left' }
        }),
        prisma.period.create({
          data: { gameId, periodNumber: 3, attackingDirection: 'right' }
        })
      ]);

      res.json({
        message: 'Periods created successfully',
        periods
      });
    } else {
      res.json({
        message: 'Periods already exist',
        periods: game.periods
      });
    }
  } catch (error) {
    next(error);
  }
});

// Update multiple periods (for shot tracker logic)
router.put('/:gameId/periods', validateSchema(updateMultiplePeriodsSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;
    const { periods } = req.body;

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

    // Update all periods in a transaction
    const updatedPeriods = await prisma.$transaction(
      periods.map((period: { periodNumber: number; attackingDirection: 'left' | 'right' }) =>
        prisma.period.update({
          where: {
            gameId_periodNumber: {
              gameId,
              periodNumber: period.periodNumber
            }
          },
          data: {
            attackingDirection: period.attackingDirection
          }
        })
      )
    );

    res.json({
      message: 'Periods updated successfully',
      periods: updatedPeriods
    });
  } catch (error) {
    next(error);
  }
});

// Delete game
router.delete('/:gameId', async (req: AuthRequest, res, next) => {
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

    // Check if game has any shots recorded
    const shotCount = await prisma.shot.count({
      where: { gameId }
    });

    if (shotCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete game with recorded shots. Consider archiving instead.' 
      });
    }

    await prisma.game.delete({
      where: { id: gameId }
    });

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

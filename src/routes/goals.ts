import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, createGoalSchema, updateGoalSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get game goals
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

    const goals = await prisma.goal.findMany({
      where: { gameId },
      include: {
        scorer: true,
        assister1: true,
        assister2: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

// Create new goal
router.post('/games/:gameId', validateSchema(createGoalSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;
    const { scorerPlayerId, assister1PlayerId, assister2PlayerId, period, notes } = req.body;

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

    // Verify scorer belongs to the team
    const scorer = await prisma.player.findUnique({
      where: { id: scorerPlayerId }
    });

    if (!scorer || scorer.teamId !== game.teamId) {
      return res.status(400).json({ error: 'Invalid scorer for this team' });
    }

    // Verify assisters belong to the team (if provided)
    if (assister1PlayerId) {
      const assister1 = await prisma.player.findUnique({
        where: { id: assister1PlayerId }
      });

      if (!assister1 || assister1.teamId !== game.teamId) {
        return res.status(400).json({ error: 'Invalid assister1 for this team' });
      }
    }

    if (assister2PlayerId) {
      const assister2 = await prisma.player.findUnique({
        where: { id: assister2PlayerId }
      });

      if (!assister2 || assister2.teamId !== game.teamId) {
        return res.status(400).json({ error: 'Invalid assister2 for this team' });
      }
    }

    const goal = await prisma.goal.create({
      data: {
        gameId,
        period,
        scorerPlayerId,
        assister1PlayerId,
        assister2PlayerId,
        notes,
        createdBy: req.userId!
      },
      include: {
        scorer: true,
        assister1: true,
        assister2: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Goal recorded successfully',
      goal
    });
  } catch (error) {
    next(error);
  }
});

// Update goal
router.put('/:goalId', validateSchema(updateGoalSchema), async (req: AuthRequest, res, next) => {
  try {
    const { goalId } = req.params;
    const { scorerPlayerId, assister1PlayerId, assister2PlayerId, period, notes } = req.body;

    // Get goal and verify team membership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: goal.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify players belong to the team (if provided)
    if (scorerPlayerId) {
      const scorer = await prisma.player.findUnique({
        where: { id: scorerPlayerId }
      });

      if (!scorer || scorer.teamId !== goal.game.teamId) {
        return res.status(400).json({ error: 'Invalid scorer for this team' });
      }
    }

    if (assister1PlayerId) {
      const assister1 = await prisma.player.findUnique({
        where: { id: assister1PlayerId }
      });

      if (!assister1 || assister1.teamId !== goal.game.teamId) {
        return res.status(400).json({ error: 'Invalid assister1 for this team' });
      }
    }

    if (assister2PlayerId) {
      const assister2 = await prisma.player.findUnique({
        where: { id: assister2PlayerId }
      });

      if (!assister2 || assister2.teamId !== goal.game.teamId) {
        return res.status(400).json({ error: 'Invalid assister2 for this team' });
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        scorerPlayerId,
        assister1PlayerId,
        assister2PlayerId,
        period,
        notes
      },
      include: {
        scorer: true,
        assister1: true,
        assister2: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      message: 'Goal updated successfully',
      goal: updatedGoal
    });
  } catch (error) {
    next(error);
  }
});

// Delete goal
router.delete('/:goalId', async (req: AuthRequest, res, next) => {
  try {
    const { goalId } = req.params;

    // Get goal and verify team membership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: goal.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.goal.delete({
      where: { id: goalId }
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete all goals for a game
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

    await prisma.goal.deleteMany({
      where: { gameId }
    });

    res.json({ message: 'All goals deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get specific goal
router.get('/:goalId', async (req: AuthRequest, res, next) => {
  try {
    const { goalId } = req.params;

    // Get goal and verify team membership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        scorer: true,
        assister1: true,
        assister2: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        },
        game: {
          include: { team: true }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: goal.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ goal });
  } catch (error) {
    next(error);
  }
});

export default router;

import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, createFaceoffSchema, updateFaceoffSchema, incrementFaceoffSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get game faceoffs
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

    const faceoffs = await prisma.faceoff.findMany({
      where: { gameId },
      include: {
        player: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ faceoffs });
  } catch (error) {
    next(error);
  }
});

// Add player to faceoffs tracking
router.post('/games/:gameId', validateSchema(createFaceoffSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

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

    // Verify player belongs to the team
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!player || player.teamId !== game.teamId) {
      return res.status(400).json({ error: 'Invalid player for this team' });
    }

    // Check if player is already being tracked for faceoffs
    const existingFaceoff = await prisma.faceoff.findUnique({
      where: {
        gameId_playerId: {
          gameId,
          playerId
        }
      }
    });

    if (existingFaceoff) {
      return res.status(400).json({ error: 'Player is already being tracked for faceoffs' });
    }

    const faceoff = await prisma.faceoff.create({
      data: {
        gameId,
        playerId,
        createdBy: req.userId!
      },
      include: {
        player: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Player added to faceoffs tracking',
      faceoff
    });
  } catch (error) {
    next(error);
  }
});

// Increment faceoff (taken and optionally won)
router.post('/:faceoffId/increment', validateSchema(incrementFaceoffSchema), async (req: AuthRequest, res, next) => {
  try {
    const { faceoffId } = req.params;
    const { won } = req.body;

    // Get faceoff and verify team membership
    const faceoff = await prisma.faceoff.findUnique({
      where: { id: faceoffId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!faceoff) {
      return res.status(404).json({ error: 'Faceoff tracking not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: faceoff.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedFaceoff = await prisma.faceoff.update({
      where: { id: faceoffId },
      data: {
        taken: faceoff.taken + 1,
        won: won ? faceoff.won + 1 : faceoff.won
      },
      include: {
        player: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      message: 'Faceoff updated successfully',
      faceoff: updatedFaceoff
    });
  } catch (error) {
    next(error);
  }
});

// Update faceoff manually
router.put('/:faceoffId', validateSchema(updateFaceoffSchema), async (req: AuthRequest, res, next) => {
  try {
    const { faceoffId } = req.params;
    const { taken, won } = req.body;

    // Get faceoff and verify team membership
    const faceoff = await prisma.faceoff.findUnique({
      where: { id: faceoffId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!faceoff) {
      return res.status(404).json({ error: 'Faceoff tracking not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: faceoff.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate that won doesn't exceed taken
    const finalTaken = taken !== undefined ? taken : faceoff.taken;
    const finalWon = won !== undefined ? won : faceoff.won;

    if (finalWon > finalTaken) {
      return res.status(400).json({ error: 'Won cannot exceed taken' });
    }

    const updatedFaceoff = await prisma.faceoff.update({
      where: { id: faceoffId },
      data: {
        taken: finalTaken,
        won: finalWon
      },
      include: {
        player: true,
        recorder: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      message: 'Faceoff updated successfully',
      faceoff: updatedFaceoff
    });
  } catch (error) {
    next(error);
  }
});

// Delete faceoff tracking
router.delete('/:faceoffId', async (req: AuthRequest, res, next) => {
  try {
    const { faceoffId } = req.params;

    // Get faceoff and verify team membership
    const faceoff = await prisma.faceoff.findUnique({
      where: { id: faceoffId },
      include: {
        game: {
          include: { team: true }
        }
      }
    });

    if (!faceoff) {
      return res.status(404).json({ error: 'Faceoff tracking not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: faceoff.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.faceoff.delete({
      where: { id: faceoffId }
    });

    res.json({ message: 'Faceoff tracking deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get specific faceoff
router.get('/:faceoffId', async (req: AuthRequest, res, next) => {
  try {
    const { faceoffId } = req.params;

    // Get faceoff and verify team membership
    const faceoff = await prisma.faceoff.findUnique({
      where: { id: faceoffId },
      include: {
        player: true,
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

    if (!faceoff) {
      return res.status(404).json({ error: 'Faceoff tracking not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: faceoff.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ faceoff });
  } catch (error) {
    next(error);
  }
});

export default router;

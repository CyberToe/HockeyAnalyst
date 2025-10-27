import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, updateGamePlayerSchema } from '../utils/validation';
import { AuthRequest, requireTeamMember } from '../middleware/auth';

const router = express.Router();

// Get game players
router.get('/games/:gameId', requireTeamMember, async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;

    // Get the game and verify team membership
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

    // Get game players with player details
    const gamePlayers = await prisma.gamePlayer.findMany({
      where: { gameId },
      include: {
        player: true
      },
      orderBy: [
        { included: 'desc' },
        { number: 'asc' },
        { player: { name: 'asc' } }
      ]
    });

    res.json({ gamePlayers });
  } catch (error) {
    next(error);
  }
});

// Initialize game players (called when creating a new game)
router.post('/games/:gameId/initialize', requireTeamMember, async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;

    // Get the game and verify team membership
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

    // Check if game players already exist
    const existingGamePlayers = await prisma.gamePlayer.findFirst({
      where: { gameId }
    });

    if (existingGamePlayers) {
      return res.status(400).json({ error: 'Game players already initialized' });
    }

    // Get all team players
    const players = await prisma.player.findMany({
      where: { teamId: game.teamId },
      orderBy: [
        { type: 'asc' },
        { number: 'asc' },
        { name: 'asc' }
      ]
    });

    // Create game players with team players included by default
    const gamePlayers = await prisma.gamePlayer.createMany({
      data: players.map(player => ({
        gameId,
        playerId: player.id,
        included: player.type === 'TEAM_PLAYER',
        number: player.number
      }))
    });

    res.status(201).json({
      message: 'Game players initialized successfully',
      count: gamePlayers.count
    });
  } catch (error) {
    next(error);
  }
});

// Update game player (included status and number)
router.put('/:gamePlayerId', validateSchema(updateGamePlayerSchema), async (req: AuthRequest, res, next) => {
  try {
    const { gamePlayerId } = req.params;
    const { included, number } = req.body;

    // Get game player and verify team membership
    const gamePlayer = await prisma.gamePlayer.findUnique({
      where: { id: gamePlayerId },
      include: {
        game: {
          include: { team: true }
        },
        player: true
      }
    });

    if (!gamePlayer) {
      return res.status(404).json({ error: 'Game player not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: gamePlayer.game.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update game player
    const updatedGamePlayer = await prisma.gamePlayer.update({
      where: { id: gamePlayerId },
      data: {
        ...(included !== undefined && { included }),
        ...(number !== undefined && { number })
      },
      include: {
        player: true
      }
    });

    res.json({
      message: 'Game player updated successfully',
      gamePlayer: updatedGamePlayer
    });
  } catch (error) {
    next(error);
  }
});

// Bulk update game players
router.put('/games/:gameId/bulk', requireTeamMember, async (req: AuthRequest, res, next) => {
  try {
    const { gameId } = req.params;
    const { updates } = req.body; // Array of { gamePlayerId, included, number }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    // Get the game and verify team membership
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

    // Update all game players
    const updatePromises = updates.map(update => 
      prisma.gamePlayer.update({
        where: { id: update.gamePlayerId },
        data: {
          ...(update.included !== undefined && { included: update.included }),
          ...(update.number !== undefined && { number: update.number })
        }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      message: 'Game players updated successfully',
      count: updates.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;

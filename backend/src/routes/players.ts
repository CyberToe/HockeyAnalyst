import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, createPlayerSchema, updatePlayerSchema } from '../utils/validation';
import { AuthRequest, requireTeamMember } from '../middleware/auth';

const router = express.Router();

// Get team players
router.get('/teams/:teamId', requireTeamMember, async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;

    const players = await prisma.player.findMany({
      where: { teamId },
      orderBy: [
        { type: 'asc' },
        { number: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ players });
  } catch (error) {
    next(error);
  }
});

// Add player to team
router.post('/teams/:teamId', requireTeamMember, validateSchema(createPlayerSchema), async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, number, type } = req.body;

    // Check if player name already exists in team
    const existingPlayer = await prisma.player.findFirst({
      where: {
        teamId,
        name
      }
    });

    if (existingPlayer) {
      return res.status(400).json({ error: 'Player with this name already exists in the team' });
    }

    // Check if player number already exists in team (if provided)
    if (number !== undefined) {
      const existingNumber = await prisma.player.findFirst({
        where: {
          teamId,
          number
        }
      });

      if (existingNumber) {
        return res.status(400).json({ error: 'Player with this number already exists in the team' });
      }
    }

    const player = await prisma.player.create({
      data: {
        teamId,
        name,
        number,
        type: type || 'TEAM_PLAYER'
      }
    });

    // Add player to all existing games for this team
    const existingGames = await prisma.game.findMany({
      where: { teamId },
      select: { id: true }
    });

    if (existingGames.length > 0) {
      await prisma.gamePlayer.createMany({
        data: existingGames.map(game => ({
          gameId: game.id,
          playerId: player.id,
          included: false, // Add with checkbox unchecked
          number: player.number
        }))
      });
    }

    res.status(201).json({
      message: 'Player added successfully',
      player
    });
  } catch (error) {
    next(error);
  }
});

// Update player
router.put('/:playerId', validateSchema(updatePlayerSchema), async (req: AuthRequest, res, next) => {
  try {
    const { playerId } = req.params;
    const { name, number, type } = req.body;

    // Get player and verify team membership
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: player.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for name conflicts (if name is being updated)
    if (name && name !== player.name) {
      const existingPlayer = await prisma.player.findFirst({
        where: {
          teamId: player.teamId,
          name,
          id: { not: playerId }
        }
      });

      if (existingPlayer) {
        return res.status(400).json({ error: 'Player with this name already exists in the team' });
      }
    }

    // Check for number conflicts (if number is being updated)
    if (number !== undefined && number !== player.number) {
      const existingNumber = await prisma.player.findFirst({
        where: {
          teamId: player.teamId,
          number,
          id: { not: playerId }
        }
      });

      if (existingNumber) {
        return res.status(400).json({ error: 'Player with this number already exists in the team' });
      }
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(name && { name }),
        ...(number !== undefined && { number }),
        ...(type && { type })
      }
    });

    res.json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });
  } catch (error) {
    next(error);
  }
});

// Delete player
router.delete('/:playerId', async (req: AuthRequest, res, next) => {
  try {
    const { playerId } = req.params;

    // Get player and verify team membership
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: player.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if player has any shots recorded
    const shotCount = await prisma.shot.count({
      where: { shooterPlayerId: playerId }
    });

    if (shotCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete player with recorded shots. Consider archiving instead.' 
      });
    }

    await prisma.player.delete({
      where: { id: playerId }
    });

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get player details with statistics
router.get('/:playerId/stats', async (req: AuthRequest, res, next) => {
  try {
    const { playerId } = req.params;

    // Get player and verify team membership
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { 
        team: true,
        shots: {
          include: {
            game: true,
            period: true
          }
        }
      }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: player.teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate statistics
    const totalShots = player.shots.length;
    const goals = player.shots.filter(shot => shot.scored).length;
    const shootingPercentage = totalShots > 0 ? (goals / totalShots) * 100 : 0;

    // Goals by period
    const goalsByPeriod = player.shots
      .filter(shot => shot.scored)
      .reduce((acc, shot) => {
        const period = shot.period.periodNumber;
        acc[period] = (acc[period] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    // Goals by game
    const goalsByGame = player.shots
      .filter(shot => shot.scored)
      .reduce((acc, shot) => {
        const gameId = shot.game.id;
        if (!acc[gameId]) {
          acc[gameId] = {
            gameId,
            opponent: shot.game.opponent,
            goals: 0
          };
        }
        acc[gameId].goals += 1;
        return acc;
      }, {} as Record<string, { gameId: string; opponent: string | null; goals: number }>);

    res.json({
      player: {
        id: player.id,
        name: player.name,
        number: player.number,
        teamId: player.teamId,
        teamName: player.team.name
      },
      statistics: {
        totalShots,
        goals,
        shootingPercentage: Math.round(shootingPercentage * 100) / 100,
        goalsByPeriod,
        goalsByGame: Object.values(goalsByGame)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

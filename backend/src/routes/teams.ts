import express from 'express';
import { prisma } from '../lib/prisma';
import { validateSchema, createTeamSchema, joinTeamSchema, updateTeamSchema } from '../utils/validation';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get user's teams
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: req.userId
          }
        },
        deleted: false
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        },
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ teams });
  } catch (error) {
    next(error);
  }
});

// Create new team
router.post('/', validateSchema(createTeamSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name, description, imageUrl, type, state } = req.body;

    // Generate a unique team code
    const generateTeamCode = () => {
      const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < 7; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return result;
    };

    let teamCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      teamCode = generateTeamCode();
      attempts++;
      
      if (attempts > maxAttempts) {
        return res.status(500).json({ error: 'Unable to generate unique team code' });
      }
    } while (await prisma.team.findUnique({ where: { teamCode } }));

    const team = await prisma.team.create({
      data: {
        name,
        description,
        imageUrl,
        type: type || 'BASIC_FREE',
        state: state || 'ACTIVE',
        teamCode,
        createdBy: req.userId!,
        members: {
          create: {
            userId: req.userId!,
            role: 'admin'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    next(error);
  }
});

// Join team by code
router.post('/join', validateSchema(joinTeamSchema), async (req: AuthRequest, res, next) => {
  try {
    const { teamCode } = req.body;

    // Find team by code
    const team = await prisma.team.findUnique({
      where: { 
        teamCode: teamCode.toUpperCase(),
        deleted: false
      }
    });

    if (!team) {
      res.status(404).json({ error: 'Team with that code not found' });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: req.userId!
        }
      }
    });

    if (existingMembership) {
      res.status(400).json({ error: 'You are already a member of this team' });
      return;
    }

    // Add user to team
    const membership = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: req.userId!,
        role: 'member'
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    displayName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Successfully joined team',
      team: membership.team,
      role: membership.role
    });
  } catch (error) {
    next(error);
  }
});

// Get team details
router.get('/:teamId', async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;

    // Check if user is a member
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        },
        players: {
          orderBy: { name: 'asc' }
        },
        games: {
          include: {
            _count: {
              select: { shots: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!team || team.deleted) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json({ 
      team,
      userRole: membership.role
    });
  } catch (error) {
    next(error);
  }
});

// Update team (admin only)
router.put('/:teamId', requireAdmin, validateSchema(updateTeamSchema), async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, description, imageUrl, type, state } = req.body;

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(type && { type }),
        ...(state && { state })
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    next(error);
  }
});

// Delete team or leave team
router.delete('/:teamId', async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const { confirm } = req.body;

    // Check membership
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: req.userId!
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    // Get member count
    const memberCount = await prisma.teamMember.count({
      where: { teamId }
    });

    if (membership.role === 'admin') {
      if (memberCount > 1 && !confirm) {
        return res.status(400).json({ 
          error: 'Team has multiple members. Use confirm=true to delete the entire team, or remove members first.' 
        });
      }

      if (memberCount === 1 && !confirm) {
        return res.status(400).json({ 
          error: 'This team only has one member. Use confirm=true to permanently delete the team.' 
        });
      }

      // Delete team (cascades to all related data)
      await prisma.team.update({
        where: { id: teamId },
        data: { 
          deleted: true,
          deletedAt: new Date()
        }
      });

      return res.json({ message: 'Team deleted successfully' });
    } else {
      // Non-admin: just leave the team
      await prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId,
            userId: req.userId!
          }
        }
      });

      return res.json({ message: 'Left team successfully' });
    }
  } catch (error) {
    next(error);
  }
});

// Promote user to admin
router.post('/:teamId/promote', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Check if target user is a member
    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (!targetMembership) {
      res.status(404).json({ error: 'User is not a member of this team' });
      return;
    }

    // Promote to admin
    await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      },
      data: { role: 'admin' }
    });

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove team member
router.delete('/:teamId/members/:userId', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { teamId, userId } = req.params;

    // Cannot remove yourself
    if (userId === req.userId) {
      res.status(400).json({ error: 'Cannot remove yourself. Use leave team instead.' });
      return;
    }

    // Check if target user is a member
    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    if (!targetMembership) {
      res.status(404).json({ error: 'User is not a member of this team' });
      return;
    }

    // Remove membership
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

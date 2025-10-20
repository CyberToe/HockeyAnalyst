"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const validation_1 = require("../utils/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', async (req, res, next) => {
    try {
        const teams = await prisma_1.prisma.team.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/', (0, validation_1.validateSchema)(validation_1.createTeamSchema), async (req, res, next) => {
    try {
        const { name, description } = req.body;
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
        } while (await prisma_1.prisma.team.findUnique({ where: { teamCode } }));
        const team = await prisma_1.prisma.team.create({
            data: {
                name,
                description,
                teamCode,
                createdBy: req.userId,
                members: {
                    create: {
                        userId: req.userId,
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/join', (0, validation_1.validateSchema)(validation_1.joinTeamSchema), async (req, res, next) => {
    try {
        const { teamCode } = req.body;
        const team = await prisma_1.prisma.team.findUnique({
            where: {
                teamCode: teamCode.toUpperCase(),
                deleted: false
            }
        });
        if (!team) {
            res.status(404).json({ error: 'Team with that code not found' });
            return;
        }
        const existingMembership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: team.id,
                    userId: req.userId
                }
            }
        });
        if (existingMembership) {
            res.status(400).json({ error: 'You are already a member of this team' });
            return;
        }
        const membership = await prisma_1.prisma.teamMember.create({
            data: {
                teamId: team.id,
                userId: req.userId,
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/:teamId', async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const team = await prisma_1.prisma.team.findUnique({
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
    }
    catch (error) {
        next(error);
    }
});
router.put('/:teamId', auth_1.requireAdmin, (0, validation_1.validateSchema)(validation_1.updateTeamSchema), async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { name, description } = req.body;
        const team = await prisma_1.prisma.team.update({
            where: { id: teamId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
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
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:teamId', async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { confirm } = req.body;
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this team' });
        }
        const memberCount = await prisma_1.prisma.teamMember.count({
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
            await prisma_1.prisma.team.update({
                where: { id: teamId },
                data: {
                    deleted: true,
                    deletedAt: new Date()
                }
            });
            return res.json({ message: 'Team deleted successfully' });
        }
        else {
            await prisma_1.prisma.teamMember.delete({
                where: {
                    teamId_userId: {
                        teamId,
                        userId: req.userId
                    }
                }
            });
            return res.json({ message: 'Left team successfully' });
        }
    }
    catch (error) {
        next(error);
    }
});
router.post('/:teamId/promote', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const targetMembership = await prisma_1.prisma.teamMember.findUnique({
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
        await prisma_1.prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            },
            data: { role: 'admin' }
        });
        res.json({ message: 'User promoted to admin successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:teamId/members/:userId', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { teamId, userId } = req.params;
        if (userId === req.userId) {
            res.status(400).json({ error: 'Cannot remove yourself. Use leave team instead.' });
            return;
        }
        const targetMembership = await prisma_1.prisma.teamMember.findUnique({
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
        await prisma_1.prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            }
        });
        res.json({ message: 'Member removed successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=teams.js.map
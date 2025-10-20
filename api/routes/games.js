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
router.get('/teams/:teamId', auth_1.requireTeamMember, async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const games = await prisma_1.prisma.game.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/teams/:teamId', auth_1.requireTeamMember, (0, validation_1.validateSchema)(validation_1.createGameSchema), async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { opponent, location, startTime, notes } = req.body;
        const game = await prisma_1.prisma.game.create({
            data: {
                teamId,
                opponent,
                location,
                startTime: startTime ? new Date(startTime) : null,
                notes,
                createdBy: req.userId,
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/:gameId', async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const game = await prisma_1.prisma.game.findUnique({
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
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ game });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:gameId', (0, validation_1.validateSchema)(validation_1.updateGameSchema), async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { opponent, location, startTime, notes } = req.body;
        const game = await prisma_1.prisma.game.findUnique({
            where: { id: gameId },
            include: { team: true }
        });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const updatedGame = await prisma_1.prisma.game.update({
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
    }
    catch (error) {
        next(error);
    }
});
router.put('/:gameId/periods/:periodNumber', (0, validation_1.validateSchema)(validation_1.updatePeriodSchema), async (req, res, next) => {
    try {
        const { gameId, periodNumber } = req.params;
        const { attackingDirection, startedAt, endedAt } = req.body;
        const periodNum = parseInt(periodNumber);
        if (periodNum < 1 || periodNum > 3) {
            return res.status(400).json({ error: 'Period number must be between 1 and 3' });
        }
        const game = await prisma_1.prisma.game.findUnique({
            where: { id: gameId },
            include: { team: true }
        });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const period = await prisma_1.prisma.period.findUnique({
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
        const updatedPeriod = await prisma_1.prisma.period.update({
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/:gameId/periods', async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const game = await prisma_1.prisma.game.findUnique({
            where: { id: gameId },
            include: { team: true, periods: true }
        });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (game.periods.length === 0) {
            const periods = await prisma_1.prisma.$transaction([
                prisma_1.prisma.period.create({
                    data: { gameId, periodNumber: 1, attackingDirection: 'right' }
                }),
                prisma_1.prisma.period.create({
                    data: { gameId, periodNumber: 2, attackingDirection: 'left' }
                }),
                prisma_1.prisma.period.create({
                    data: { gameId, periodNumber: 3, attackingDirection: 'right' }
                })
            ]);
            res.json({
                message: 'Periods created successfully',
                periods
            });
        }
        else {
            res.json({
                message: 'Periods already exist',
                periods: game.periods
            });
        }
    }
    catch (error) {
        next(error);
    }
});
router.put('/:gameId/periods', (0, validation_1.validateSchema)(validation_1.updateMultiplePeriodsSchema), async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { periods } = req.body;
        const game = await prisma_1.prisma.game.findUnique({
            where: { id: gameId },
            include: { team: true }
        });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const updatedPeriods = await prisma_1.prisma.$transaction(periods.map((period) => prisma_1.prisma.period.update({
            where: {
                gameId_periodNumber: {
                    gameId,
                    periodNumber: period.periodNumber
                }
            },
            data: {
                attackingDirection: period.attackingDirection
            }
        })));
        res.json({
            message: 'Periods updated successfully',
            periods: updatedPeriods
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:gameId', async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const game = await prisma_1.prisma.game.findUnique({
            where: { id: gameId },
            include: { team: true }
        });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const shotCount = await prisma_1.prisma.shot.count({
            where: { gameId }
        });
        if (shotCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete game with recorded shots. Consider archiving instead.'
            });
        }
        await prisma_1.prisma.game.delete({
            where: { id: gameId }
        });
        res.json({ message: 'Game deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=games.js.map
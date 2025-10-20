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
        const players = await prisma_1.prisma.player.findMany({
            where: { teamId },
            orderBy: [
                { number: 'asc' },
                { name: 'asc' }
            ]
        });
        res.json({ players });
    }
    catch (error) {
        next(error);
    }
});
router.post('/teams/:teamId', auth_1.requireTeamMember, (0, validation_1.validateSchema)(validation_1.createPlayerSchema), async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { name, number } = req.body;
        const existingPlayer = await prisma_1.prisma.player.findFirst({
            where: {
                teamId,
                name
            }
        });
        if (existingPlayer) {
            return res.status(400).json({ error: 'Player with this name already exists in the team' });
        }
        if (number !== undefined) {
            const existingNumber = await prisma_1.prisma.player.findFirst({
                where: {
                    teamId,
                    number
                }
            });
            if (existingNumber) {
                return res.status(400).json({ error: 'Player with this number already exists in the team' });
            }
        }
        const player = await prisma_1.prisma.player.create({
            data: {
                teamId,
                name,
                number
            }
        });
        res.status(201).json({
            message: 'Player added successfully',
            player
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:playerId', (0, validation_1.validateSchema)(validation_1.updatePlayerSchema), async (req, res, next) => {
    try {
        const { playerId } = req.params;
        const { name, number } = req.body;
        const player = await prisma_1.prisma.player.findUnique({
            where: { id: playerId },
            include: { team: true }
        });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: player.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (name && name !== player.name) {
            const existingPlayer = await prisma_1.prisma.player.findFirst({
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
        if (number !== undefined && number !== player.number) {
            const existingNumber = await prisma_1.prisma.player.findFirst({
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
        const updatedPlayer = await prisma_1.prisma.player.update({
            where: { id: playerId },
            data: {
                ...(name && { name }),
                ...(number !== undefined && { number })
            }
        });
        res.json({
            message: 'Player updated successfully',
            player: updatedPlayer
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:playerId', async (req, res, next) => {
    try {
        const { playerId } = req.params;
        const player = await prisma_1.prisma.player.findUnique({
            where: { id: playerId },
            include: { team: true }
        });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: player.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const shotCount = await prisma_1.prisma.shot.count({
            where: { shooterPlayerId: playerId }
        });
        if (shotCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete player with recorded shots. Consider archiving instead.'
            });
        }
        await prisma_1.prisma.player.delete({
            where: { id: playerId }
        });
        res.json({ message: 'Player deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:playerId/stats', async (req, res, next) => {
    try {
        const { playerId } = req.params;
        const player = await prisma_1.prisma.player.findUnique({
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
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: player.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const totalShots = player.shots.length;
        const goals = player.shots.filter(shot => shot.scored).length;
        const shootingPercentage = totalShots > 0 ? (goals / totalShots) * 100 : 0;
        const goalsByPeriod = player.shots
            .filter(shot => shot.scored)
            .reduce((acc, shot) => {
            const period = shot.period.periodNumber;
            acc[period] = (acc[period] || 0) + 1;
            return acc;
        }, {});
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
        }, {});
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=players.js.map
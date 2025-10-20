"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
router.get('/games/:gameId', async (req, res, next) => {
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
        const faceoffs = await prisma_1.prisma.faceoff.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/games/:gameId', (0, validation_1.validateSchema)(validation_1.createFaceoffSchema), async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { playerId } = req.body;
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
        const player = await prisma_1.prisma.player.findUnique({
            where: { id: playerId }
        });
        if (!player || player.teamId !== game.teamId) {
            return res.status(400).json({ error: 'Invalid player for this team' });
        }
        const existingFaceoff = await prisma_1.prisma.faceoff.findUnique({
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
        const faceoff = await prisma_1.prisma.faceoff.create({
            data: {
                gameId,
                playerId,
                createdBy: req.userId
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/:faceoffId/increment', (0, validation_1.validateSchema)(validation_1.incrementFaceoffSchema), async (req, res, next) => {
    try {
        const { faceoffId } = req.params;
        const { won } = req.body;
        const faceoff = await prisma_1.prisma.faceoff.findUnique({
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
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: faceoff.game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const updatedFaceoff = await prisma_1.prisma.faceoff.update({
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
    }
    catch (error) {
        next(error);
    }
});
router.put('/:faceoffId', (0, validation_1.validateSchema)(validation_1.updateFaceoffSchema), async (req, res, next) => {
    try {
        const { faceoffId } = req.params;
        const { taken, won } = req.body;
        const faceoff = await prisma_1.prisma.faceoff.findUnique({
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
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: faceoff.game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const finalTaken = taken !== undefined ? taken : faceoff.taken;
        const finalWon = won !== undefined ? won : faceoff.won;
        if (finalWon > finalTaken) {
            return res.status(400).json({ error: 'Won cannot exceed taken' });
        }
        const updatedFaceoff = await prisma_1.prisma.faceoff.update({
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
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:faceoffId', async (req, res, next) => {
    try {
        const { faceoffId } = req.params;
        const faceoff = await prisma_1.prisma.faceoff.findUnique({
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
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: faceoff.game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await prisma_1.prisma.faceoff.delete({
            where: { id: faceoffId }
        });
        res.json({ message: 'Faceoff tracking deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:faceoffId', async (req, res, next) => {
    try {
        const { faceoffId } = req.params;
        const faceoff = await prisma_1.prisma.faceoff.findUnique({
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
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: faceoff.game.teamId,
                    userId: req.userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ faceoff });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=faceoffs.js.map
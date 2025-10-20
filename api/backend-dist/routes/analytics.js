"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/teams/:teamId', auth_1.requireTeamMember, async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: {
                    include: {
                        shots: {
                            include: {
                                game: true,
                                period: true
                            }
                        }
                    }
                },
                games: {
                    include: {
                        shots: {
                            include: {
                                shooter: true,
                                period: true
                            }
                        }
                    }
                }
            }
        });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const allShots = team.games.flatMap(game => game.shots);
        const teamShots = allShots.filter(shot => !shot.scoredAgainst);
        const opponentShots = allShots.filter(shot => shot.scoredAgainst);
        const teamGoals = teamShots.filter(shot => shot.scored).length;
        const opponentGoals = opponentShots.filter(shot => shot.scored).length;
        const totalTeamShots = teamShots.length;
        const teamShootingPercentage = totalTeamShots > 0 ? (teamGoals / totalTeamShots) * 100 : 0;
        const playerStats = team.players.map(player => {
            const playerShots = player.shots;
            const playerGoals = playerShots.filter(shot => shot.scored).length;
            const shootingPercentage = playerShots.length > 0 ? (playerGoals / playerShots.length) * 100 : 0;
            const goalsByPeriod = playerShots
                .filter(shot => shot.scored)
                .reduce((acc, shot) => {
                const period = shot.period.periodNumber;
                acc[period] = (acc[period] || 0) + 1;
                return acc;
            }, {});
            return {
                player: {
                    id: player.id,
                    name: player.name,
                    number: player.number
                },
                statistics: {
                    totalShots: playerShots.length,
                    goals: playerGoals,
                    shootingPercentage: Math.round(shootingPercentage * 100) / 100,
                    goalsByPeriod
                }
            };
        }).sort((a, b) => b.statistics.goals - a.statistics.goals);
        const gameStats = team.games.map(game => {
            const gameShots = game.shots;
            const teamGameShots = gameShots.filter(shot => !shot.scoredAgainst);
            const opponentGameShots = gameShots.filter(shot => shot.scoredAgainst);
            const teamGameGoals = teamGameShots.filter(shot => shot.scored).length;
            const opponentGameGoals = opponentGameShots.filter(shot => shot.scored).length;
            return {
                game: {
                    id: game.id,
                    opponent: game.opponent,
                    location: game.location,
                    startTime: game.startTime,
                    createdAt: game.createdAt
                },
                statistics: {
                    teamShots: teamGameShots.length,
                    teamGoals: teamGameGoals,
                    opponentShots: opponentGameShots.length,
                    opponentGoals: opponentGameGoals,
                    teamShootingPercentage: teamGameShots.length > 0 ?
                        Math.round((teamGameGoals / teamGameShots.length) * 10000) / 100 : 0
                }
            };
        }).sort((a, b) => new Date(b.game.createdAt).getTime() - new Date(a.game.createdAt).getTime());
        const periodStats = [1, 2, 3].map(periodNum => {
            const periodShots = allShots.filter(shot => shot.period.periodNumber === periodNum);
            const teamPeriodShots = periodShots.filter(shot => !shot.scoredAgainst);
            const opponentPeriodShots = periodShots.filter(shot => shot.scoredAgainst);
            const teamPeriodGoals = teamPeriodShots.filter(shot => shot.scored).length;
            const opponentPeriodGoals = opponentPeriodShots.filter(shot => shot.scored).length;
            return {
                period: periodNum,
                statistics: {
                    teamShots: teamPeriodShots.length,
                    teamGoals: teamPeriodGoals,
                    opponentShots: opponentPeriodShots.length,
                    opponentGoals: opponentPeriodGoals,
                    teamShootingPercentage: teamPeriodShots.length > 0 ?
                        Math.round((teamPeriodGoals / teamPeriodShots.length) * 10000) / 100 : 0
                }
            };
        });
        res.json({
            team: {
                id: team.id,
                name: team.name,
                description: team.description
            },
            overview: {
                totalGames: team.games.length,
                totalShots: totalTeamShots,
                totalGoals: teamGoals,
                totalOpponentGoals: opponentGoals,
                shootingPercentage: Math.round(teamShootingPercentage * 100) / 100,
                goalDifference: teamGoals - opponentGoals
            },
            playerStats,
            gameStats,
            periodStats
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/teams/:teamId/players', auth_1.requireTeamMember, async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { gameId } = req.query;
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: {
                    include: {
                        shots: {
                            include: {
                                game: true,
                                period: true
                            },
                            ...(gameId && gameId !== 'all' ? {
                                where: { gameId: gameId }
                            } : {})
                        },
                        goalsScored: {
                            include: {
                                game: true
                            },
                            ...(gameId && gameId !== 'all' ? {
                                where: { gameId: gameId }
                            } : {})
                        },
                        goalsAssisted1: {
                            include: {
                                game: true
                            },
                            ...(gameId && gameId !== 'all' ? {
                                where: { gameId: gameId }
                            } : {})
                        },
                        goalsAssisted2: {
                            include: {
                                game: true
                            },
                            ...(gameId && gameId !== 'all' ? {
                                where: { gameId: gameId }
                            } : {})
                        },
                        faceoffs: {
                            include: {
                                game: true
                            },
                            ...(gameId && gameId !== 'all' ? {
                                where: { gameId: gameId }
                            } : {})
                        }
                    }
                }
            }
        });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const players = team.players.map(player => {
            const shots = player.shots.length;
            const goalsFromShots = player.shots.filter(shot => shot.scored).length;
            const goalsFromGoals = player.goalsScored.length;
            const assists = player.goalsAssisted1.length + player.goalsAssisted2.length;
            const faceoffsTaken = player.faceoffs.reduce((sum, faceoff) => sum + faceoff.taken, 0);
            const faceoffsWon = player.faceoffs.reduce((sum, faceoff) => sum + faceoff.won, 0);
            const goals = Math.max(goalsFromShots, goalsFromGoals);
            return {
                id: player.id,
                name: player.name,
                number: player.number,
                stats: {
                    shots,
                    goals,
                    assists,
                    faceoffsTaken,
                    faceoffsWon
                }
            };
        });
        res.json({ players });
    }
    catch (error) {
        next(error);
    }
});
router.get('/players/:playerId', async (req, res, next) => {
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
                    },
                    orderBy: { takenAt: 'desc' }
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
        const goalsByGame = player.shots
            .filter(shot => shot.scored)
            .reduce((acc, shot) => {
            const gameId = shot.game.id;
            if (!acc[gameId]) {
                acc[gameId] = {
                    gameId,
                    opponent: shot.game.opponent,
                    location: shot.game.location,
                    startTime: shot.game.startTime,
                    goals: 0
                };
            }
            acc[gameId].goals += 1;
            return acc;
        }, {});
        const goalsByPeriod = player.shots
            .filter(shot => shot.scored)
            .reduce((acc, shot) => {
            const period = shot.period.periodNumber;
            acc[period] = (acc[period] || 0) + 1;
            return acc;
        }, {});
        const recentGames = Array.from(new Set(player.shots.map(shot => shot.game.id)))
            .slice(0, 10)
            .map(gameId => {
            const gameShots = player.shots.filter(shot => shot.game.id === gameId);
            const game = gameShots[0]?.game;
            const gameGoals = gameShots.filter(shot => shot.scored).length;
            return {
                gameId,
                opponent: game?.opponent,
                startTime: game?.startTime,
                shots: gameShots.length,
                goals: gameGoals,
                shootingPercentage: gameShots.length > 0 ?
                    Math.round((gameGoals / gameShots.length) * 10000) / 100 : 0
            };
        });
        const shotLocations = player.shots.map(shot => ({
            xCoord: shot.xCoord,
            yCoord: shot.yCoord,
            scored: shot.scored,
            takenAt: shot.takenAt
        }));
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
                goalsByGame: Object.values(goalsByGame),
                recentPerformance: recentGames
            },
            shotLocations
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/games/:gameId', async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const game = await prisma_1.prisma.game.findUnique({
            where: { id: gameId },
            include: {
                team: {
                    include: {
                        players: {
                            include: {
                                shots: {
                                    include: {
                                        game: true,
                                        period: true
                                    },
                                    where: { gameId: gameId }
                                },
                                goalsScored: {
                                    include: {
                                        game: true
                                    },
                                    where: { gameId: gameId }
                                },
                                goalsAssisted1: {
                                    include: {
                                        game: true
                                    },
                                    where: { gameId: gameId }
                                },
                                goalsAssisted2: {
                                    include: {
                                        game: true
                                    },
                                    where: { gameId: gameId }
                                },
                                faceoffs: {
                                    include: {
                                        game: true
                                    },
                                    where: { gameId: gameId }
                                }
                            }
                        }
                    }
                },
                shots: {
                    include: {
                        shooter: true,
                        period: true
                    },
                    orderBy: { takenAt: 'asc' }
                },
                periods: {
                    orderBy: { periodNumber: 'asc' }
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
        const allShots = game.shots;
        const teamShots = allShots.filter(shot => !shot.scoredAgainst);
        const opponentShots = allShots.filter(shot => shot.scoredAgainst);
        const teamGoals = teamShots.filter(shot => shot.scored).length;
        const opponentGoals = opponentShots.filter(shot => shot.scored).length;
        const teamShootingPercentage = teamShots.length > 0 ? (teamGoals / teamShots.length) * 100 : 0;
        const periodStats = game.periods.map(period => {
            const periodShots = allShots.filter(shot => shot.period.id === period.id);
            const teamPeriodShots = periodShots.filter(shot => !shot.scoredAgainst);
            const opponentPeriodShots = periodShots.filter(shot => shot.scoredAgainst);
            const teamPeriodGoals = teamPeriodShots.filter(shot => shot.scored).length;
            const opponentPeriodGoals = opponentPeriodShots.filter(shot => shot.scored).length;
            return {
                period: {
                    id: period.id,
                    periodNumber: period.periodNumber,
                    attackingDirection: period.attackingDirection,
                    startedAt: period.startedAt,
                    endedAt: period.endedAt
                },
                statistics: {
                    teamShots: teamPeriodShots.length,
                    teamGoals: teamPeriodGoals,
                    opponentShots: opponentPeriodShots.length,
                    opponentGoals: opponentPeriodGoals,
                    teamShootingPercentage: teamPeriodShots.length > 0 ?
                        Math.round((teamPeriodGoals / teamPeriodShots.length) * 10000) / 100 : 0
                }
            };
        });
        const playerStats = game.team.players.map(player => {
            const shots = player.shots.length;
            const goalsFromShots = player.shots.filter(shot => shot.scored).length;
            const goalsFromGoals = player.goalsScored.length;
            const assists = player.goalsAssisted1.length + player.goalsAssisted2.length;
            const faceoffsTaken = player.faceoffs.reduce((sum, faceoff) => sum + faceoff.taken, 0);
            const faceoffsWon = player.faceoffs.reduce((sum, faceoff) => sum + faceoff.won, 0);
            const goals = Math.max(goalsFromShots, goalsFromGoals);
            return {
                player: {
                    id: player.id,
                    name: player.name,
                    number: player.number
                },
                statistics: {
                    shots,
                    goals,
                    assists,
                    faceoffsTaken,
                    faceoffsWon,
                    shootingPercentage: shots > 0 ?
                        Math.round((goals / shots) * 10000) / 100 : 0
                }
            };
        }).sort((a, b) => b.statistics.goals - a.statistics.goals);
        const shotTimeline = allShots.map(shot => ({
            id: shot.id,
            takenAt: shot.takenAt,
            xCoord: shot.xCoord,
            yCoord: shot.yCoord,
            scored: shot.scored,
            scoredAgainst: shot.scoredAgainst,
            shooter: shot.shooter ? {
                id: shot.shooter.id,
                name: shot.shooter.name,
                number: shot.shooter.number
            } : null,
            period: shot.period.periodNumber,
            attackingDirection: shot.period.attackingDirection
        }));
        res.json({
            game: {
                id: game.id,
                teamId: game.teamId,
                teamName: game.team.name,
                opponent: game.opponent,
                location: game.location,
                startTime: game.startTime,
                createdAt: game.createdAt
            },
            overview: {
                teamShots: teamShots.length,
                teamGoals,
                opponentShots: opponentShots.length,
                opponentGoals,
                teamShootingPercentage: Math.round(teamShootingPercentage * 100) / 100,
                goalDifference: teamGoals - opponentGoals
            },
            periodStats,
            playerStats,
            shotTimeline
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map
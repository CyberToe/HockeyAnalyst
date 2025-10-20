"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTeamMember = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const jwtSecret = process.env.JWT_TOKEN || 'hockey-analytics-super-secret-key-2025-production-change-this';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, displayName: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.userId = user.id;
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = async (req, res, next) => {
    const { teamId } = req.params;
    const userId = req.userId;
    if (!userId || !teamId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            }
        });
        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to verify admin status' });
    }
};
exports.requireAdmin = requireAdmin;
const requireTeamMember = async (req, res, next) => {
    const { teamId } = req.params;
    const userId = req.userId;
    if (!userId || !teamId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const membership = await prisma_1.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Team membership required' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to verify team membership' });
    }
};
exports.requireTeamMember = requireTeamMember;
//# sourceMappingURL=auth.js.map
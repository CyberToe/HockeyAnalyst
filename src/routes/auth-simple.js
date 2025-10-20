"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../utils/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Environment check:', {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            JWT_SECRET: process.env.JWT_TOKEN ? 'Set' : 'Not set'
        });
        const { email, password, displayName } = req.body;
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        // Hash password and create user
        const passwordHash = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                displayName
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                createdAt: true
            }
        });
        // Generate token
        const jwtSecret = process.env.JWT_TOKEN || 'hockey-analytics-super-secret-key-2025-production-change-this';
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
        return res.status(201).json({
            data: {
                user,
                token
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Verify password
        const isValidPassword = await (0, auth_1.comparePassword)(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Update last login
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Generate token
        const jwtSecret = process.env.JWT_TOKEN || 'hockey-analytics-super-secret-key-2025-production-change-this';
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
        return res.json({
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user profile
router.get('/me', auth_2.authenticateToken, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                createdAt: true,
                lastLoginAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth-simple.js.map
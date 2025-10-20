"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const auth_simple_1 = __importDefault(require("./routes/auth-simple"));
const teams_1 = __importDefault(require("./routes/teams"));
const players_1 = __importDefault(require("./routes/players"));
const games_1 = __importDefault(require("./routes/games"));
const shots_1 = __importDefault(require("./routes/shots"));
const goals_1 = __importDefault(require("./routes/goals"));
const faceoffs_1 = __importDefault(require("./routes/faceoffs"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://hockey-analyst.vercel.app',
        'https://*.vercel.app',
        process.env.FRONTEND_URL || 'https://hockey-analyst.vercel.app'
    ],
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_simple_1.default);
app.use('/api/teams', auth_1.authenticateToken, teams_1.default);
app.use('/api/players', auth_1.authenticateToken, players_1.default);
app.use('/api/games', auth_1.authenticateToken, games_1.default);
app.use('/api/shots', auth_1.authenticateToken, shots_1.default);
app.use('/api/goals', auth_1.authenticateToken, goals_1.default);
app.use('/api/faceoffs', auth_1.authenticateToken, faceoffs_1.default);
app.use('/api/analytics', auth_1.authenticateToken, analytics_1.default);
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
console.log('=== BACKEND DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('Should start server:', process.env.NODE_ENV !== 'production' && !process.env.VERCEL);
console.log('=====================');
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, async () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Hockey Analytics API ready`);
        try {
            await prisma.$connect();
            console.log('✅ Database connected successfully');
            console.log('JWT_TOKEN from env:', process.env.JWT_TOKEN ? 'Set' : 'Not set');
            console.log('All env vars with JWT:', Object.keys(process.env).filter(key => key.includes('JWT')));
            console.log('TEST_VAR from env:', process.env.TEST_VAR ? 'Set' : 'Not set');
            console.log('All env vars:', Object.keys(process.env).sort());
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
        }
    });
    process.on('SIGINT', async () => {
        console.log('Shutting down gracefully...');
        await prisma.$disconnect();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('Shutting down gracefully...');
        await prisma.$disconnect();
        process.exit(0);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map
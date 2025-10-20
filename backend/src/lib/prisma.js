"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Ensure environment variables are loaded from the correct path
const envPath = path_1.default.resolve(__dirname, '../../.env');
dotenv_1.default.config({ path: envPath });
// Set the DATABASE_URL in process.env if it's not already set
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_lGg6IK4NCOoh@ep-wispy-dew-adwcxeen-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
}
// Force override to use Neon database
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_lGg6IK4NCOoh@ep-wispy-dew-adwcxeen-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
// Debug: Log the DATABASE_URL to verify it's loaded
console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DATABASE_URL value:', process.env.DATABASE_URL);
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=prisma.js.map
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded from the correct path
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Set the DATABASE_URL in process.env if it's not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/hockey_analytics';
}

// Debug: Log the DATABASE_URL to verify it's loaded
console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DATABASE_URL value:', process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

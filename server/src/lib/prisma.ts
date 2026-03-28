/// <reference types="node" />
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

const adapter = new PrismaNeon({ connectionString });

// Initialize PrismaClient
// In Prisma 7, we explicitly pass the DATABASE_URL to the constructor 
// since it is now managed via prisma.config.js for the CLI.
// @ts-ignore — Prisma 7 config-first type workaround
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;

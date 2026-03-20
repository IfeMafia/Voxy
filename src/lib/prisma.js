import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton
 * Ensures only one connection pool is created in development (Next.js hot reloading)
 */

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;

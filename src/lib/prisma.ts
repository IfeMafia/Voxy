import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const connectionString = process.env.DATABASE_URL;

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
  });

pool.on('error', (err) => {
  console.warn('[pg.Pool] Connection dropped or idle client error (auto-recovering):', err.message);
});

const adapter = new PrismaPg(pool);

function createPrismaClient(): PrismaClient {
  const options: any = {
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    __internal: {
      configOverride: (config: any) => ({
        ...config,
        dirname: config?.dirname || process.cwd(),
        relativePath: config?.relativePath ?? '',
      }),
    },
  };

  try {
    return new PrismaClient(options);
  } catch (err: any) {
    console.warn('[Prisma] Adapter initialization failed, falling back to standard client:', err?.message || err);
    delete options.adapter;
    return new PrismaClient(options);
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}


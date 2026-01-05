import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Create Prisma Client instance
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

// Log info
prisma.$on('info', (e: any) => {
  logger.info(`Prisma Info: ${e.message}`);
});

// Log warnings
prisma.$on('warn', (e: any) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

// Test database connection
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Disconnect from database
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

export default prisma;

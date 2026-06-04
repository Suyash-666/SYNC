const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
    // eslint-disable-next-line global-require
    const logger = require('../utils/logger');
    logger.info('Prisma client created (dev)');
  }
  prisma = global.__prisma;
}

module.exports = prisma;

import { PrismaClient } from '@prisma/client';

// P7.2: Prevenir falha de build quando DATABASE_URL não está disponível
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  // Define um valor dummy apenas para passar na fase de compilação/coleta do Next.js
  process.env.DATABASE_URL = "mysql://dummy:dummy@localhost:3306/dummy";
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
    errorFormat: 'minimal',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

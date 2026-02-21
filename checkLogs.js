const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const logs = await prisma.auditLog.findMany({
            take: 10,
            orderBy: { created_at: 'desc' }
        });
        console.log(JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

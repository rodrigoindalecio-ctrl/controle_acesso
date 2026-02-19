const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRawUnsafe('DESCRIBE user_events');
        console.log('Columns in user_events:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.log('Could not describe table (maybe not MySQL or table missing):', e.message);
        try {
            const sqliteResult = await prisma.$queryRawUnsafe('PRAGMA table_info(user_events)');
            console.log('Columns in user_events (SQLite):', JSON.stringify(sqliteResult, null, 2));
        } catch (e2) {
            console.log('Could not describe table (SQLite):', e2.message);
        }
    }
    await prisma.$disconnect();
}

main().catch(console.error);

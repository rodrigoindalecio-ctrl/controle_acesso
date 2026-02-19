const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

let dbUrl = '';
try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const match = envLocal.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
} catch (e) {
    try {
        const env = fs.readFileSync('.env', 'utf8');
        const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
        if (match) dbUrl = match[1];
    } catch (e2) { }
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    }
});

async function main() {
    console.log('Starting DB cleanup for user_events...');
    try {
        // Drop foreign keys first
        console.log('Dropping redundant foreign keys...');
        await prisma.$executeRawUnsafe('ALTER TABLE user_events DROP FOREIGN KEY fk_user_event_user');
        await prisma.$executeRawUnsafe('ALTER TABLE user_events DROP FOREIGN KEY fk_user_event_event');

        // Drop columns
        console.log('Dropping redundant columns...');
        await prisma.$executeRawUnsafe('ALTER TABLE user_events DROP COLUMN user_id');
        await prisma.$executeRawUnsafe('ALTER TABLE user_events DROP COLUMN event_id');

        console.log('✅ Cleanup successful!');
    } catch (e) {
        console.error('Error during cleanup:', e.message);
    }
    await prisma.$disconnect();
}

main().catch(console.error);

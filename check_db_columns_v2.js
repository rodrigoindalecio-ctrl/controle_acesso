const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

let dbUrl = '';
try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const match = envLocal.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
} catch (e) {
    // try .env
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
    console.log('Using DB URL (host):', dbUrl.split('@')[1] || dbUrl);
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

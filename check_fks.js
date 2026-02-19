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
    try {
        const fks = await prisma.$queryRawUnsafe(`
      SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE 
        TABLE_SCHEMA = 'u548517320_controleacesso' AND 
        REFERENCED_TABLE_NAME IS NOT NULL AND
        TABLE_NAME = 'user_events';
    `);
        console.log('Foreign Keys in user_events:', JSON.stringify(fks, null, 2));
    } catch (e) {
        console.error(e);
    }
    await prisma.$disconnect();
}

main().catch(console.error);

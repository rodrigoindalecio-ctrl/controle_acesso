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
        const userCols = await prisma.$queryRawUnsafe('DESCRIBE users');
        console.log('Columns in users:', JSON.stringify(userCols, null, 2));

        const users = await prisma.user.findMany();
        console.log('Current users:', users.map(u => ({ id: u.id, email: u.email })));
    } catch (e) {
        console.error(e);
    }
    await prisma.$disconnect();
}

main().catch(console.error);

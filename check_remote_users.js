const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('Connecting to:', process.env.DATABASE_URL.split('@')[1]); // Log host part only
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`));
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

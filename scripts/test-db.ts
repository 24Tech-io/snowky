
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Testing database connection...');
        const userCount = await prisma.user.count();
        console.log('Successfully connected to database!');
        console.log(`Found ${userCount} users.`);
    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

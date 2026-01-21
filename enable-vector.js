const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Enabling vector extension...");
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
        console.log("Vector extension enabled successfully!");
    } catch (e) {
        console.error("Failed to enable vector extension:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

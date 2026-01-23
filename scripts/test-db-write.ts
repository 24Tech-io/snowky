
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database WRITE permission...');
    try {
        // 1. Find a project
        const project = await prisma.project.findFirst();
        if (!project) {
            console.log('No project found. Creating a test project...');
            const newProject = await prisma.project.create({
                data: {
                    name: 'DB Health Check Project',
                    ownerId: (await prisma.user.findFirst().then(u => u?.id ?? "default-id")),
                    // status: 'active', // Removed as it is not in schema
                    // Add other required fields if necessary based on schema, but schema mostly has defaults
                }
            });
            console.log('Created test project:', newProject.id);
        } else {
            console.log('Found existing project:', project.id);

            // 2. Try to create a dummy document
            console.log('Attempting to create a test document...');
            const doc = await prisma.document.create({
                data: {
                    name: 'Health Check Doc',
                    type: 'text',
                    content: 'This is a test content to verify DB writes.',
                    projectId: project.id,
                    embeddingStatus: 'complete'
                }
            });
            console.log('Successfully created document:', doc.id);

            // 3. Clean up
            console.log('Cleaning up test document...');
            await prisma.document.delete({ where: { id: doc.id } });
            console.log('Cleanup successful.');
        }

    } catch (error) {
        console.error('Database WRITE failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

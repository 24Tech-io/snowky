
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany();
    console.log(`Found ${projects.length} projects.`);
    console.table(projects);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

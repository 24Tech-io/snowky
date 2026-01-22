import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });

// Enable connection retry for serverless databases
prisma.$connect().catch((e) => {
    console.error("Initial Prisma connection failed, will retry on first query:", e.message);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

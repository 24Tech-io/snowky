import { geminiModel } from "./gemini";
import { prisma } from "@/lib/prisma";

// Generate embedding for text using Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const result = await geminiModel.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error("Failed to generate embedding");
    }
}

// Search for similar vectors
export async function searchVectors(projectId: string, queryText: string, limit: number = 5) {
    // 1. Generate embedding for query
    const vector = await generateEmbedding(queryText);
    const vectorStr = `[${vector.join(",")}]`;

    // 2. Search DB using pgvector
    // We use a raw query because Prisma doesn't support vector search natively in JS client yet
    const results = await prisma.$queryRaw`
        SELECT 
            "id", 
            "content", 
            "documentId",
            1 - ("vector" <=> ${vectorStr}::vector) as similarity
        FROM "Embedding"
        WHERE "documentId" IN (
            SELECT "id" FROM "Document" WHERE "projectId" = ${projectId}
        )
        ORDER BY similarity DESC
        LIMIT ${limit};
    `;

    return results as Array<{ id: string; content: string; documentId: string; similarity: number }>;
}

// Store a new embedding
export async function storeEmbedding(documentId: string, content: string, vector: number[]) {
    // We also use raw query for insertion due to vector type casting
    const vectorStr = `[${vector.join(",")}]`;

    await prisma.$executeRaw`
        INSERT INTO "Embedding" ("id", "documentId", "content", "vector", "createdAt")
        VALUES (
            gen_random_uuid(), 
            ${documentId}, 
            ${content}, 
            ${vectorStr}::vector, 
            NOW()
        );
    `;
}

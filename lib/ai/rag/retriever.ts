import { prisma } from '@/lib/prisma';
import { gemini } from '../gemini-client';

export interface RetrievalConfig {
    topK: number;
    threshold: number;
    useHybridSearch: boolean;
    semanticWeight: number;
    includeMetadata: boolean;
}

export interface RetrievedChunk {
    id: string;
    documentId: string;
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
    documentTitle?: string;
    // Mapped from SQL
    semantic_score?: number;
    keyword_score?: number;
}

const defaultConfig: RetrievalConfig = {
    topK: 5,
    threshold: 0.7,
    useHybridSearch: true,
    semanticWeight: 0.7,
    includeMetadata: true,
};

export async function retrieveRelevantChunks(
    query: string,
    projectId: string,
    config: Partial<RetrievalConfig> = {}
): Promise<RetrievedChunk[]> {
    const cfg = { ...defaultConfig, ...config };

    // Generate query embedding
    const queryEmbedding = await gemini.generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    let chunks: RetrievedChunk[];

    try {
        if (cfg.useHybridSearch) {
            chunks = await hybridSearch(
                embeddingString,
                query,
                projectId,
                cfg
            );
        } else {
            chunks = await semanticSearch(
                embeddingString,
                projectId,
                cfg
            );
        }
    } catch (error) {
        console.error('Retrieval error, falling back to basic semantic:', error);
        // Fallback if hybrid fails (e.g. missing extension functions)
        chunks = await semanticSearch(embeddingString, projectId, cfg);
    }

    // Optionally fetch document titles
    if (cfg.includeMetadata && chunks.length > 0) {
        const documentIds = [...new Set(chunks.map(c => c.documentId))];
        const documents = await prisma.document.findMany({
            where: { id: { in: documentIds } },
            select: { id: true, name: true }, // name maps to title
        });

        const docMap = new Map(documents.map(d => [d.id, d.name]));
        chunks = chunks.map(c => ({
            ...c,
            documentTitle: docMap.get(c.documentId),
        }));
    }

    return chunks;
}

async function semanticSearch(
    embeddingString: string,
    projectId: string,
    config: RetrievalConfig
): Promise<RetrievedChunk[]> {
    const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT
      dc.id,
      dc."documentId" as "documentId",
      dc.content,
      dc.metadata,
      1 - (dc.embedding <=> ${embeddingString}::vector) AS similarity
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE d."projectId" = ${projectId}
      AND d.status = 'READY'
      AND dc.embedding IS NOT NULL
      AND 1 - (dc.embedding <=> ${embeddingString}::vector) > ${config.threshold}
    ORDER BY dc.embedding <=> ${embeddingString}::vector
    LIMIT ${config.topK}
  `;

    return results;
}

async function hybridSearch(
    embeddingString: string,
    queryText: string,
    projectId: string,
    config: RetrievalConfig
): Promise<RetrievedChunk[]> {
    // Use the hybrid_search function we created in the migration
    // Note: prisma raw query requires specific typing or casting
    const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT * FROM hybrid_search(
      ${embeddingString}::vector,
      ${queryText},
      ${projectId},
      ${config.semanticWeight},
      ${config.topK}
    )
  `;

    return results.map(r => ({
        ...r,
        similarity: (r as any).combined_score || r.similarity || 0,
    }));
}

// Advanced: Query expansion for better retrieval
export async function expandQuery(query: string): Promise<string[]> {
    const expansionPrompt = `Given the following query, generate 2-3 alternative phrasings that capture the same intent. Return only the alternatives, one per line.

Query: "${query}"

Alternatives:`;

    const { text } = await gemini.generateResponse(expansionPrompt, {
        temperature: 0.3,
        maxTokens: 150,
    });

    const alternatives = text
        .split('\n')
        .map(line => line.replace(/^[-*\d.)\s]+/, '').trim())
        .filter(line => line.length > 0);

    return [query, ...alternatives];
}

// Multi-query retrieval for comprehensive results
export async function multiQueryRetrieval(
    query: string,
    projectId: string,
    config: Partial<RetrievalConfig> = {}
): Promise<RetrievedChunk[]> {
    const queries = await expandQuery(query);

    const allChunks: RetrievedChunk[] = [];
    const seenIds = new Set<string>();

    for (const q of queries) {
        const chunks = await retrieveRelevantChunks(q, projectId, config);
        for (const chunk of chunks) {
            if (!seenIds.has(chunk.id)) {
                seenIds.add(chunk.id);
                allChunks.push(chunk);
            }
        }
    }

    // Re-rank by original query similarity
    // This is a simplified re-rank. Ideally we'd use a cross-encoder.
    // Here we just re-verify distance to original query.

    // We can't easily re-calculate vector distance without fetching vectors (expensive)
    // So we assume the chunks found are good, and just sort by their original retrieved score if available, or just keeping them.
    // Better approach: Calculate similarity of chunk content to original query using embedding? No, too slow.

    // For MVP, just return unique chunks sorted by existing similarity
    allChunks.sort((a, b) => b.similarity - a.similarity);

    return allChunks.slice(0, config.topK || 5);
}

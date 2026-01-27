import { prisma } from '@/lib/prisma';
import { gemini } from '@/lib/ai/gemini-client';
import { chunkDocument, Chunk } from './chunker';
import { parseDocument, DocumentSource } from './parser';

export interface ProcessingResult {
    documentId: string;
    status: 'success' | 'failed';
    chunksCreated: number;
    totalTokens: number;
    error?: string;
}

export async function processDocument(documentId: string): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
        // 1. Get document
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new Error('Document not found');
        }

        // 2. Update status to processing
        await prisma.document.update({
            where: { id: documentId },
            data: { status: 'PROCESSING' },
        });

        // 3. Parse document content
        let content = document.content;

        // Logic to fetch content if it's a file path or URL but not currently loaded
        // For MVP, we assume content is already text or needs simple parsing
        // If type requires fetch (like URL), we do it here if content is empty or sourceUrl exists
        if (document.type === 'URL' || document.type === 'URL_SCRAPE') {
            const parsed = await parseDocument(document.name, 'URL_SCRAPE'); // Assuming name implies URL for now or stored elsewhere
            content = parsed.content;
        }
        // If we rely on stored content, we just use it.
        // The previous plan had fileUrl logic, but we might keep it simple for now.

        // 4. Clean and preprocess
        const cleanedContent = preprocessContent(content);

        // 5. Chunk the document
        const chunks = chunkDocument(cleanedContent, {
            strategy: 'semantic',
            chunkSize: 500,
            chunkOverlap: 50,
        });

        // 6. Generate embeddings in batches
        const batchSize = 10;
        const embeddedChunks: Array<Chunk & { embedding: number[] }> = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const texts = batch.map(c => c.content);

            const embeddings = await gemini.generateEmbeddings(texts);

            for (let j = 0; j < batch.length; j++) {
                embeddedChunks.push({
                    ...batch[j],
                    embedding: embeddings[j],
                });
            }

            // Small delay to respect rate limits if needed
            if (i + batchSize < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // 7. Store chunks with embeddings using raw SQL for vector type
        for (const chunk of embeddedChunks) {
            const embeddingString = `[${chunk.embedding.join(',')}]`;

            await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (
          "id", "documentId", "content", "chunkIndex", "tokenCount", "metadata", "embedding", "createdAt"
        ) VALUES (
          gen_random_uuid(),
          ${documentId},
          ${chunk.content},
          ${chunk.index},
          ${chunk.tokenCount},
          ${JSON.stringify(chunk.metadata)}::jsonb,
          ${embeddingString}::vector,
          NOW()
        )
      `;
        }

        // 8. Calculate total tokens
        const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);

        // 9. Update document status
        await prisma.document.update({
            where: { id: documentId },
            data: {
                status: 'READY',
                chunkCount: chunks.length,
                tokenCount: totalTokens,
                processedAt: new Date(),
                content: cleanedContent, // Store cleaned version
            },
        });

        console.log(`Document ${documentId} processed in ${Date.now() - startTime}ms`);

        return {
            documentId,
            status: 'success',
            chunksCreated: chunks.length,
            totalTokens,
        };

    } catch (error) {
        console.error(`Error processing document ${documentId}:`, error);

        await prisma.document.update({
            where: { id: documentId },
            data: {
                status: 'FAILED',
                embeddingError: error instanceof Error ? error.message : 'Unknown error',
            },
        });

        return {
            documentId,
            status: 'failed',
            chunksCreated: 0,
            totalTokens: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

function preprocessContent(content: string): string {
    if (!content) return '';
    return content
        // Normalize whitespace
        .replace(/\r\n/g, '\n')
        .replace(/\t/g, '  ')
        // Remove excessive blank lines
        .replace(/\n{3,}/g, '\n\n')
        // Remove special characters that might confuse the model (optional, standard unicode is usually fine)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize quotes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Trim
        .trim();
}

// Batch processing for multiple documents
export async function processDocumentBatch(
    documentIds: string[],
    concurrency: number = 3
): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (let i = 0; i < documentIds.length; i += concurrency) {
        const batch = documentIds.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(id => processDocument(id))
        );
        results.push(...batchResults);
    }

    return results;
}

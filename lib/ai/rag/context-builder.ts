import { RetrievedChunk } from './retriever';
import { ProjectSettings } from '@prisma/client';

export interface ContextConfig {
    maxContextTokens: number;
    format: 'markdown' | 'plain';
}

const defaultConfig: ContextConfig = {
    maxContextTokens: 4000,
    format: 'markdown',
};

export class ContextBuilder {
    private chunks: RetrievedChunk[] = [];
    private history: { role: string; content: string }[] = [];

    constructor(private config: Partial<ContextConfig> = {}) { }

    addChunks(chunks: RetrievedChunk[]) {
        this.chunks.push(...chunks);
        return this;
    }

    addHistory(history: { role: string; content: string }[]) {
        this.history = history;
        return this;
    }

    build(settings?: ProjectSettings): string {
        const cfg = { ...defaultConfig, ...this.config };

        // Sort chunks by similarity if not already
        const sortedChunks = [...this.chunks].sort((a, b) => b.similarity - a.similarity);

        let currentTokens = 0;
        const contextParts: string[] = [];

        // Format chunks
        for (let i = 0; i < sortedChunks.length; i++) {
            const chunk = sortedChunks[i];
            const chunkContent = this.formatChunk(chunk, i + 1);
            const chunkTokens = Math.ceil(chunkContent.length / 4); // Estimator

            if (currentTokens + chunkTokens > cfg.maxContextTokens) {
                break;
            }

            contextParts.push(chunkContent);
            currentTokens += chunkTokens;
        }

        if (contextParts.length === 0) {
            return '';
        }

        return `
CONTEXT FROM KNOWLEDGE BASE:
The following information has been retrieved from the project's documents. Use this information to answer the user's question.

${contextParts.join('\n\n')}

END OF CONTEXT
`;
    }

    private formatChunk(chunk: RetrievedChunk, index: number): string {
        const source = chunk.documentTitle || chunk.documentId;
        return `[Source ${index}: ${source}]\n${chunk.content}`;
    }
}

// Helper to quickly build context string
export function buildContext(
    chunks: RetrievedChunk[],
    maxTokens: number = 4000
): string {
    return new ContextBuilder({ maxContextTokens: maxTokens })
        .addChunks(chunks)
        .build();
}

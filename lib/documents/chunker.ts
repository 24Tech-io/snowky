export interface ChunkingConfig {
    strategy: 'fixed' | 'semantic' | 'sliding' | 'hierarchical';
    chunkSize: number;      // Target tokens per chunk
    chunkOverlap: number;   // Overlap between chunks
    minChunkSize: number;   // Minimum chunk size
}

export interface Chunk {
    content: string;
    index: number;
    tokenCount: number;
    metadata: {
        startChar: number;
        endChar: number;
        section?: string;
        pageNumber?: number;
    };
}

const defaultConfig: ChunkingConfig = {
    strategy: 'semantic',
    chunkSize: 500,
    chunkOverlap: 50,
    minChunkSize: 100,
};

// Approximate token count (4 chars ≈ 1 token for English)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export function chunkDocument(
    content: string,
    config: Partial<ChunkingConfig> = {}
): Chunk[] {
    const cfg = { ...defaultConfig, ...config };

    switch (cfg.strategy) {
        case 'semantic':
            return semanticChunking(content, cfg);
        case 'sliding':
            return slidingWindowChunking(content, cfg);
        case 'hierarchical':
            return hierarchicalChunking(content, cfg);
        case 'fixed':
        default:
            return fixedSizeChunking(content, cfg);
    }
}

function fixedSizeChunking(content: string, config: ChunkingConfig): Chunk[] {
    const chunks: Chunk[] = [];
    const words = content.split(/\s+/);
    const wordsPerChunk = Math.floor(config.chunkSize * 4 / 5); // Approximate
    const overlapWords = Math.floor(config.chunkOverlap * 4 / 5);

    let currentIndex = 0;
    let chunkIndex = 0;

    while (currentIndex < words.length) {
        const chunkWords = words.slice(currentIndex, currentIndex + wordsPerChunk);
        const chunkContent = chunkWords.join(' ');

        if (estimateTokens(chunkContent) >= config.minChunkSize) {
            chunks.push({
                content: chunkContent,
                index: chunkIndex++,
                tokenCount: estimateTokens(chunkContent),
                metadata: {
                    startChar: content.indexOf(chunkWords[0]),
                    endChar: content.indexOf(chunkWords[chunkWords.length - 1]) + chunkWords[chunkWords.length - 1].length,
                },
            });
        }

        currentIndex += wordsPerChunk - overlapWords;
    }

    return chunks;
}

function semanticChunking(content: string, config: ChunkingConfig): Chunk[] {
    const chunks: Chunk[] = [];

    // Split by semantic boundaries (paragraphs, sections)
    const sections = content.split(/\n\n+/);

    let currentChunk = '';
    let chunkIndex = 0;
    let startChar = 0;

    for (const section of sections) {
        const sectionTokens = estimateTokens(section);
        const currentTokens = estimateTokens(currentChunk);

        // If section itself is too large, split it
        if (sectionTokens > config.chunkSize) {
            // Flush current chunk
            if (currentChunk.trim()) {
                chunks.push({
                    content: currentChunk.trim(),
                    index: chunkIndex++,
                    tokenCount: estimateTokens(currentChunk),
                    metadata: { startChar, endChar: startChar + currentChunk.length },
                });
                currentChunk = '';
            }

            // Split large section by sentences
            const sentences = section.match(/[^.!?]+[.!?]+/g) || [section];
            let sectionChunk = '';

            for (const sentence of sentences) {
                if (estimateTokens(sectionChunk + sentence) > config.chunkSize) {
                    if (sectionChunk.trim()) {
                        chunks.push({
                            content: sectionChunk.trim(),
                            index: chunkIndex++,
                            tokenCount: estimateTokens(sectionChunk),
                            metadata: { startChar: content.indexOf(sectionChunk), endChar: content.indexOf(sectionChunk) + sectionChunk.length },
                        });
                    }
                    sectionChunk = sentence;
                } else {
                    sectionChunk += sentence;
                }
            }

            if (sectionChunk.trim()) {
                currentChunk = sectionChunk;
                startChar = content.indexOf(sectionChunk);
            }
        }
        // If adding section exceeds limit, flush and start new
        else if (currentTokens + sectionTokens > config.chunkSize) {
            if (currentChunk.trim()) {
                chunks.push({
                    content: currentChunk.trim(),
                    index: chunkIndex++,
                    tokenCount: estimateTokens(currentChunk),
                    metadata: { startChar, endChar: startChar + currentChunk.length },
                });
            }
            currentChunk = section;
            startChar = content.indexOf(section);
        }
        // Otherwise, add to current chunk
        else {
            currentChunk += (currentChunk ? '\n\n' : '') + section;
        }
    }

    // Flush remaining
    if (currentChunk.trim() && estimateTokens(currentChunk) >= config.minChunkSize) {
        chunks.push({
            content: currentChunk.trim(),
            index: chunkIndex++,
            tokenCount: estimateTokens(currentChunk),
            metadata: { startChar, endChar: startChar + currentChunk.length },
        });
    }

    return chunks;
}

function slidingWindowChunking(content: string, config: ChunkingConfig): Chunk[] {
    const chunks: Chunk[] = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

    let chunkIndex = 0;
    let windowStart = 0;

    while (windowStart < sentences.length) {
        let windowEnd = windowStart;
        let currentContent = '';

        // Expand window until we hit the limit
        while (windowEnd < sentences.length) {
            const nextContent = currentContent + sentences[windowEnd];
            if (estimateTokens(nextContent) > config.chunkSize) break;
            currentContent = nextContent;
            windowEnd++;
        }

        if (currentContent.trim() && estimateTokens(currentContent) >= config.minChunkSize) {
            chunks.push({
                content: currentContent.trim(),
                index: chunkIndex++,
                tokenCount: estimateTokens(currentContent),
                metadata: {
                    startChar: content.indexOf(sentences[windowStart]),
                    endChar: content.indexOf(sentences[windowEnd - 1]) + sentences[windowEnd - 1].length,
                },
            });
        }

        // Slide window by overlap amount
        const slideAmount = Math.max(1, Math.floor((windowEnd - windowStart) * (1 - config.chunkOverlap / config.chunkSize)));
        windowStart += slideAmount;
    }

    return chunks;
}

function hierarchicalChunking(content: string, config: ChunkingConfig): Chunk[] {
    // For hierarchical, we create parent chunks and child chunks
    // Parent chunks provide broader context, child chunks for precise retrieval

    const chunks: Chunk[] = [];
    const sections = content.split(/\n#{1,3}\s+/); // Split by headers

    let chunkIndex = 0;

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (!section.trim()) continue;

        const sectionTokens = estimateTokens(section);

        // Create parent chunk (larger context)
        if (sectionTokens > config.minChunkSize) {
            // If section is within limits, use as-is
            if (sectionTokens <= config.chunkSize * 1.5) {
                chunks.push({
                    content: section.trim(),
                    index: chunkIndex++,
                    tokenCount: sectionTokens,
                    metadata: {
                        startChar: content.indexOf(section),
                        endChar: content.indexOf(section) + section.length,
                        section: `section_${i}`,
                    },
                });
            } else {
                // Split large sections into smaller chunks
                const subChunks = semanticChunking(section, config);
                for (const subChunk of subChunks) {
                    chunks.push({
                        ...subChunk,
                        index: chunkIndex++,
                        metadata: {
                            ...subChunk.metadata,
                            section: `section_${i}`,
                        },
                    });
                }
            }
        }
    }

    return chunks;
}

export type DocumentSource = 'pdf' | 'docx' | 'txt' | 'url' | 'qa';

export interface ParsedDocument {
    content: string;
    metadata?: Record<string, any>;
}

export async function parseDocument(
    source: string,
    type: string | DocumentSource
): Promise<ParsedDocument> {
    // Map legacy 'type' string to DocumentSource enum if needed
    const sourceType = normalizeSourceType(type);

    try {
        switch (sourceType) {
            case 'UPLOAD_TEXT':
            case 'MANUAL_ENTRY':
                return { content: source };

            case 'URL_SCRAPE':
                return parseUrl(source);

            case 'UPLOAD_PDF':
                // For MVP, we might need a PDF library. 
                // If 'source' is a file path:
                return { content: `[PDF Parsing Not Implemented Yet for: ${source}]` };

            default:
                return { content: source };
        }
    } catch (error) {
        console.error('Error parsing document:', error);
        throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function parseUrl(url: string): Promise<ParsedDocument> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        // Basic HTML stripping (replace with cheerio or similar for robust parsing)
        const content = html.replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return {
            content,
            metadata: { source: url }
        };
    } catch (error) {
        throw new Error(`Failed to fetch URL: ${url}`);
    }
}

function normalizeSourceType(type: string | DocumentSource): string {
    if (typeof type === 'string') {
        const upper = type.toUpperCase();
        if (upper === 'PDF') return 'UPLOAD_PDF';
        if (upper === 'TXT' || upper === 'TEXT') return 'UPLOAD_TEXT';
        if (upper === 'URL') return 'URL_SCRAPE';
        return upper;
    }
    return type;
}

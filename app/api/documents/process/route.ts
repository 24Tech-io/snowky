import { NextResponse } from 'next/server';
import { processDocument, processDocumentBatch } from '@/lib/documents/processor';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { documentId, documentIds } = body;

        if (!documentId && !documentIds) {
            return NextResponse.json(
                { error: 'Missing documentId or documentIds' },
                { status: 400 }
            );
        }

        // Validate if user has access to these documents (TODO: Add Auth check)
        // For now assuming internal API or protected by middleware

        let results;
        if (documentIds && Array.isArray(documentIds)) {
            results = await processDocumentBatch(documentIds);
        } else {
            const result = await processDocument(documentId);
            results = [result];
        }

        const failed = results.filter(r => r.status === 'failed');
        if (failed.length > 0) {
            return NextResponse.json({
                message: 'Some documents failed to process',
                results,
            }, { status: 207 }); // Multi-status
        }

        return NextResponse.json({
            message: 'Processing complete',
            results,
        });

    } catch (error) {
        console.error('Document Processing API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

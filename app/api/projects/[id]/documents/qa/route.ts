import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { generateEmbedding, storeEmbedding } from "@/app/lib/vector";

interface QAPair {
    question: string;
    answer: string;
}

// POST - Add Q&A pairs as structured documents
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const { pairs } = await req.json();

        if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
            return NextResponse.json({ error: "Q&A pairs array is required" }, { status: 400 });
        }

        // Validate pairs format
        for (const pair of pairs) {
            if (!pair.question || !pair.answer) {
                return NextResponse.json(
                    { error: "Each pair must have 'question' and 'answer' fields" },
                    { status: 400 }
                );
            }
        }

        // Verify user owns this project
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: payload.userId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        console.log(`[Q&A] Processing ${pairs.length} Q&A pairs for project ${projectId}`);

        // Format Q&A pairs into structured content
        const formattedContent = pairs.map((pair: QAPair, index: number) =>
            `Q${index + 1}: ${pair.question}\nA${index + 1}: ${pair.answer}`
        ).join('\n\n---\n\n');

        // Save as a single document
        const document = await prisma.document.create({
            data: {
                name: `Q&A Pairs (${pairs.length} items)`,
                type: "qa",
                content: formattedContent,
                projectId: projectId
            }
        });

        // Generate embeddings for each Q&A pair separately for better matching
        let embeddedCount = 0;
        const errors: string[] = [];

        for (const pair of pairs as QAPair[]) {
            try {
                // Create embedding for the question-answer pair together
                const qaText = `Question: ${pair.question}\nAnswer: ${pair.answer}`;
                const vector = await generateEmbedding(qaText);
                await storeEmbedding(document.id, qaText, vector);
                embeddedCount++;
            } catch (embErr: any) {
                console.error("[Q&A] Embedding failed for pair:", embErr.message);
                errors.push(embErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            documentId: document.id,
            pairsProcessed: pairs.length,
            embeddingsCreated: embeddedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully added ${pairs.length} Q&A pairs`
        });

    } catch (error: any) {
        console.error("Q&A Pairs Error:", error);
        return NextResponse.json(
            { error: "Failed to add Q&A pairs", details: error.message },
            { status: 500 }
        );
    }
}

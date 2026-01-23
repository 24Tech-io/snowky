import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - List all documents for a project
export async function GET(
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

        // Verify user owns this project
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: payload.userId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get all documents with embedding counts
        const documents = await prisma.document.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { embeddings: true }
                }
            }
        });

        const formattedDocs = documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            contentPreview: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
            contentLength: doc.content.length,
            embeddingCount: doc._count.embeddings,
            embeddingStatus: doc._count.embeddings > 0 ? 'complete' : 'pending',
            createdAt: doc.createdAt.toISOString()
        }));

        return NextResponse.json({ documents: formattedDocs });

    } catch (error: any) {
        console.error("List Documents Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents", details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a specific document
export async function DELETE(
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
        const { searchParams } = new URL(req.url);
        const docId = searchParams.get('docId');

        if (!docId) {
            return NextResponse.json({ error: "Document ID required" }, { status: 400 });
        }

        // Verify user owns this project
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: payload.userId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Delete document (cascades to embeddings due to schema)
        await prisma.document.delete({
            where: { id: docId, projectId }
        });

        return NextResponse.json({ success: true, message: "Document deleted" });

    } catch (error: any) {
        console.error("Delete Document Error:", error);
        return NextResponse.json(
            { error: "Failed to delete document", details: error.message },
            { status: 500 }
        );
    }
}

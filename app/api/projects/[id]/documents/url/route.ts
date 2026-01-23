import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { generateEmbedding, storeEmbedding } from "@/app/lib/vector";

// POST - Scrape content from a URL and add as document
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
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        // Verify user owns this project
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: payload.userId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        console.log(`[URL Scrape] Fetching content from: ${url}`);

        // Fetch the page content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Snowky Bot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
                { status: 400 }
            );
        }

        const html = await response.text();

        // Extract text content from HTML (simple approach - strip tags)
        const textContent = extractTextFromHtml(html);

        if (!textContent || textContent.trim().length < 50) {
            return NextResponse.json(
                { error: "Could not extract meaningful content from the URL" },
                { status: 400 }
            );
        }

        console.log(`[URL Scrape] Extracted ${textContent.length} characters`);

        // Save as document
        const document = await prisma.document.create({
            data: {
                name: `URL: ${parsedUrl.hostname}${parsedUrl.pathname.substring(0, 50)}`,
                type: "url",
                content: textContent.substring(0, 100000), // Limit to 100k chars
                projectId: projectId
            }
        });

        // Generate embeddings in background (non-blocking)
        generateEmbeddingsAsync(document.id, textContent);

        return NextResponse.json({
            success: true,
            documentId: document.id,
            contentLength: textContent.length,
            message: "URL content scraped and saved successfully"
        });

    } catch (error: any) {
        console.error("URL Scrape Error:", error);
        return NextResponse.json(
            { error: "Failed to scrape URL", details: error.message },
            { status: 500 }
        );
    }
}

// Extract text from HTML by stripping tags
function extractTextFromHtml(html: string): string {
    // Remove script and style content
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

// Generate embeddings asynchronously
async function generateEmbeddingsAsync(documentId: string, content: string) {
    try {
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push(content.slice(i, i + chunkSize));
        }

        console.log(`[URL Scrape] Generating embeddings for ${chunks.length} chunks...`);

        for (const chunk of chunks) {
            try {
                const vector = await generateEmbedding(chunk);
                await storeEmbedding(documentId, chunk, vector);
            } catch (embErr) {
                console.error("[URL Scrape] Embedding chunk failed:", embErr);
            }
        }

        console.log(`[URL Scrape] Embeddings complete for document ${documentId}`);
    } catch (error) {
        console.error("[URL Scrape] Embedding generation failed:", error);
    }
}

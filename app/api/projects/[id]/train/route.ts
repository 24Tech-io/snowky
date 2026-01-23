import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, storeEmbedding } from "@/app/lib/vector";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
// @ts-ignore
if (typeof DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require("mammoth");

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        const formData = await req.formData();
        const textInput = formData.get("text") as string | null;

        // Get all files (support multiple file uploads)
        const files = formData.getAll("file") as File[];
        const file = files.length > 0 ? files[0] : null;

        console.log("Train endpoint - projectId:", projectId);
        console.log("Train endpoint - files count:", files.length);
        console.log("Train endpoint - textInput:", textInput ? "yes (" + textInput.length + " chars)" : "no");

        let contentToTrain = "";
        let filename = "Manual Entry";

        if (file && file.size > 0) {
            filename = file.name;
            console.log("Processing file:", filename, "type:", file.type, "size:", file.size);

            const buffer = Buffer.from(await file.arrayBuffer());

            if (file.type === "application/pdf") {
                try {
                    const data = await pdf(buffer);
                    contentToTrain = data.text;
                } catch (pdfError) {
                    console.error("PDF Parse Error:", pdfError);
                    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 400 });
                }
            } else if (
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file.name.endsWith(".docx")
            ) {
                try {
                    const result = await mammoth.extractRawText({ buffer });
                    contentToTrain = result.value;
                } catch (docError) {
                    console.error("DOCX Parse Error:", docError);
                    return NextResponse.json({ error: "Failed to parse DOCX" }, { status: 400 });
                }
            } else {
                // Default to text (txt, md, etc)
                contentToTrain = buffer.toString("utf-8");
            }
        } else if (textInput && textInput.trim()) {
            contentToTrain = textInput;
        }

        if (!contentToTrain || !contentToTrain.trim()) {
            console.log("No content to train - file:", file ? "yes" : "no", "textInput:", textInput ? "yes" : "no");
            return NextResponse.json({
                error: "No text content found in upload",
                debug: {
                    filePresent: !!file,
                    fileSize: file?.size || 0,
                    textInputPresent: !!textInput,
                    textInputLength: textInput?.length || 0
                }
            }, { status: 400 });
        }

        console.log("Content to train:", contentToTrain.substring(0, 100) + "...");

        // 1. Create Document record
        const document = await prisma.document.create({
            data: {
                name: filename,
                type: file ? file.type : "text",
                content: contentToTrain,
                projectId: projectId
            }
        });

        // 2. Chunk text
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < contentToTrain.length; i += chunkSize) {
            chunks.push(contentToTrain.slice(i, i + chunkSize));
        }

        // 3. Generate and store embeddings (Optional/Non-blocking)
        let embeddedChunks = 0;
        let embeddingWarning = null;

        try {
            console.log(`Processing ${chunks.length} chunks for project ${projectId}...`);
            for (const chunk of chunks) {
                const vector = await generateEmbedding(chunk);
                await storeEmbedding(document.id, chunk, vector);
                embeddedChunks++;
            }
        } catch (embeddingError: any) {
            console.error("Embedding generation failed (continuing with raw text only):", embeddingError.message);
            embeddingWarning = "Embedding failed, using raw text fallback. " + embeddingError.message;

            // Update status to failed
            await prisma.document.update({
                where: { id: document.id },
                data: {
                    embeddingStatus: "failed",
                    embeddingError: embeddingError.message
                }
            });
        }

        // If no error, update to complete
        if (!embeddingWarning) {
            await prisma.document.update({
                where: { id: document.id },
                data: {
                    embeddingStatus: "complete"
                }
            });
        }

        return NextResponse.json({
            success: true,
            chunksProcessed: chunks.length,
            embeddedChunks: embeddedChunks,
            documentId: document.id,
            warning: embeddingWarning
        });

    } catch (error: any) {
        console.error("Training Error Details:", {
            message: error.message,
            stack: error.stack,
            projectId: (await params).id
        });
        return NextResponse.json(
            {
                error: "Failed to train data",
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

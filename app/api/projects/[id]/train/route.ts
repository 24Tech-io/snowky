import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, storeEmbedding } from "@/app/lib/vector";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
// @ts-ignore
if (typeof DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}

const pdf = require("pdf-parse");
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
        const file = formData.get("file") as File | null;

        let contentToTrain = "";
        let filename = "Manual Entry";

        if (file) {
            filename = file.name;
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
        } else if (textInput) {
            contentToTrain = textInput;
        }

        if (!contentToTrain || !contentToTrain.trim()) {
            return NextResponse.json({ error: "No text content found in upload" }, { status: 400 });
        }

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

        console.log(`Processing ${chunks.length} chunks for project ${projectId}...`);

        // 3. Generate and store embeddings
        for (const chunk of chunks) {
            const vector = await generateEmbedding(chunk);
            await storeEmbedding(document.id, chunk, vector);
        }

        return NextResponse.json({
            success: true,
            chunksProcessed: chunks.length,
            documentId: document.id
        });

    } catch (error: any) {
        console.error("Training Error:", error);
        return NextResponse.json(
            { error: "Failed to train data", details: error.message },
            { status: 500 }
        );
    }
}

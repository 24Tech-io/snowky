import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { orchestrator } from '@/lib/ai/rag/orchestrator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, projectId, visitorId, sessionId } = body;

        if (!message || !projectId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 0. Fetch Project Settings (Fast PK lookup)
        const settings = await prisma.projectSettings.findUnique({
            where: { projectId },
        });

        if (!settings) {
            return NextResponse.json({ error: 'Project settings not configured' }, { status: 404 });
        }

        // 1. Get or Create Session
        const activeSessionId = sessionId || (await getOrCreateSession(projectId, visitorId));

        // 2. Store User Message
        await prisma.chatMessage.create({
            data: {
                sessionId: activeSessionId,
                role: 'USER',
                content: message,
            },
        });

        // 3. Fetch Conversation History (Conditional)
        let formattedHistory: Array<{ role: 'user' | 'model'; content: string }> = [];

        if (settings.memoryEnabled) {
            // We fetch last N messages to build context
            // Use settings.memoryMaxMessages if available, else default to 10
            const maxMessages = settings.memoryMaxMessages || 10;

            const history = await prisma.chatMessage.findMany({
                where: { sessionId: activeSessionId },
                orderBy: { createdAt: 'desc' }, // Get latest first
                take: maxMessages,
            });

            // Reverse to get chronological order for LLM
            formattedHistory = history.reverse().map(msg => ({
                role: msg.role === 'USER' ? 'user' : 'model', // Gemini format
                content: msg.content,
            }));
        }

        // 4. Process with RAG Orchestrator
        const result = await orchestrator.processQuery({
            projectId,
            message,
            history: formattedHistory,
            visitorId: visitorId || 'anonymous',
        });

        // 5. Store AI Response
        const aiMessage = await prisma.chatMessage.create({
            data: {
                sessionId: activeSessionId,
                role: 'ASSISTANT',
                content: result.text,
                confidence: result.confidence,
                tokensUsed: result.tokensUsed,
                sources: JSON.stringify(result.sources), // Store sources for transparency
                hadContext: result.sources.length > 0,
            },
        });

        // 6. Update Session Stats
        await prisma.widgetSession.update({
            where: { id: activeSessionId },
            data: {
                lastActiveAt: new Date(),
                messageCount: { increment: 2 }, // User + AI
            },
        });

        // 7. Return Response
        return NextResponse.json({
            role: 'assistant',
            content: result.text,
            sessionId: activeSessionId,
            sources: result.sources.map(s => ({ title: s.documentTitle || 'Document', id: s.documentId })),
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

async function getOrCreateSession(projectId: string, visitorId?: string): Promise<string> {
    const vid = visitorId || `anon_${Date.now()}`;

    // Find active session
    const existing = await prisma.widgetSession.findFirst({
        where: {
            projectId,
            visitorId: vid,
            status: 'ACTIVE',
            // Optional: Check if session is expired (e.g. > 24 hours) here
        },
        orderBy: { lastActiveAt: 'desc' },
    });

    if (existing) {
        return existing.id;
    }

    // Create new session
    const newSession = await prisma.widgetSession.create({
        data: {
            projectId,
            visitorId: vid,
            status: 'ACTIVE',
            history: [],
        },
    });

    return newSession.id;
}


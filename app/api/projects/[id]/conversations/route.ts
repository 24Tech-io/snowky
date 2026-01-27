
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: projectId } = await params;

    try {
        // 1. Verify Project Access
        const project = await prisma.project.findUnique({
            where: { id: projectId, ownerId: payload.userId }
        });
        if (!project) return new NextResponse('Forbidden', { status: 403 });

        // 2. Fetch Active Conversations (WidgetSessions)
        // We want sessions that are NOT resolved, sorted by latest update
        const conversations = await prisma.widgetSession.findMany({
            where: {
                projectId,
                resolved: false // Only active chats
            },
            include: {
                contact: true, // Get user details (Name, Email/Phone)
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { lastActiveAt: 'desc' }
        });

        // Formatting for frontend
        const formatted = conversations.map(c => ({
            id: c.id,
            contact: c.contact,
            lastMessageAt: c.lastActiveAt,
            messageCount: c._count.messages,
            // We might want the last message snippet too, but let's keep it simple for now
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

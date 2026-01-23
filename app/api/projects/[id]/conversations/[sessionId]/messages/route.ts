
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ChannelFactory } from '@/lib/channels/factory';
import { ChannelType } from '@/lib/channels/types';

// GET: Fetch Message History
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { sessionId } = await params;


    try {
        const messages = await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' } // Oldest first for chat view
        });

        return NextResponse.json(messages);
    } catch (_error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST: Send Reply (Agent to User)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: projectId, sessionId } = await params;

    const { content } = await req.json();

    try {
        // 1. Get Session & Contact info
        const chatSession = await prisma.widgetSession.findUnique({
            where: { id: sessionId },
            include: { contact: true }
        });

        if (!chatSession || !chatSession.contact) {
            return new NextResponse('Session or Contact not found', { status: 404 });
        }

        // 2. Save "Agent" Message to DB
        const message = await prisma.chatMessage.create({
            data: {
                sessionId: sessionId,
                role: 'agent', // Human agent
                content,
            }
        });

        // 3. Dispatch to Channel (if not a web widget chat)
        // How do we know the channel? 
        // We should ideally store the 'source' or 'channel' on the Session or Contact.
        // For now, let's look at the Contact. If they have a phone, try WhatsApp?
        // Or check the LAST message metadata?

        // Better Approach: Check the last user message metadata for channel info.
        const lastUserMsg = await prisma.chatMessage.findFirst({
            where: { sessionId: sessionId, role: 'user' },
            orderBy: { createdAt: 'desc' }
        });

        const channel = (lastUserMsg?.metadata as any)?.channel as ChannelType;

        if (channel && channel !== 'email') { // Assuming web widget doesn't have 'channel' set or is 'web'
            const configRecord = await prisma.channelConfig.findUnique({
                where: {
                    projectId_type: {
                        projectId,
                        type: channel
                    }
                }
            });

            if (configRecord && configRecord.enabled) {
                const adapter = ChannelFactory.getAdapter(channel);
                // Message 'to': Contact's phone or externalId
                // usage of 'externalId' is safer. We stored it in meta?
                // Or just use contact.phone if channel is whatsapp.
                const to = (lastUserMsg?.metadata as any)?.externalId || chatSession.contact.phone;

                if (to) {
                    await adapter.sendMessage(to, content, configRecord.config);
                }
            }
        }

        return NextResponse.json(message);

    } catch (error: any) {
        console.error('Send error:', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}

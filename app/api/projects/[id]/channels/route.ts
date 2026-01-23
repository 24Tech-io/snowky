
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
        const configs = await prisma.channelConfig.findMany({
            where: { projectId },
            select: {
                id: true,
                type: true,
                enabled: true,
                config: true, // Be careful not to expose extremely sensitive secrets if possible, but user needs to edit them. 
                // For now, sending full config is standard for admin settings.
            }
        });

        return NextResponse.json(configs);
    } catch (_error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new NextResponse("Unauthorized", { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: projectId } = await params;
    const body = await req.json();
    const { type, config, enabled } = body;

    try {
        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, ownerId: payload.userId }
        });
        if (!project) return new NextResponse('Forbidden', { status: 403 });

        const channelConfig = await prisma.channelConfig.upsert({
            where: {
                projectId_type: {
                    projectId,
                    type
                }
            },
            update: {
                config,
                enabled
            },
            create: {
                projectId,
                type,
                config,
                enabled: enabled ?? true
            }
        });

        return NextResponse.json(channelConfig);
    } catch (error) {
        console.error('Failed to save channel config:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

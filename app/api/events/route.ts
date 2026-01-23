
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { projectId, visitorId, type, data } = body;

        if (!projectId || !type) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Rate limiting could be added here to prevent spam

        await prisma.event.create({
            data: {
                projectId,
                visitorId,
                type, // page_view, click, custom
                data: data || {}
            }
        });

        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('Event tracking error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// Enable CORS for this endpoint since it will be called from customer websites
export async function OPTIONS(_req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

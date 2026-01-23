
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - Get analytics data for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return new NextResponse("Unauthorized", { status: 401 });

        const payload = verifyToken(token);
        if (!payload || !payload.userId) return new NextResponse("Unauthorized", { status: 401 });

        const { id: projectId } = await params;
        // 1. Get total page views (Events)
        const totalViews = await prisma.event.count({
            where: { projectId, type: 'page_view' }
        });

        // 2. Get distinct active visitors (last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        // Prisma distinct count workaround (fetch distinct visitorIds)
        const activeVisitors = await prisma.event.groupBy({
            by: ['visitorId'],
            where: {
                projectId,
                createdAt: { gte: fiveMinutesAgo }
            },
            _count: true
        }).then(res => res.length);


        // 3. Get recent logs
        const recentEvents = await prisma.event.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return NextResponse.json({
            totalViews,
            activeVisitors,
            recentEvents
        });

    } catch (error) {
        console.error("Analytics Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - Get analytics data for a project
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

        // Get date range (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get total sessions
        const totalSessions = await prisma.widgetSession.count({
            where: { projectId }
        });

        // Get sessions in last 30 days
        const recentSessions = await prisma.widgetSession.count({
            where: {
                projectId,
                createdAt: { gte: thirtyDaysAgo }
            }
        });

        // Get total messages
        const totalMessages = await prisma.chatMessage.count({
            where: {
                session: { projectId }
            }
        });

        // Get messages without context (unanswered/no data)
        const unansweredMessages = await prisma.chatMessage.count({
            where: {
                session: { projectId },
                hadContext: false,
                role: "user"
            }
        });

        // Get average response time
        const avgResponseTimeResult = await prisma.chatMessage.aggregate({
            where: {
                session: { projectId },
                role: "assistant",
                responseTime: { not: null }
            },
            _avg: { responseTime: true }
        });

        // Get satisfaction ratings
        const ratingsResult = await prisma.widgetSession.aggregate({
            where: {
                projectId,
                rating: { not: null }
            },
            _avg: { rating: true },
            _count: { rating: true }
        });

        // Get top questions (user messages) - get recent ones
        const topQuestions = await prisma.chatMessage.findMany({
            where: {
                session: { projectId },
                role: "user"
            },
            select: { content: true },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        // Get daily stats for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailySessions = await prisma.widgetSession.groupBy({
            by: ["createdAt"],
            where: {
                projectId,
                createdAt: { gte: sevenDaysAgo }
            },
            _count: true
        });

        // Get document stats
        const documentStats = await prisma.document.groupBy({
            by: ["embeddingStatus"],
            where: { projectId },
            _count: true
        });

        // Calculate daily stats
        const dailyStats: { date: string; sessions: number; messages: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];

            const dayStart = new Date(dateStr);
            const dayEnd = new Date(dateStr);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const sessionsCount = await prisma.widgetSession.count({
                where: {
                    projectId,
                    createdAt: { gte: dayStart, lt: dayEnd }
                }
            });

            const messagesCount = await prisma.chatMessage.count({
                where: {
                    session: { projectId },
                    createdAt: { gte: dayStart, lt: dayEnd }
                }
            });

            dailyStats.push({
                date: dateStr,
                sessions: sessionsCount,
                messages: messagesCount
            });
        }

        // Unique questions (simple dedup by content)
        const uniqueQuestions = [...new Set(topQuestions.map(q => q.content))].slice(0, 10);

        // Prepare response
        const analytics = {
            overview: {
                totalSessions,
                recentSessions,
                totalMessages,
                unansweredMessages,
                avgResponseTime: Math.round(avgResponseTimeResult._avg.responseTime || 0),
                satisfactionAvg: ratingsResult._avg.rating ? Number(ratingsResult._avg.rating.toFixed(1)) : null,
                satisfactionCount: ratingsResult._count.rating
            },
            topQuestions: uniqueQuestions,
            dailyStats,
            documentStats: {
                total: documentStats.reduce((acc, d) => acc + d._count, 0),
                synced: documentStats.find(d => d.embeddingStatus === "complete")?._count || 0,
                pending: documentStats.find(d => d.embeddingStatus === "pending")?._count || 0,
                failed: documentStats.find(d => d.embeddingStatus === "failed")?._count || 0
            }
        };

        return NextResponse.json(analytics);

    } catch (error: any) {
        console.error("Analytics Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics", details: error.message },
            { status: 500 }
        );
    }
}

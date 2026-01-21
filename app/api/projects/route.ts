import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
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

        const body = await req.json();

        // Extract top-level fields
        const { name, description, ...rest } = body;

        // Separate settings and theme from the rest of the body
        const settings = {
            tone: rest.tone,
            emojiUsage: rest.emojiUsage,
            botName: rest.botName,
            welcomeMessage: rest.welcomeMessage,
            status: "Active", // Store status in settings
        };

        const theme = {
            theme: rest.theme,
            color: rest.color,
            launcherColor: rest.launcherColor,
            launcherShape: rest.launcherShape,
            chatIcon: rest.chatIcon,
        };

        const project = await prisma.project.create({
            data: {
                name: name || "Untitled Project",
                description: description || "",
                ownerId: payload.userId,
                settings: settings,
                theme: theme,
            }
        });

        return NextResponse.json(project);
    } catch (error: any) {
        console.error("Create Project Error:", error);
        return NextResponse.json(
            { error: "Failed to create project", details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
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

        const projects = await prisma.project.findMany({
            where: { ownerId: payload.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { sessions: true }
                }
            }
        });

        // Transform for frontend
        const formattedProjects = projects.map(p => {
            const settings = p.settings as any;
            const theme = p.theme as any; // Cast to access JSON props

            return {
                id: p.id,
                name: p.name,
                description: p.description,
                status: settings.status || "Active",
                tone: settings.tone || "friendly",
                color: theme.color || "#6366f1",
                theme: theme.theme || "modern",
                messages: p._count.sessions * 5, // Approximate msgs? Or count from messages?
                satisfaction: "100%", // Placeholder
                createdAt: p.createdAt.toISOString()
            };
        });

        return NextResponse.json(formattedProjects);

    } catch (error: any) {
        console.error("Fetch Projects Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects", details: error.message },
            { status: 500 }
        );
    }
}

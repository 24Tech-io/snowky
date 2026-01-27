import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectSettings } from "@prisma/client";
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

        // Create the project with related settings
        // We map the flat "rest" fields to our ProjectSettings schema
        const project = await prisma.project.create({
            data: {
                name: name || "Untitled Project",
                description: description || "",
                ownerId: payload.userId,
                settings: {
                    create: {
                        // General Widget Settings
                        botName: rest.botName || "Snowky AI",
                        showFloatingLauncher: rest.showFloatingLauncher ?? true,
                        welcomeMessage: rest.welcomeMessage || "Hello! How can I help you?",
                        // status: "Active", // Not in schema

                        // Theme Settings
                        // widgetTheme: rest.theme || "modern", // Not in schema
                        widgetColor: rest.color || "#6366f1",
                        // widgetIcon: rest.chatIcon, // Not in schema

                        // AI Configuration
                        // memoryType: rest.memoryType || "conversation", // Not in schema. Default memoryEnabled is true.

                        // Personality
                        responseStyle: rest.tone || "friendly",
                        // emojiUsage: rest.emojiUsage || "medium", // Not in schema. Default useEmojis is true.

                        // Sales
                        // salesMode: rest.salesMode || "informational", // Not in schema. Default salesModeEnabled is false.
                    }
                }
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

export async function GET(_req: Request) {
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

        // Fetch projects with their settings
        const projects = await prisma.project.findMany({
            where: { ownerId: payload.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                settings: true, // Include the settings relation
                _count: {
                    select: { sessions: true }
                }
            }
        });

        console.log(`Fetched ${projects.length} projects. Mapping data...`);

        // Transform for frontend
        const formattedProjects = projects.map(p => {
            try {
                const settings: Partial<ProjectSettings> = p.settings || {};
                const sessionCount = p._count?.sessions || 0;

                return {
                    id: p.id,
                    name: p.name || "Untitled",
                    description: p.description || "",

                    // Flatten settings back to frontend format
                    status: (settings as any).status || "Active",
                    tone: settings.responseStyle || "friendly",
                    color: settings.widgetColor || "#6366f1",
                    theme: "modern",

                    messages: sessionCount * 5, // Mock metric or real if available
                    satisfaction: "100%",
                    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),

                    // Extra fields
                    botName: settings.botName,
                    welcomeMessage: settings.welcomeMessage,
                    showFloatingLauncher: settings.showFloatingLauncher ?? true,
                    // widgetTheme: settings.widgetTheme, // Not in schema
                    widgetColor: settings.widgetColor,
                    // widgetIcon: settings.widgetIcon // Not in schema
                };
            } catch (mapError) {
                console.error("Error mapping project:", p.id, mapError);
                return null;
            }
        }).filter(Boolean); // Remove nulls

        console.log("Mapping complete. Returning response.");

        return NextResponse.json(formattedProjects);

    } catch (error: any) {
        console.error("Fetch Projects Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects", details: error.message },
            { status: 500 }
        );
    }
}

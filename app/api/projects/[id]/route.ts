import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectSettings } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const user = verifyToken(token || "");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                settings: true,
                _count: {
                    select: {
                        sessions: true
                    }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.ownerId !== user.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Flatten settings for frontend
        const settings: Partial<ProjectSettings> = project.settings || {};
        const formattedProject = {
            ...project,
            // Map settings to top level
            status: (settings as any).status || "Active",
            tone: settings.responseStyle || "friendly",
            color: settings.widgetColor || "#6366f1",
            theme: "modern",
            botName: settings.botName,
            welcomeMessage: settings.welcomeMessage,
            showFloatingLauncher: settings.showFloatingLauncher ?? true,
            // Keep original settings object if needed, but flattened is easier
            settings: undefined
        };

        return NextResponse.json(formattedProject);

    } catch (error: any) {
        console.error("Project API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch project", details: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const user = verifyToken(token || "");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Check ownership
        const existing = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!existing || existing.ownerId !== user.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Separate project fields from settings fields
        const { name, description, ...settingsUpdates } = body;

        // Update Project
        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                name,
                description,
                settings: {
                    upsert: {
                        create: {
                            showFloatingLauncher: settingsUpdates.showFloatingLauncher,
                            botName: settingsUpdates.botName,
                            // Add other defaults or fields as needed
                        },
                        update: {
                            // Map incoming fields to schema fields
                            showFloatingLauncher: settingsUpdates.showFloatingLauncher,
                            botName: settingsUpdates.botName,
                            // Allow updating other fields if passed
                            // ...settingsUpdates (be careful with keys)
                        }
                    }
                }
            },
            include: { settings: true }
        });

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error("Project Update Error:", error);
        return NextResponse.json(
            { error: "Failed to update project", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const user = verifyToken(token || "");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.ownerId !== user.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete project (cascade delete should handle related documents/sessions if configured, but explicit is safer for some relations)
        // Prisma schema usually handles cascade if @relation(onDelete: Cascade) is set.
        await prisma.project.delete({
            where: { id: projectId }
        });

        return NextResponse.json({ success: true, message: "Project deleted successfully" });

    } catch (error: any) {
        console.error("Project Delete API Error:", error);
        return NextResponse.json(
            { error: "Failed to delete project", details: error.message },
            { status: 500 }
        );
    }
}

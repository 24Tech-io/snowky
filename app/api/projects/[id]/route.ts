import { NextResponse } from "next/server";

// For now, we'll use localStorage simulation via a simple in-memory store
// In production, this would fetch from a database

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Since this is a server-side API, we can't access localStorage directly
        // For now, return a response that tells the client to fetch from localStorage
        // In production, this would query the database

        return NextResponse.json({
            success: true,
            message: "Use client-side localStorage to fetch project settings",
            projectId: projectId,
            // Default settings (can be overridden by client)
            defaults: {
                tone: "friendly",
                emojiUsage: "medium",
                botName: "Snowky Assistant",
                welcomeMessage: "",
                theme: "modern",
                color: "#6366f1",
                launcherColor: "#6366f1",
                launcherShape: "circle",
                chatIcon: "fas fa-comment-dots"
            }
        });

    } catch (error: any) {
        console.error("Project API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch project", details: error.message },
            { status: 500 }
        );
    }
}

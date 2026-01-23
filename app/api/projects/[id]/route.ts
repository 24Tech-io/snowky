import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

        return NextResponse.json(project);

    } catch (error: any) {
        console.error("Project API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch project", details: error.message },
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

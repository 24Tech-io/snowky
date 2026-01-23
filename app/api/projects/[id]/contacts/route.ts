import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - List contacts
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const user = verifyToken(token || "");

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: projectId } = await params;

        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, ownerId: user.userId }
        });

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        const contacts = await prisma.contact.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { sessions: true, tickets: true }
                }
            }
        });

        return NextResponse.json(contacts);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create contact
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const user = verifyToken(token || "");

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: projectId } = await params;
        const body = await req.json();

        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, ownerId: user.userId }
        });

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        // Check if email exists
        if (body.email) {
            const existing = await prisma.contact.findUnique({
                where: {
                    projectId_email: {
                        projectId,
                        email: body.email
                    }
                }
            });

            if (existing) {
                return NextResponse.json({ error: "Contact with this email already exists" }, { status: 400 });
            }
        }

        const contact = await prisma.contact.create({
            data: {
                projectId,
                name: body.name,
                email: body.email,
                phone: body.phone,
                customFields: body.customFields || {}
            }
        });

        return NextResponse.json(contact);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

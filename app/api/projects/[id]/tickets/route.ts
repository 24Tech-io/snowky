import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - List tickets
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

        const tickets = await prisma.ticket.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' },
            include: {
                contact: { select: { name: true, email: true } },
                _count: { select: { comments: true } }
            }
        });

        return NextResponse.json(tickets);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create ticket
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

        // If contact email is provided, find or create contact
        let contactId = body.contactId;
        if (!contactId && body.contactEmail) {
            let contact = await prisma.contact.findUnique({
                where: {
                    projectId_email: {
                        projectId,
                        email: body.contactEmail
                    }
                }
            });

            if (!contact) {
                contact = await prisma.contact.create({
                    data: {
                        projectId,
                        email: body.contactEmail,
                        name: body.contactName || body.contactEmail.split('@')[0],
                    }
                });
            }
            contactId = contact.id;
        }

        const ticket = await prisma.ticket.create({
            data: {
                projectId,
                subject: body.subject,
                status: body.status || "open",
                priority: body.priority || "medium",
                contactId: contactId
            },
            include: {
                contact: true
            }
        });

        return NextResponse.json(ticket);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

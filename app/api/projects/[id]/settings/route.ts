import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const body = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        // Clean up body - remove non-settings fields if any
        const { id, projectId: pid, ...settingsData } = body;

        // Upsert settings
        const updatedSettings = await prisma.projectSettings.upsert({
            where: { projectId },
            update: settingsData,
            create: {
                projectId,
                ...settingsData,
            },
        });

        return NextResponse.json(updatedSettings);

    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

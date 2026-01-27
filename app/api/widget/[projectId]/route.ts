import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        // Fetch project settings and limited public info
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                settings: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Return only what's needed for the widget
        const widgetConfig = {
            id: project.id,
            name: project.name,
            // Appearance
            color: project.settings?.widgetColor || '#6366f1',
            position: project.settings?.widgetPosition || 'bottom-right',
            buttonText: project.settings?.widgetButtonText || 'Chat',
            welcomeMessage: project.settings?.welcomeMessage || 'Hello!',
            offlineMessage: project.settings?.offlineMessage || 'We are currently offline.',

            // Behavior needed by frontend
            leadCaptureEnabled: project.settings?.leadCaptureEnabled ?? true,
            leadCaptureTiming: project.settings?.leadCaptureTiming || 'natural',

            // Proactive Engagement
            proactiveEngagement: project.settings?.proactiveEngagement ?? false,
            proactiveDelaySeconds: project.settings?.proactiveDelaySeconds || 30,
            proactiveMessage: project.settings?.proactiveMessage || 'Hi! Need any help?',

            // We don't expose internal AI prompts or thresholds here
        };

        return NextResponse.json(widgetConfig);

    } catch (error) {
        console.error('Widget Config API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}


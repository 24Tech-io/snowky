import { prisma } from '@/lib/prisma';
import ChatInterface from './chat-interface';
import { notFound } from 'next/navigation';

export default async function WidgetPage({ params }: { params: { projectId: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.projectId },
        include: { settings: true },
    });

    if (!project) return notFound();

    // Extract public settings
    const settings = {
        widgetColor: project.settings?.widgetColor,
        widgetPosition: project.settings?.widgetPosition,
        widgetButtonText: project.settings?.widgetButtonText,
        welcomeMessage: project.settings?.welcomeMessage,
    };

    return <ChatInterface projectId={params.projectId} settings={settings} />;
}

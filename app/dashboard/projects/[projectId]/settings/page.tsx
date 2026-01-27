import { prisma } from '@/lib/prisma';
import AISettingsForm from '@/components/project/ai-settings-form';
import { notFound } from 'next/navigation';

export default async function ProjectSettingsPage({
    params
}: {
    params: { projectId: string }
}) {
    const { projectId } = params;

    // Fetch project with settings
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            settings: true,
        },
    });

    if (!project) {
        notFound();
    }

    // Use existing settings or empty object (component handles defaults)
    const settings = project.settings || { projectId };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Project AI Settings</h1>
                <p className="text-gray-500 mt-2">
                    Configure how your AI assistant behaves, remembers context, and interacts with visitors.
                </p>
            </div>

            <AISettingsForm settings={settings} projectId={projectId} />
        </div>
    );
}

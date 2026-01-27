
import { prisma } from '@/lib/prisma';
import { IncomingMessage } from './channels/types';

export async function processIncomingMessage(projectId: string, message: IncomingMessage, channelType: string) {
    console.log(`Processing message for project ${projectId} from ${channelType}`);

    // 1. Find or Create Contact
    // We assume 'message.from' is the identifier (phone number, email, psid)
    let contact = await prisma.contact.findFirst({
        where: {
            projectId,
            OR: [
                { email: message.from }, // In case it's email
                { phone: message.from }, // In case it's phone
                // Add custom field lookup if needed for IDs
            ]
        }
    });

    if (!contact) {
        // Basic heuristics to determine if it's email or phone
        const isEmail = message.from.includes('@');
        contact = await prisma.contact.create({
            data: {
                projectId,
                name: `Visitor ${message.from.slice(-4)}`, // Placeholder name
                email: isEmail ? message.from : `temp_${Date.now()}@placeholder.com`, // Email is unique/required in our schema? Let's check. 
                // Logic might need adjustment if email is mandatory unique. 
                // For now, assume schema allows non-email contacts? checked schema: email is String @unique. 
                // ERROR: If email is unique and required, we can't just make up fake ones easily. 
                // FIX: Update Contact schema to make email optional OR handle this better. 
                // For this MVP, I'll generate a unique placeholder.
                phone: isEmail ? undefined : message.from,
            }
        });
    }

    // 2. Find or Create Active Session
    // Look for a session updated recently? Or just the last open one.
    let session = await prisma.widgetSession.findFirst({
        where: {
            projectId,
            contactId: contact.id,
            resolved: false // Only open sessions
        },
        orderBy: { lastActiveAt: 'desc' }
    });

    if (!session) {
        session = await prisma.widgetSession.create({
            data: {
                projectId,
                contactId: contact.id,
                visitorId: `external_${channelType}_${message.from}`, // Generate visitorId for external channels
                history: [], // Initialize empty
            }
        });
    }

    // 3. Save Message
    const chatMessage = await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            role: 'USER',
            content: message.content,
            metadata: { ...message.metadata, channel: channelType, externalId: message.externalId }
        }
    });

    console.log(`Message saved: ${chatMessage.id}`);

    // Trigger AI Auto-reply workflow
    try {
        const channelConfig = await prisma.channelConfig.findFirst({
            where: { projectId, type: channelType, enabled: true }
        });

        if (!channelConfig) {
            console.log("No enabled channel config found for auto-reply.");
            return;
        }

        // Get Project Settings for Bot Personality
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { settings: true }
        });
        const settings = (project?.settings as any) || {};

        // Only reply if no human agent has taken over recently? 
        // For now, simple logic: Always auto-reply if it's a social channel user message.
        // Ideally we check if the session is "human_assigned".
        if (session.assignedTo) {
            console.log("Session assigned to human, skipping AI reply.");
            return;
        }

        // Generate AI Response
        const { generateAgentResponse } = await import('./ai/agent');

        // Get recent history for context
        const history = await prisma.chatMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        console.log("Generating AI response...");
        const aiResponseText = await generateAgentResponse(projectId, history, settings);

        if (aiResponseText) {
            // Send via Channel Adapter
            const { ChannelFactory } = await import('./channels/factory');
            const adapter = ChannelFactory.getAdapter(channelType as any);

            await adapter.sendMessage(message.from, aiResponseText, channelConfig.config);

            // Save Assistant Message to DB
            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'ASSISTANT',
                    content: aiResponseText,
                    metadata: { channel: channelType, type: 'auto-reply' }
                }
            });
            console.log(`AI Auto-reply sent to ${message.from}`);
        }

    } catch (error) {
        console.error("Auto-reply Error:", error);
    }
}

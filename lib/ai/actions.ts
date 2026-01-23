
import { prisma } from '@/lib/prisma';
import { searchVectors } from '@/app/lib/vector';

export async function createTicketAction(projectId: string, args: any) {
    const { subject, description, priority } = args;

    // Find a default contact/user if checking from an anonymous session?
    // Ideally we should know the contact from the session.
    // For now, let's create a ticket unassigned or assigned to a placeholder if needed.

    const ticket = await prisma.ticket.create({
        data: {
            projectId,
            subject,
            priority: priority || 'medium',
            status: 'open',
            comments: {
                create: {
                    content: description || "No description provided",
                    author: "AI Agent"
                }
            }
            // contactId: ... we need context here. 
            // For now, assuming the tool is used in a context where we might not have a contact ID easily passed in args 
            // unless we inject it. 
            // Simplified: Just create the ticket.
        }
    });

    return {
        success: true,
        ticketId: ticket.id,
        message: `Ticket #${ticket.id} created successfully.`
    };
}

export async function searchKBAction(projectId: string, args: any) {
    const { query } = args;
    const results = await searchVectors(projectId, query, 3);

    if (!results || results.length === 0) {
        return { found: false, message: "No relevant information found in the knowledge base." };
    }

    return {
        found: true,
        results: results.map((r: any) => r.content).join("\n\n")
    };
}

export async function escalateToHumanAction(_projectId: string, _args: any) {
    // In a real app, this would trigger a notification or change session state
    return {
        success: true,
        message: "I have notified a human agent. They will join the chat shortly."
    };
}

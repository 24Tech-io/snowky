
export const toolsDefinition = [
    {
        name: "create_ticket",
        description: "Create a support ticket for the user when they report an issue or bug.",
        parameters: {
            type: "object",
            properties: {
                subject: {
                    type: "string",
                    description: "Summary of the issue"
                },
                description: {
                    type: "string",
                    description: "Detailed explanation of the problem"
                },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Priority level based on urgency"
                }
            },
            required: ["subject", "description"]
        }
    },
    {
        name: "search_kb",
        description: "Search the knowledge base for answers when you don't know the answer.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query"
                }
            },
            required: ["query"]
        }
    },
    {
        name: "escalate_to_human",
        description: "Escalate the conversation to a human agent when the user asks for one or when you cannot help.",
        parameters: {
            type: "object",
            properties: {
                reason: {
                    type: "string",
                    description: "Reason for escalation"
                }
            },
            required: ["reason"]
        }
    }
];

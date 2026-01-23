
import { geminiModel } from "@/app/lib/gemini"; // Fix import path if needed to lib/gemini
import { searchVectors } from "@/app/lib/vector"; // Fix import path
import { prisma } from "@/lib/prisma";
import { toolsDefinition } from "./tools";
import * as actions from "./actions";

// Reusing personality logic from route.ts (should ideally be shared consts)
const personalityDescriptions: Record<string, string> = {
    friendly: "You are warm, approachable, and conversational. Use a casual but professional tone.",
    professional: "You are formal, precise, and business-oriented.",
    // Default fallback
};

export async function generateAgentResponse(
    projectId: string,
    history: any[],
    settings: any = {}
): Promise<string> {

    // 1. Context Retrieval
    const lastMessage = history[history.length - 1].content;
    let contextText = "";

    try {
        const contextChunks = await searchVectors(projectId, lastMessage, 4);
        if (contextChunks.length > 0) {
            contextText = contextChunks.map((c: any) => c.content).join("\n---\n");
        } else {
            // Fallback DB search
            const rawDocs = await prisma.document.findMany({
                where: { projectId },
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { content: true, name: true }
            });
            if (rawDocs.length > 0) {
                contextText = rawDocs.map((d: any) => `[Source: ${d.name}]\n${d.content}`).join("\n---\n").substring(0, 20000);
            }
        }
    } catch (e) {
        console.error("Agent Context Search Failed", e);
    }

    // 2. System Prompt
    const botName = settings.botName || "Snowky Assistant";
    const personality = settings.tone || "friendly";
    const systemPrompt = `You are ${botName}.
    PERSONALITY: ${personalityDescriptions[personality] || personalityDescriptions.friendly}
    CONTEXT: ${contextText || "No context provided."}
    TASK: Answer the user's question based on context. If you need to perform an action, use the provided tools.
    `;

    // 3. Gemini Chat
    // Convert history to Gemini format
    const chatHistory = [
        { role: 'user', parts: [{ text: `[System Instructions]\n${systemPrompt}` }] },
        { role: 'model', parts: [{ text: `Understood. I am ${botName}.` }] },
        ...history.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }))
    ];

    const chat = geminiModel.startChat({
        history: chatHistory as any,
        generationConfig: { maxOutputTokens: 800 },
        tools: [{ functionDeclarations: toolsDefinition as any }]
    });

    try {
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;

        // Handle Function Calls
        // In non-streaming, we check functionCalls() on the response
        const calls = response.functionCalls();

        if (calls && calls.length > 0) {
            const call = calls[0];
            const fnName = call.name;
            const fnArgs = call.args;

            console.log(`Agent calling tool: ${fnName}`, fnArgs);

            let toolResult;
            if (fnName === 'create_ticket') {
                toolResult = await actions.createTicketAction(projectId, fnArgs);
            } else if (fnName === 'search_kb') {
                toolResult = await actions.searchKBAction(projectId, fnArgs);
            } else if (fnName === 'escalate_to_human') {
                toolResult = await actions.escalateToHumanAction(projectId, fnArgs);
            } else {
                toolResult = { error: "Unknown tool" };
            }

            // Feed result back
            const finalResult = await chat.sendMessage([{
                functionResponse: {
                    name: fnName,
                    response: { content: toolResult }
                }
            }]);

            return finalResult.response.text();

        } else {
            return response.text();
        }

    } catch (error: any) {
        console.error("Agent Generation Error", error);
        return "I'm sorry, I'm having trouble processing your request right now.";
    }
}

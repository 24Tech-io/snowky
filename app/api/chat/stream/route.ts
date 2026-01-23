import { NextRequest } from "next/server";
import { geminiModel } from "@/app/lib/gemini";
import { searchVectors } from "@/app/lib/vector";
import { prisma } from "@/lib/prisma";

// Personality descriptions for system prompt
const personalityDescriptions: Record<string, string> = {
    friendly: "You are warm, approachable, and conversational. Use a casual but professional tone. Be helpful and encouraging.",
    professional: "You are formal, precise, and business-oriented. Use proper grammar and maintain a professional demeanor. Be concise and factual.",
    casual: "You are relaxed, laid-back, and informal. Feel free to use colloquialisms and be conversational like chatting with a friend.",
    enthusiastic: "You are energetic, excited, and positive! Show genuine enthusiasm in your responses. Be upbeat and motivating!",
    empathetic: "You are understanding, caring, and supportive. Show genuine concern for the user's feelings. Be gentle and reassuring.",
    witty: "You are clever, humorous, and quick-witted. Add tasteful humor when appropriate. Be entertaining while still being helpful.",
    formal: "You are highly formal, respectful, and traditional. Use proper etiquette and formal language structures.",
    playful: "You are fun, lighthearted, and creative. Feel free to be silly and imaginative. Make interactions enjoyable!",
    concise: "You are brief and to the point. Give direct answers without unnecessary elaboration. Value the user's time.",
    storyteller: "You are narrative and engaging. Explain things through stories and examples. Make information memorable through storytelling."
};

// Emoji usage instructions for system prompt
const emojiInstructions: Record<string, string> = {
    none: "Do NOT use any emojis in your responses. Keep all text plain without any emoji characters.",
    minimal: "Use emojis very sparingly - only 1 emoji per response, and only when it significantly enhances the message.",
    medium: "Use emojis moderately - 2-3 emojis per response to add warmth and expression where appropriate.",
    expressive: "Use emojis frequently - 4-6 emojis per response to make your messages vibrant and engaging.",
    maximum: "Use lots of emojis! 🎉 Add emojis liberally throughout your responses to make them fun and expressive! ✨"
};

export async function POST(req: NextRequest) {
    try {
        const { messages, projectId, settings } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "Messages array is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const lastMessage = messages[messages.length - 1].content;

        // --- RAG RETRIEVAL ---
        let contextText = "";
        try {
            console.log(`[Stream] Searching context for project ${projectId}...`);
            const contextChunks = await searchVectors(projectId, lastMessage, 4);

            if (contextChunks && contextChunks.length > 0) {
                console.log(`[Stream] Found ${contextChunks.length} relevant chunks.`);
                contextText = contextChunks.map((c: any) => c.content).join("\n---\n");
            } else {
                console.log("[Stream] No relevant vector context found. Checking for raw documents...");
                const rawDocs = await prisma.document.findMany({
                    where: { projectId },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, name: true }
                });

                if (rawDocs.length > 0) {
                    console.log(`[Stream] Found ${rawDocs.length} raw documents for fallback context.`);
                    contextText = rawDocs.map((d: any) => `[Source: ${d.name}]\n${d.content}`).join("\n---\n").substring(0, 30000);
                }
            }
        } catch (err: any) {
            console.error("[Stream] Vector search failed:", err.message);
            try {
                const rawDocs = await prisma.document.findMany({
                    where: { projectId },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, name: true }
                });
                if (rawDocs.length > 0) {
                    contextText = rawDocs.map((d: any) => `[Source: ${d.name}]\n${d.content}`).join("\n---\n").substring(0, 30000);
                }
            } catch (dbErr) {
                console.error("[Stream] Fallback DB fetch failed:", dbErr);
            }
        }

        // Get personality and emoji settings (with defaults)
        const personality = settings?.tone || "friendly";
        const emojiUsage = settings?.emojiUsage || "medium";
        const botName = settings?.botName || "Snowky Assistant";
        const customInstructions = settings?.customInstructions || "";

        // Build system prompt based on personality and emoji settings
        const personalityPrompt = personalityDescriptions[personality] || personalityDescriptions.friendly;
        const emojiPrompt = emojiInstructions[emojiUsage] || emojiInstructions.medium;

        const systemPrompt = `You are ${botName}, an AI assistant for a specific project.

PERSONALITY: ${personalityPrompt}

EMOJI USAGE: ${emojiPrompt}

CONTEXT INFORMATION:
${contextText ? contextText : "No specific context provided."}

INSTRUCTIONS:
1. Answer the user's question based STRICTLY on the "CONTEXT INFORMATION" provided above.
2. If the answer is not in the context, politely say that you don't have that information. Do NOT make up facts.
3. You may use general knowledge for greetings (Hi, Hello) or small talk, but for specific questions about the project/business, use ONLY the context.
4. Keep your personality active even when saying you don't know (e.g., if "enthusiastic", say "I'd love to help, but I don't have that info yet! 🌟").

${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ""}

Remember to stay in character and follow the personality and emoji guidelines consistently throughout the conversation.`;

        // Build the full prompt with conversation history
        const conversationHistory = messages.slice(0, -1).map((m: any) =>
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n');

        const fullPrompt = `${systemPrompt}

${conversationHistory ? `PREVIOUS CONVERSATION:\n${conversationHistory}\n\n` : ''}User: ${lastMessage}`;

        // Create a streaming response using SSE
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Import tools dynamically to avoid circular deps if any
                    const { toolsDefinition } = await import("@/lib/ai/tools");
                    const { createTicketAction, searchKBAction, escalateToHumanAction } = await import("@/lib/ai/actions");

                    // Build chat history with system prompt as first message
                    // Note: In streaming route, we moved this logic inside start() or need to pass it.
                    // But req body is read outside. We need to pass chatHistory into the stream closure or reconstruct it.

                    const chatHistory = [
                        { role: 'user', parts: [{ text: `[System Instructions]\n${systemPrompt}` }] },
                        { role: 'model', parts: [{ text: `Understood! I am ${botName}.` }] },
                        ...messages.slice(0, -1).map((m: any) => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }],
                        }))
                    ];

                    // Start chat with tools
                    const chat = geminiModel.startChat({
                        history: chatHistory as any,
                        generationConfig: { maxOutputTokens: 1000 },
                        tools: [{ functionDeclarations: toolsDefinition as any }]
                    });

                    // Send message
                    const result = await chat.sendMessageStream(lastMessage);

                    // We need to handle potential function calls in the stream
                    // The Google SDK yields chunks. A chunk might be text OR a function call.

                    let functionCall = null;
                    let textResponse = "";

                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();

                        // Check for function call
                        const calls = chunk.functionCalls();
                        if (calls && calls.length > 0) {
                            functionCall = calls[0];
                            // Note: We consume the whole stream to get the full function call args usually
                            // But SDK might give per chunk. 
                            // Usually function call comes as one complete thing or built up.
                            // SDK puts it in `functionCalls()` accessor.
                            continue;
                        }

                        if (chunkText) {
                            textResponse += chunkText;
                            const sseData = `data: ${JSON.stringify({ chunk: chunkText })}\n\n`;
                            controller.enqueue(encoder.encode(sseData));
                        }
                    }

                    // If we had a function call, execute it and feed back
                    if (functionCall) {
                        const fnName = functionCall.name;
                        const fnArgs = functionCall.args;

                        // Notify frontend we are working (optional, via special chunk?)
                        // controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: " ⚙️ Processing..." })}\n\n`));

                        let toolResult;
                        if (fnName === 'create_ticket') {
                            toolResult = await createTicketAction(projectId, fnArgs);
                        } else if (fnName === 'search_kb') {
                            toolResult = await searchKBAction(projectId, fnArgs);
                        } else if (fnName === 'escalate_to_human') {
                            toolResult = await escalateToHumanAction(projectId, fnArgs);
                        } else {
                            toolResult = { error: "Unknown tools" };
                        }

                        // Send result back to model
                        // Note: sendMessageStream can be called again on the same chat instance
                        // We need to send a FunctionResponse part.

                        const toolResponseResult = await chat.sendMessageStream([{
                            functionResponse: {
                                name: fnName,
                                response: { content: toolResult }
                            }
                        }]);

                        // Stream the FINAL answer
                        for await (const chunk of toolResponseResult.stream) {
                            const text = chunk.text();
                            if (text) {
                                const sseData = `data: ${JSON.stringify({ chunk: text })}\n\n`;
                                controller.enqueue(encoder.encode(sseData));
                            }
                        }
                    }

                    // Send completion signal
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                    controller.close();

                } catch (streamError: any) {
                    console.error("[Stream] Streaming error:", streamError.message);
                    const errorData = `data: ${JSON.stringify({ error: streamError.message })}\n\n`;
                    controller.enqueue(encoder.encode(errorData));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });

    } catch (error: any) {
        console.error("[Stream] Chat API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to generate response", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Handle CORS preflight
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}

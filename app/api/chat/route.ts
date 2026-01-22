
import { NextResponse } from "next/server";
import { geminiModel } from "@/app/lib/gemini";
import { searchVectors } from "@/app/lib/vector";

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

export async function POST(req: Request) {
    try {
        const { messages, projectId, settings } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1].content;

        // --- RAG RETRIEVAL ---
        let contextText = "";
        try {
            console.log(`Searching context for project ${projectId}...`);
            const contextChunks = await searchVectors(projectId, lastMessage, 4);

            if (contextChunks && contextChunks.length > 0) {
                console.log(`Found ${contextChunks.length} relevant chunks.`);
                contextText = contextChunks.map((c: any) => c.content).join("\n---\n");
            } else {
                console.log("No relevant vector context found. Checking for raw documents...");
                // Fallback: Get raw text from documents (limit to first 30k chars to avoid token limits)
                // This enables "Zero-Training" RAG for small projects
                const rawDocs = await import("@/lib/prisma").then(m => m.prisma.document.findMany({
                    where: { projectId },
                    take: 5, // Limit to 5 docs for now
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, name: true }
                }));

                if (rawDocs.length > 0) {
                    console.log(`Found ${rawDocs.length} raw documents for fallback context.`);
                    contextText = rawDocs.map((d: any) => `[Source: ${d.name}]\n${d.content}`).join("\n---\n").substring(0, 30000);
                } else {
                    console.log("No raw documents found either.");
                }
            }
        } catch (err: any) {
            console.error("Vector search failed:", err.message);
            // Fallback on error too
            try {
                const rawDocs = await import("@/lib/prisma").then(m => m.prisma.document.findMany({
                    where: { projectId },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, name: true }
                }));
                if (rawDocs.length > 0) {
                    console.log(`Fallback: Using ${rawDocs.length} raw documents after vector error.`);
                    contextText = rawDocs.map((d: any) => `[Source: ${d.name}]\n${d.content}`).join("\n---\n").substring(0, 30000);
                }
            } catch (dbErr) {
                console.error("Fallback DB fetch failed:", dbErr);
            }
        }
        // ---------------------

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

        // Build chat history with system prompt as first message
        const chatHistory = [
            { role: 'user' as const, parts: [{ text: `[System Instructions]\n${systemPrompt}` }] },
            { role: 'model' as const, parts: [{ text: `Understood! I am ${botName}. I will answer based ONLY on the provided context, using a ${personality} tone and ${emojiUsage} emoji usage.` }] },
            ...messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: m.content }],
            }))
        ];

        const chat = geminiModel.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ role: 'assistant', content: text });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate response", details: error.message },
            { status: 500 }
        );
    }
}

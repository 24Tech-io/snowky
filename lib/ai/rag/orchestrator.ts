import { prisma } from '@/lib/prisma';
import { processDocumentBatch } from '@/lib/documents/processor';
import { gemini } from '../gemini-client';
import { buildDynamicSystemPrompt, buildSalesPrompt } from '../prompts/dynamic-prompt-builder';
import { buildContext } from './context-builder';
import { retrieveRelevantChunks, multiQueryRetrieval, RetrievedChunk } from './retriever';
import { ProjectSettings } from '@prisma/client';

export interface RAGRequest {
    projectId: string;
    message: string;
    history: Array<{ role: 'user' | 'model'; content: string }>;
    visitorId: string;
}

export interface RAGResponse {
    text: string;
    sources: RetrievedChunk[];
    tokensUsed: number;
    confidence: number;
    warnings?: string[];
}

export class RAGOrchestrator {

    async processQuery(request: RAGRequest): Promise<RAGResponse> {
        const { projectId, message, history } = request;

        // 1. Fetch Project Settings
        const settings = await prisma.projectSettings.findUnique({
            where: { projectId },
        });

        if (!settings) {
            throw new Error('Project settings not found');
        }

        // 2. Determine Intent & Guardrails (Optional: separate classification step)
        // For now, we built guardrails into the system prompt.
        // If strictKnowledgeBase is on, we rely on context.

        // 3. Retrieval
        let chunks: RetrievedChunk[] = [];

        // Check if we should even search (e.g. if it's just "hi")
        // Simple heuristic: if message is very short, maybe skip RAG or do lightweight?
        // For now, always RAG to support "who are you" type Qs from company context.

        const retrievalConfig = {
            topK: settings.ragTopK,
            threshold: settings.ragThreshold,
            useHybridSearch: settings.ragUseHybridSearch,
        }; // Maps partially to RetrievalConfig

        // Use multi-query if deep reasoning is needed, but for chat speed, single query + hybrid is usually best.
        // We can stick to standard retrieval for MVP latency.
        chunks = await retrieveRelevantChunks(message, projectId, retrievalConfig);

        // 4. Build Context
        const contextString = buildContext(chunks, settings.ragMaxContext);

        // 5. Build System Prompt
        const dynamicSystemPrompt = buildDynamicSystemPrompt(settings);
        const salesPrompt = buildSalesPrompt(settings);
        const finalSystemPrompt = `${dynamicSystemPrompt}\n${salesPrompt}`;

        // 6. Augment History with System Prompt (Gemini API style)
        // Gemini supports systemInstruction in model config, or we can prepend to history.
        // The Gemini wrapper we wrote creates a chat using `history`. 
        // We'll treat the system prompt as the first message role 'user' or utilize system_instruction if SDK supports.
        // Our generic wrapper assumes `history` is passed. 
        // We'll inject the system prompt + context into the latest message or a "system" message.

        // Strategy: Prepend System Prompt + Context to the last user message to ensure it's fresh.
        const augmentedMessage = `
${finalSystemPrompt}

${contextString}

USER QUERY:
${message}
`;

        // 7. Generate Response
        // We pass the history (excluding the very last message which is now augmented)
        // history expected is [{role, content}]

        const response = await gemini.generateChatResponse([
            ...history,
            { role: 'user', content: augmentedMessage }
        ], {
            model: settings.aiModel,
            temperature: settings.aiTemperature,
            maxTokens: settings.aiMaxTokens,
        });

        // 8. Auto-Handoff Logic check
        // If confidence is low (can't easily measure without logprobs, which are limited)
        // We can infer confidence if the model says "I don't know".
        // Or we use semantic distance of top chunk.
        let confidence = 0;
        if (chunks.length > 0) {
            confidence = chunks[0].similarity;
        }

        if (settings.autoHandoffEnabled && confidence < settings.autoHandoffThreshold) {
            // We might want to flag this, but for now we return it and let the API decide effectively.
            // Or we append a flag to the response.
        }

        return {
            text: response.text,
            sources: chunks,
            tokensUsed: response.tokensUsed,
            confidence,
        };
    }
}

export const orchestrator = new RAGOrchestrator();

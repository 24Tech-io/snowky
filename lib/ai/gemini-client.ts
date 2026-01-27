import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
}

const defaultConfig: GeminiConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    topK: 40,
};

class GeminiClient {
    private client: GoogleGenerativeAI;
    private models: Map<string, GenerativeModel> = new Map();

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.client = new GoogleGenerativeAI(apiKey);
    }

    private getModel(modelName: string): GenerativeModel {
        if (!this.models.has(modelName)) {
            this.models.set(modelName, this.client.getGenerativeModel({ model: modelName }));
        }
        return this.models.get(modelName)!;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });

        const result = await model.embedContent(text);
        return result.embedding.values;
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        // Batch embedding generation
        const embeddings = await Promise.all(
            texts.map(text => this.generateEmbedding(text))
        );
        return embeddings;
    }

    async generateResponse(
        prompt: string,
        config: GeminiConfig = {}
    ): Promise<{ text: string; tokensUsed: number }> {
        const mergedConfig = { ...defaultConfig, ...config };
        const model = this.getModel(mergedConfig.model!);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: mergedConfig.temperature,
                maxOutputTokens: mergedConfig.maxTokens,
                topP: mergedConfig.topP,
                topK: mergedConfig.topK,
            },
        });

        const response = result.response;
        const text = response.text();

        // Estimate tokens (Gemini doesn't always return exact count)
        const tokensUsed = Math.ceil((prompt.length + text.length) / 4);

        return { text, tokensUsed };
    }

    async generateChatResponse(
        messages: Array<{ role: 'user' | 'model'; content: string }>,
        config: GeminiConfig = {}
    ): Promise<{ text: string; tokensUsed: number }> {
        const mergedConfig = { ...defaultConfig, ...config };
        const model = this.getModel(mergedConfig.model!);

        const chat = model.startChat({
            history: messages.slice(0, -1).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
            generationConfig: {
                temperature: mergedConfig.temperature,
                maxOutputTokens: mergedConfig.maxTokens,
                topP: mergedConfig.topP,
                topK: mergedConfig.topK,
            },
        });

        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        const text = result.response.text();

        const tokensUsed = Math.ceil(
            messages.reduce((acc, m) => acc + m.content.length, 0) / 4 + text.length / 4
        );

        return { text, tokensUsed };
    }
}

// Singleton instance
export const gemini = new GeminiClient();

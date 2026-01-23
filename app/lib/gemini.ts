
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
    console.error("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use gemini-2.0-flash-exp - the only model detected as available for this key
export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
});

export const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

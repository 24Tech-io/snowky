
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    console.log("Checking Gemini API Key...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("Error: GEMINI_API_KEY is missing!");
        return;
    }
    console.log(`Key found (Length: ${key.length})`);

    const genAI = new GoogleGenerativeAI(key);

    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of modelsToTry) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, world!");
            const response = await result.response;
            console.log(`[SUCCESS] ${modelName}:`, response.text());
            return; // Exit on first success
        } catch (error) {
            console.error(`[FAILED] ${modelName}:`, error.message);
            if (error.response) {
                console.error("Status:", error.response.status, error.response.statusText);
            }
        }
    }
    console.error("\nAll models failed.");
}

testGemini();

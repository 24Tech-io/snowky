
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log("Debug: Testing Gemini API models...");
console.log(`Debug: API Key present: ${!!apiKey} (Length: ${apiKey?.length})`);

async function searchWorkingModel() {
    // List of models to try in order of preference
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-pro-vision",
        "gemini-2.0-flash-exp"
    ];

    console.log("\nSearching for working model...");

    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName}... `);
        // Using v1beta endpoint which supports all modern models
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello" }] }]
                })
            });

            if (response.ok) {
                console.log("✅ SUCCESS!");
                return modelName;
            } else {
                console.log(`❌ Failed (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ Network Error`);
        }
    }
    return null;
}

async function run() {
    const workingModel = await searchWorkingModel();
    if (workingModel) {
        console.log(`\n🎉 FOUND WORKING MODEL: ${workingModel}`);
        console.log("Please update app/lib/gemini.ts with this model name.");
    } else {
        console.error("\n❌ No working models found with this API key.");
    }
}

run();

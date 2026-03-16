require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("❌ ERROR: GEMINI_API_KEY not found in .env.local");
        process.exit(1);
    }

    console.log("🚀 Testing Gemini API with key starting with:", apiKey.substring(0, 5) + "...");
    
    // The specific model requested by user
    const MODEL_NAME = "gemini-2.5-flash";

    try {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: MODEL_NAME });

        const prompt = "Hello! I am SAMKIEL, and I'm building Voxy. Can you give me a short, 1-sentence greeting for my project using the 2.0 Flash model?";

        console.log(`📡 Sending prompt to Gemini (${MODEL_NAME})...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("\n✨ Gemini Response:");
        console.log("-------------------");
        console.log(text);
        console.log("-------------------\n");
        console.log(`✅ Success! Gemini ${MODEL_NAME} is working.`);

    } catch (error) {
        console.error(`❌ Gemini API Error (${MODEL_NAME}):`);
        console.error(error.message);
        
        console.log("\n🔍 Debugging: Trying fallback to gemini-1.5-flash...");
        try {
            const client = new GoogleGenerativeAI(apiKey);
            const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Test greeting");
            const response = await result.response;
            console.log("✅ Success with gemini-1.5-flash fallback:", response.text());
        } catch (e2) {
            console.error("❌ Fallback also failed:", e2.message);
        }
    }
}

testGemini();

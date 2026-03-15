require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("❌ ERROR: GEMINI_API_KEY not found in .env.local");
        process.exit(1);
    }

    console.log("🚀 Testing Gemini API with key starting with:", apiKey.substring(0, 5) + "...");
    
    try {
        const client = new GoogleGenerativeAI(apiKey);
        
        console.log("📡 Listing available models...");
        // This is a bit advanced for a simple script, but let's try a different model first
        const model = client.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log("✅ Success with gemini-pro:", response.text());

    } catch (error) {
        console.error("❌ Gemini API Error:", error.message);
        console.log("Trying gemini-1.5-pro...");
        try {
            const client = new GoogleGenerativeAI(apiKey);
            const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });
            const result = await model.generateContent("Hello!");
            const response = await result.response;
            console.log("✅ Success with gemini-1.5-pro:", response.text());
        } catch (e2) {
            console.error("❌ Still failing with gemini-1.5-pro:", e2.message);
        }
    }
}

testGemini();

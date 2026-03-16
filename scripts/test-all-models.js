require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAllModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env.local");
        return;
    }

    console.log("🚀 Starting Bulk Model Connectivity Test...\n");

    try {
        // 1. Get list of all available models
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await listResponse.json();

        if (!data.models) {
            console.error("❌ Could not retrieve models list:", data);
            return;
        }

        // 2. Filter for models that support generating content
        // Note: Filter out embedding, vision, and preview models that might not support simple text generation if needed,
        // but it's better to just try them all and see what stays.
        const candidates = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", ""));

        console.log(`📋 Found ${candidates.length} candidates for 'generateContent'. Testing now...\n`);

        const results = {
            working: [],
            failed: []
        };

        const genAI = new GoogleGenerativeAI(apiKey);

        for (const modelName of candidates) {
            process.stdout.write(`📡 Testing ${modelName.padEnd(35)} ... `);
            
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Use a very short timeout/prompt to speed things up
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: "hi" }] }],
                    generationConfig: { maxOutputTokens: 5 }
                });
                
                // If it didn't throw, it's likely working
                const response = await result.response;
                const text = response.text();
                
                console.log("✅ WORKING");
                results.working.push(modelName);
            } catch (error) {
                let reason = error.message.split('\n')[0];
                if (reason.includes("429")) reason = "429 Quota Exceeded";
                else if (reason.includes("404")) reason = "404 Not Found";
                else if (reason.includes("403")) reason = "403 Forbidden";
                
                console.log(`❌ FAILED (${reason})`);
                results.failed.push({ name: modelName, reason: error.message });
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("📊 FINAL REPORT");
        console.log("=".repeat(50));
        console.log(`✅ Working Models (${results.working.length}):`);
        results.working.forEach(m => console.log(`   - ${m}`));
        
        console.log(`\n❌ Inactive/Quota-Restricted Models (${results.failed.length}):`);
        results.failed.forEach(f => console.log(`   - ${f.name}`));
        console.log("=".repeat(50));

        // Suggest a fallback order
        if (results.working.length > 0) {
            console.log("\n💡 Suggested Fallback Array for Voxy:");
            console.log(JSON.stringify(results.working, null, 2));
        }

    } catch (err) {
        console.error("💥 Fatal error during test script:", err);
    }
}

testAllModels();

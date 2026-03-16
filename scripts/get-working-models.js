require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function findWorkingModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await listResponse.json();
    const candidates = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace("models/", ""));

    const genAI = new GoogleGenerativeAI(apiKey);
    const working = [];

    for (const name of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: "hi" }] }], generationConfig: { maxOutputTokens: 2 } });
            await result.response;
            working.push(name);
        } catch (e) {}
    }
    console.log("WORKING_MODELS_START");
    console.log(JSON.stringify(working, null, 2));
    console.log("WORKING_MODELS_END");
}

findWorkingModels();

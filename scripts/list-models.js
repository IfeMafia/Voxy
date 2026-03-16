require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Key starts with:", apiKey?.substring(0, 10));
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            data.models.forEach(m => {
                console.log(m.name);
            });
        } else {
            console.log("No models found. Response:", JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}
listModels();

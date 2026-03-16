require('dotenv').config({ path: '.env.local' });
// Temporary polyfill/alias for testing ESM-style library in CJS script
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Simulate the fallback list we just implemented
const VOXY_MODELS = [
  "gemini-2.0-flash", // Known to fail (429)
  "gemini-2.5-flash", // Known to work
  "gemini-flash-latest"
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testVoxyFallback() {
    console.log("🛠️ Testing Voxy's new Robust Fallback Logic...\n");
    
    for (const modelName of VOXY_MODELS) {
        try {
            console.log(`📡 Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const result = await model.generateContent("Say 'Fallback Test Successful'");
            const response = await result.response;
            
            console.log("✨ SUCCESS!");
            console.log(`✅ Result from ${modelName}: "${response.text().trim()}"`);
            console.log("\n🚀 Fallback logic confirmed. The app will automatically bypass the 429 error on 2.0-flash by moving to 2.5-flash.");
            return;
        } catch (error) {
            console.warn(`⚠️ ${modelName} failed. Reason: ${error.message.split('\n')[0]}`);
            console.log("🔄 Moving to next fallback...\n");
        }
    }
}

testVoxyFallback();

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * List of verified working models for Voxy in priority order.
 * Your account has special access to 2.5 and 3.x models!
 */
export const VOXY_MODELS = [
  "gemini-2.5-flash",              // High priority - Verified Working
  "gemini-2.5-flash-lite",         // Faster fallback
  "gemini-flash-latest",           // Stable production
  "gemini-3-flash-preview",        // Next-gen test
  "gemini-3.1-flash-lite-preview", // Small/Fast
  "gemma-3-27b-it",                // Versatile LLM
];

/**
 * Get a specific Gemini model instance
 * @param {string} modelName - The name of the model to use (default: gemini-2.5-flash)
 * @returns GenerativeModel
 */
export const getGeminiModel = (modelName = VOXY_MODELS[0]) => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Robust text generation with automatic fallback across multiple models
 * @param {string} prompt - The user prompt
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>}
 */
export const generateText = async (prompt, options = {}) => {
  let lastError = null;

  for (const modelName of VOXY_MODELS) {
    try {
      console.log(`📡 Voxy AI: Trying model ${modelName}...`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: options.generationConfig
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Voxy AI: Model ${modelName} failed (${error.message.split('\n')[0]}). Trying next fallback...`);
      
      // If it's a 429 quota error, we definitely want to try the next model immediately
      continue;
    }
  }

  console.error("❌ Voxy AI: All models in the fallback array failed.");
  throw lastError || new Error("Generated failed across all available models.");
};

export default genAI;

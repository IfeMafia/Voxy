import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get a specific Gemini model instance
 * @param {string} modelName - The name of the model to use (default: gemini-1.5-flash)
 * @returns GenerativeModel
 */
export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Simple helper to generate text from a prompt
 * @param {string} prompt 
 */
export const generateText = async (prompt) => {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

export default genAI;

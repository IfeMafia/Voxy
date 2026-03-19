import { generateAIResponse } from "../core/generateAIResponse.js";

/**
 * Detects the language of a given text using Gemini.
 * Supports: English, Yoruba, Hausa, Igbo.
 * Returns: "english", "yoruba", "hausa", "igbo", or "unsupported".
 */
export async function detectLanguageGemini(text) {
  if (!text || text.trim().length === 0) return "unsupported";

  const prompt = `
Detect the language of the following text. 
Return ONLY one of these exact words: "english", "yoruba", "hausa", "igbo", or "unsupported".

Rules:
- If the language is English, return "english".
- If the language is Yoruba, return "yoruba".
- If the language is Hausa, return "hausa".
- If the language is Igbo, return "igbo".
- If the language is none of the above or if you are not highly confident, return "unsupported".
- Mixed languages: if one of the supported languages is clearly dominant, return that. Otherwise, "unsupported".
- Return ONLY the word. No punctuation, no explanation.

Text: "${text}"
  `.trim();

  try {
    const response = await generateAIResponse(prompt, "Language detector");
    // Sanitize response to get just the word
    const detected = response.text.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, "");
    
    const validLanguages = ["english", "yoruba", "hausa", "igbo"];
    if (validLanguages.includes(detected)) {
      return detected;
    }
    return "unsupported";
  } catch (error) {
    console.error("Language detection error:", error);
    return "unsupported";
  }
}

/**
 * Validates if the text is in the target language.
 */
export async function validateResponseLanguage(text, targetLanguage) {
  if (!text) return false;
  const detected = await detectLanguageGemini(text);
  return detected === targetLanguage.toLowerCase();
}

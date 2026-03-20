import { generateAIResponse } from "../core/generateAIResponse.js";

/**
 * Detects the language of a given text using Gemini.
 * Supports: English, Yoruba, Hausa, Igbo, Nigerian Pidgin.
 * Returns: "english", "yoruba", "hausa", "igbo", "pidgin", or "unsupported".
 */
export async function detectLanguageGemini(text) {
  if (!text || text.trim().length === 0) return "english"; // Default to English for empty/whitespace

  const trimmedLower = text.trim().toLowerCase();
  
  // Quick check for common short English greetings to save tokens/latency
  const commonEnglishGreetings = ['hi', 'hello', 'hey', 'yo', 'good morning', 'good afternoon', 'good evening'];
  if (commonEnglishGreetings.includes(trimmedLower)) return "english";

  const prompt = `
Detect the language of the following text. 
Return ONLY one of these exact words: "english", "yoruba", "hausa", "igbo", "pidgin", or "unsupported".

Rules:
- If the language is English, return "english". (Short greetings like "hi", "hello" are English).
- If the language is Yoruba, return "yoruba".
- If the language is Hausa, return "hausa".
- If the language is Igbo, return "igbo".
- If the language is Nigerian Pidgin (informal broken English), return "pidgin".
- If the language is none of the above, return "unsupported".
- If you are not sure, default to "english" if it looks like a greeting.
- Mixed languages: return the dominant supported language.
- Return ONLY the word. No punctuation, no explanation.

Text: "${text}"
  `.trim();

  try {
    const response = await generateAIResponse(prompt, "Language detector");
    // Sanitize response to get just the word
    if (!response || !response.text) {
      console.warn("Language detection failed: AI returned null response.");
      return "unsupported";
    }
    const detected = response.text.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, "");
    
    const validLanguages = ["english", "yoruba", "hausa", "igbo", "pidgin"];
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

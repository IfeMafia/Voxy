import Groq, { toFile } from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGroqApiKeys } from '../providers/groq.js';
import { getGeminiApiKeys } from '../providers/gemini.js';

let sttKeyIndex = 0;
let geminiSttKeyIndex = 0;
const groqClientsMap = new Map();

function getGroqClientForKey(apiKey) {
  if (!groqClientsMap.has(apiKey)) {
    groqClientsMap.set(apiKey, new Groq({ apiKey }));
  }
  return groqClientsMap.get(apiKey);
}

/**
 * Transcribes audio using Groq Whisper (with multi-key rotator).
 */
async function transcribeWithGroq(audioData, mimeType = "audio/webm") {
  const keys = getGroqApiKeys();
  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    const keyIdx = (sttKeyIndex + i) % keys.length;
    const apiKey = keys[keyIdx];
    if (apiKey === "dummy-key-for-build") continue;

    try {
      const groq = getGroqClientForKey(apiKey);
      
      let fileToUpload = audioData;
      if (typeof toFile === 'function') {
        const buf = Buffer.isBuffer(audioData)
          ? audioData
          : typeof audioData.arrayBuffer === 'function'
          ? Buffer.from(await audioData.arrayBuffer())
          : Buffer.from(audioData);
        fileToUpload = await toFile(buf, "input.webm", { type: mimeType || "audio/webm" });
      }

      const response = await groq.audio.transcriptions.create({
        file: fileToUpload,
        model: "whisper-large-v3-turbo",
        response_format: "json",
      });

      sttKeyIndex = keyIdx;
      return response.text;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [STT-GROQ-ROTATOR] Key #${keyIdx + 1} failed: ${err.message}. Rotating to next Groq key...`);
    }
  }

  throw lastError || new Error("All Groq API keys exhausted for STT.");
}

/**
 * Transcribes audio using Gemini 2.0 Flash with robust multi-key retry.
 */
async function transcribeWithGemini(audioData, mimeType = "audio/webm", retryCount = 0) {
  const keys = getGeminiApiKeys();
  const keyIdx = (geminiSttKeyIndex + retryCount) % keys.length;
  const apiKey = keys[keyIdx];

  if (apiKey === "dummy-key-for-build") {
    throw new Error("No valid Gemini API key configured for STT fallback.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let base64Data;
    if (Buffer.isBuffer(audioData)) {
      base64Data = audioData.toString("base64");
    } else if (typeof audioData.arrayBuffer === 'function') {
      const arrayBuffer = await audioData.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString("base64");
    } else {
      base64Data = Buffer.from(audioData).toString("base64");
    }

    const prompt = "Transcribe the audio accurately. Return ONLY the transcribed text. Do not add any conversational context.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    geminiSttKeyIndex = keyIdx;
    return response.text().trim();
  } catch (err) {
    const isRateLimit = err.message.includes("429") || err.message.includes("ResourceExhausted") || err.message.toLowerCase().includes("quota");
    
    if (keys.length > 1 && retryCount < keys.length) {
      console.warn(`⏳ [STT-HYBRID] Gemini STT key #${keyIdx + 1} issue (${err.message}). Trying next key...`);
      return await transcribeWithGemini(audioData, mimeType, retryCount + 1);
    }
    throw err;
  }
}

/**
 * Hybrid STT: Prioritize Groq, Fallback to Gemini.
 */
export async function transcribeAudioHybrid(audioData, mimeType = "audio/webm") {
  // 1. Primary Path: Groq
  try {
    console.log("🎙️ [STT-HYBRID] Trying Groq...");
    return await transcribeWithGroq(audioData);
  } catch (groqError) {
    // Log the Groq error clearly for debugging
    const errMsg = groqError.response?.status === 403 ? "IP Block (403)" : groqError.message;
    console.warn(`⚠️ [STT-HYBRID] Groq STT failed: ${errMsg}. Falling back to Gemini...`);
    
    // 2. Fallback Path: Gemini
    try {
      console.log("🎙️ [STT-HYBRID] Trying Gemini...");
      const text = await transcribeWithGemini(audioData, mimeType);
      
      if (!text) throw new Error("Gemini returned empty transcription.");
      return text;
    } catch (geminiError) {
      console.error("❌ [STT-HYBRID] Both STT providers failed.");
      
      // If it's a quota error, add a hint to the error message
      if (geminiError.message.includes("429") || geminiError.message.toLowerCase().includes("quota")) {
        throw new Error("Transcriptions currently unavailable due to provider rate limits. Please try again in 1 minute.");
      }
      
      throw new Error(`STT Fallback Failed: ${geminiError.message}`);
    }
  }
}

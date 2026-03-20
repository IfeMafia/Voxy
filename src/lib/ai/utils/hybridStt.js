import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

let groqClient = null;
let geminiModel = null;

function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is missing");
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function getGemini() {
  if (!geminiModel) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.0-flash as it's the most consistent model in the project
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return geminiModel;
}

/**
 * Transcribes audio using Groq Whisper.
 */
async function transcribeWithGroq(audioData) {
  const groq = getGroq();
  
  // Groq SDK needs a File or a stream. 
  // If it's a Blob/Buffer from Next.js, ensure it has a filename metadata
  let fileToUpload = audioData;
  
  // Handle Buffer or Blob without name (common in Node environments or from certain clients)
  if (!(audioData instanceof File) || !audioData.name) {
    const filename = "input.webm";
    const mimeType = audioData.type || "audio/webm";
    
    // In Node.js/Next.js environment, we use the File constructor if available
    if (typeof File !== 'undefined') {
       fileToUpload = new File([audioData], filename, { type: mimeType });
    } else {
       // Fallback for environments where File is missing (should not happen in Next.js)
       // We can just pass the audioData and hope the SDK's multipart handler handles it,
       // but we've seen it fail. Let's assume File exists or is polyfilled.
       console.warn("[STT-HYBRID] File constructor missing, passing raw data.");
    }
  }

  const response = await groq.audio.transcriptions.create({
    file: fileToUpload,
    model: "whisper-large-v3-turbo",
    response_format: "json",
  });
  
  return response.text;
}

/**
 * Transcribes audio using Gemini 2.0 Flash with robust retry.
 */
async function transcribeWithGemini(audioData, mimeType, retryCount = 0) {
  const model = getGemini();
  
  try {
    let base64Data;
    if (audioData instanceof Buffer) {
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
    return response.text().trim();
  } catch (err) {
    const isRateLimit = err.message.includes("429") || err.message.includes("ResourceExhausted") || err.message.toLowerCase().includes("quota");
    
    // If it's a 429 and we haven't retried too many times
    if (isRateLimit && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      console.warn(`⏳ [STT-HYBRID] Gemini rate limited ($${retryCount + 1}). Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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

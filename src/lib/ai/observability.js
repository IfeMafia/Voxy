import db from '@/lib/db';

const PRICING = {
  gemini: { input: 0.0005, output: 0.001 }, // Cost per 1K tokens
  openai: { input: 0.001, output: 0.002 },  // Cost per 1K tokens
  tts: { perChar: 0.00001 }                 // Cost per character
};

/**
 * AI Cost Estimation Utility.
 * Support for token-based (LLM) and character-based (TTS) models.
 * 
 * @param {Object} params
 * @param {string} params.provider
 * @param {string} params.model
 * @param {number} params.inputSize - Tokens or characters
 * @param {number} params.outputSize - Tokens or characters
 * @returns {number} Estimated cost in USD
 */
export function estimateCost({ provider, model, inputSize, outputSize }) {
  const prov = provider.toLowerCase();
  const mod = model.toLowerCase();

  // 1. Character-based Pricing (TTS)
  if (prov.includes('tts') || mod.includes('tts')) {
    return (inputSize || 0) * PRICING.tts.perChar;
  }

  // 2. Token-based Pricing
  // Default to Gemini pricing if specific provider not found
  const pricing = PRICING[prov] || PRICING.gemini;
  
  const inputCost = ((inputSize || 0) / 1000) * (pricing.input || 0);
  const outputCost = ((outputSize || 0) / 1000) * (pricing.output || 0);

  return inputCost + outputCost;
}

/**
 * AI Observability Utility: Tracks request latency, cost, and status.
 * 
 * @param {Object} context - Metadata about the AI request
 * @param {string} context.userId
 * @param {string} context.businessId
 * @param {string} context.requestType - "chat" | "voice" | "system"
 * @param {string} context.provider
 * @param {string} context.model
 * @param {Function} fn - The function performing the AI task
 * @returns {Promise<any>} - The result from the provided function
 */
export async function trackAIUsage({ userId, businessId, requestType, provider, model }, fn) {
  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;
  let result = null;
  let inputSize = 0;
  let outputSize = 0;

  try {
    // 1. Execute the target AI function
    result = await fn();
    
    // 2. Extract metrics from result if available (standardize on inputSize/outputSize or tokensUsed)
    if (result && typeof result === 'object') {
      inputSize = result.inputSize || result.tokensUsed || 0;
      outputSize = result.outputSize || 0;
    }
  } catch (error) {
    status = 'error';
    errorMessage = error.message;
    // We catch the error to log it, but we MUST throw it back out so original logic doesn't break
    throw error;
  } finally {
    const latency = Date.now() - startTime;
    const cost = estimateCost({ provider, model, inputSize, outputSize });

    // 3. Log to DB (Fire-and-forget style to avoid blocking response)
    db.query(`
      INSERT INTO ai_usage_logs (
        user_id, business_id, request_type, provider, model, 
        input_size, output_size, latency, estimated_cost, 
        status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      userId || null, 
      businessId || null, 
      requestType, 
      provider, 
      model, 
      inputSize, 
      outputSize, 
      latency, 
      cost, 
      status, 
      errorMessage
    ]).catch(dbError => {
      console.error('[AI-Observability] Failed to save usage log:', dbError.message);
    });
  }

  return result;
}

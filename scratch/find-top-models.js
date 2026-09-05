import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Groq from 'groq-sdk';

async function testAllGroqModels() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const list = await groq.models.list();
  const modelIds = list.data.map(m => m.id);

  console.log("Found Groq Models:", modelIds);
  const results = [];

  for (const model of modelIds) {
    if (model.includes('whisper') || model.includes('guard') || model.includes('arabic')) continue;

    console.log(`\n--- Testing Model: ${model} ---`);
    const start = Date.now();
    try {
      const res = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are Voxy AI assistant. Output ONLY valid JSON: {"status": "ok", "message": "hello"}' },
          { role: 'user', content: 'Say hello and confirm status' }
        ],
        model: model,
        max_tokens: 150
      });
      const latency = Date.now() - start;
      const text = res.choices[0]?.message?.content || '';
      console.log(`[SUCCESS] ${latency}ms | Output:`, text.substring(0, 100).replace(/\n/g, ' '));
      results.push({ model, success: true, latency, text });
    } catch (err) {
      console.log(`[FAILED] Error:`, err.message);
      results.push({ model, success: false, error: err.message });
    }
  }

  console.log("\n====== SUMMARY ======");
  console.table(results);
}

testAllGroqModels();

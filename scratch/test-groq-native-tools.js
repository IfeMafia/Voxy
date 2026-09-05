import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Groq from 'groq-sdk';
import { createDefaultToolRegistry } from '../src/lib/ai/agent/tools/index.js';

async function testNativeTools() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const registry = createDefaultToolRegistry();
  const rawTools = registry.describe();

  const formattedTools = rawTools.map(t => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          (t.parameters || []).map(p => [p.name, { type: p.type || "string", description: p.description }])
        ),
        required: (t.parameters || []).filter(p => p.required).map(p => p.name)
      }
    }
  }));

  console.log("Formatted Tools Count:", formattedTools.length);

  try {
    const res = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are Voxy AI store representative.' },
        { role: 'user', content: 'id like to order Agbado' }
      ],
      model: 'openai/gpt-oss-120b',
      tools: formattedTools,
      tool_choice: 'auto'
    });

    console.log("RESPONSE CHOICE:", JSON.stringify(res.choices[0], null, 2));
  } catch (err) {
    console.error("GROQ NATIVE TOOLS ERROR:", err);
  }
}

testNativeTools();

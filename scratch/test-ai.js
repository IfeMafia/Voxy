import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateGroqResponse } from '../src/lib/ai/providers/groq.js';

async function testGroq() {
  try {
    const res = await generateGroqResponse("una weldone o", "You are Voxy, an friendly store AI assistant.");
    console.log("GROQ DIRECT RESPONSE SUCCESS:", res);
  } catch (err) {
    console.error("GROQ DIRECT RESPONSE ERROR:", err);
  }
}

testGroq();

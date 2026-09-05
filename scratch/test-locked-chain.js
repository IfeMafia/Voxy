import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateAIResponse } from '../src/lib/ai/core/generateAIResponse.js';

async function testChain() {
  try {
    const res = await generateAIResponse("id like to add to my order", "You are Voxy AI assistant.");
    console.log("SUCCESSFULLY RESOLVED CHAIN:", res);
  } catch (err) {
    console.error("CHAIN ERROR:", err);
  }
}

testChain();

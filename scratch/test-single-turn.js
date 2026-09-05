import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { runReasoning } from '../src/lib/ai/agent/reasoning.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';
import { buildGroundedSystemPrompt } from '../src/lib/ai/models/promptBuilder.js';

const prisma = new PrismaClient();

async function debugSingleTurn() {
  const groundingService = createGroundingService({ businessId: 'beanshaven', db: prisma });
  const promptGrounding = await groundingService.buildPromptGrounding();
  const systemPrompt = buildGroundedSystemPrompt(promptGrounding);

  const history = [
    { role: 'user', content: 'id like to order Agbado' }
  ];

  console.log("\n--- TESTING SINGLE TURN: 'id like to order Agbado' ---");
  try {
    const res = await runReasoning({
      history,
      systemInstruction: systemPrompt,
      businessId: 'beanshaven',
      data: { db: prisma }
    });
    console.log("RESULT:", res);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

debugSingleTurn();

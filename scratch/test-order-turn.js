import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { runReasoning } from '../src/lib/ai/agent/reasoning.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';
import { buildGroundedSystemPrompt } from '../src/lib/ai/models/promptBuilder.js';

const prisma = new PrismaClient();

async function debugReasoning() {
  const groundingService = createGroundingService({ businessId: 'beanshaven', db: prisma });
  const promptGrounding = await groundingService.buildPromptGrounding();
  const systemPrompt = buildGroundedSystemPrompt(promptGrounding);

  console.log("--- SYSTEM PROMPT (First 300 chars) ---");
  console.log(systemPrompt.substring(0, 300));

  const history = [
    { role: 'user', content: 'id like to order Agbado' },
    { role: 'model', content: 'Great choice! How many portions of Agbado would you like?' },
    { role: 'user', content: '1' }
  ];

  console.log("\n--- RUNNING REASONING ---");
  const res = await runReasoning({
    history,
    systemInstruction: systemPrompt,
    businessId: 'beanshaven',
    data: { db: prisma }
  });

  console.log("\n--- REASONING OUTPUT ---");
  console.log("Text:", res.text);
  console.log("ToolCalls:", JSON.stringify(res.toolCalls, null, 2));

  await prisma.$disconnect();
}

debugReasoning();

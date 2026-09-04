import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { createConversationEngine } from '../src/lib/ai/agent/conversationEngine.js';

const prisma = new PrismaClient();

async function testTurn() {
  const engine = createConversationEngine({
    businessId: 'beanshaven',
    db: prisma
  });

  console.log("--- Testing Turn: 'ok im in gawgawlada' ---");
  try {
    const res = await engine.processMessage({
      conversationId: 'test-conv-gaw',
      message: 'ok im in gawgawlada',
      history: [
        { role: 'user', content: 'id like to order Agbado' },
        { role: 'model', content: 'Great choice! How many portions of Agbado would you like?' },
        { role: 'user', content: '1' },
        { role: 'model', content: 'Where should we deliver your order?' }
      ]
    });
    console.log("TURN RESULT:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("TURN ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testTurn();

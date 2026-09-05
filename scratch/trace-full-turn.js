import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { createConversationEngine } from '../src/lib/ai/agent/conversationEngine.js';

const prisma = new PrismaClient();

async function traceFullTurn() {
  const engine = createConversationEngine({
    businessId: 'beanshaven',
    db: prisma
  });

  console.log("--- TRACING TURN 1: 'id like to order Agbado' ---");
  try {
    const res = await engine.processMessage({
      conversationId: 'trace-conv-1',
      message: 'id like to order Agbado'
    });
    console.log("TRACE TURN 1 RESULT:", res);
  } catch (err) {
    console.error("TRACE TURN 1 ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

traceFullTurn();

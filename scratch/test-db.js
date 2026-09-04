import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

async function testPrismaDirect() {
  const client = new PrismaClient();
  try {
    const biz = await client.business.findFirst();
    console.log("SUCCESSFULLY QUERIED DB:", biz?.name);
  } catch (err) {
    console.error("DB QUERY ERROR:", err);
  } finally {
    await client.$disconnect();
  }
}

testPrismaDirect();

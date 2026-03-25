import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateCencoriResponse } from './src/lib/ai/providers/cencori.js';

/**
 * Cencori Smoke Test (SDK based)
 */
async function testCencoriSDK() {
  console.log('🧪 Starting Cencori SDK Smoke Test...');
  try {
    const res = await generateCencoriResponse(
      [{ role: 'user', parts: [{ text: 'Respond with "Cencori Active!"' }] }],
      'You are a system validator.'
    );
    console.log('✅ SDK Result:', res);
  } catch (error) {
    console.error('❌ SDK Error:', error.message);
    process.exit(1);
  }
}

testCencoriSDK();

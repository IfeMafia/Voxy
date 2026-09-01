import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config({ path: '.env.local' });
dotenv.config();

const cliKey = process.argv[2];
const apiKey = cliKey || process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error('❌ Error: GROQ_API_KEY not found.');
  console.error('Usage:');
  console.error('  node scripts/test-groq.js');
  console.error('  node scripts/test-groq.js <GROQ_API_KEY>');
  process.exit(1);
}

const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : '****';
console.log(`🔑 Groq Key: ${maskedKey}`);

async function runTest() {
  try {
    console.log('📡 Connecting to Groq Cloud...');
    const groq = new Groq({ apiKey });
    const start = Date.now();

    // 1. Fetch available models for this key
    const modelList = await groq.models.list();
    const availableModels = modelList.data.map((m) => m.id);
    console.log(`📋 Models Available (${availableModels.length}): ${availableModels.slice(0, 6).join(', ')}...`);

    // 2. Select a chat model (exclude safeguard/whisper/guard models)
    const chatModels = availableModels.filter(
      (m) => !m.includes('guard') && !m.includes('whisper') && !m.includes('embedding')
    );
    const testModel =
      chatModels.find((m) => m.includes('compound') || m.includes('llama') || m.includes('qwen')) ||
      chatModels[0] ||
      availableModels[0];

    console.log(`🤖 Testing chat completion with: ${testModel}...`);
    const completion = await groq.chat.completions.create({
      model: testModel,
      messages: [{ role: 'user', content: 'hi beans cake' }],
      max_tokens: 10,
    });

    const latency = Date.now() - start;
    const response = completion.choices[0]?.message?.content?.trim();

    console.log('\n✅ Groq API Key Valid:');
    console.log(`  - Model:   ${completion.model}`);
    console.log(`  - Latency: ${latency}ms`);
    console.log(`  - Output:  "${response}"\n`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Groq Test Failed:');
    console.error(`  - Message: ${error.message}`);
    if (error.status) console.error(`  - Status Code: ${error.status}`);
    process.exit(1);
  }
}

runTest();

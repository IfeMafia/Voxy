import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

dotenv.config({ path: '.env.local' });
dotenv.config();

const cliKey = process.argv[2];
const apiKey = cliKey || process.env.YARNGPT_API_KEY;
const sampleText = process.argv[3] || 'today na today, we go know who sabi pass, una good evening oo my people';
const voice = process.argv[4] || "Chinenye";

if (!apiKey) {
  console.error('❌ Error: YARNGPT_API_KEY not found.');
  console.error('\nUsage:');
  console.error('  node scripts/test-yarngpt.js <API_KEY> [TEXT] [VOICE]');
  console.error('  OR add YARNGPT_API_KEY=your_key_here to .env.local and run:');
  console.error('  node scripts/test-yarngpt.js');
  console.error('\nAvailable Voices:');
  console.error('  Idera, Emma, Zainab, Osagie, Wura, Jude, Chinenye, Tayo, Regina, Femi, Adaora, Umar, Mary');
  process.exit(1);
}

const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : '****';
console.log(`🔑 YarnGPT Key: ${maskedKey}`);
console.log(`🗣️ Voice: ${voice}`);
console.log(`📝 Text: "${sampleText}"`);

async function testYarnGpt() {
  const start = Date.now();
  console.log('📡 Sending TTS request to https://yarngpt.ai/api/v1/tts ...');

  try {
    const response = await fetch('https://yarngpt.ai/api/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: sampleText,
        voice: voice,
        response_format: 'mp3',
      }),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      let errBody;
      try {
        errBody = await response.json();
      } catch {
        errBody = await response.text();
      }
      console.error('\n❌ YarnGPT Request Failed:');
      console.error(`  - Status: ${response.status} ${response.statusText}`);
      console.error(`  - Details:`, typeof errBody === 'object' ? JSON.stringify(errBody, null, 2) : errBody);
      process.exit(1);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure tmp folder exists
    const outDir = path.resolve('tmp');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, 'yarngpt_test.mp3');
    fs.writeFileSync(outPath, buffer);

    console.log('\n✅ YarnGPT TTS Success:');
    console.log(`  - Latency:   ${latency}ms`);
    console.log(`  - File Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`  - Saved to:  ${outPath}\n`);

    playAudio(outPath);
  } catch (err) {
    console.error('\n❌ Network or Execution Error:');
    console.error(`  - Message: ${err.message}`);
    process.exit(1);
  }
}

function playAudio(filePath) {
  const absPath = path.resolve(filePath);
  console.log(`🔊 Autoplaying: ${absPath}`);

  const platform = process.platform;
  if (platform === 'win32') {
    exec(`start "" "${absPath}"`, (err) => {
      if (err) console.warn('⚠️ Could not autoplay audio automatically:', err.message);
    });
  } else if (platform === 'darwin') {
    exec(`afplay "${absPath}"`);
  } else {
    exec(`xdg-open "${absPath}"`);
  }
}

testYarnGpt();

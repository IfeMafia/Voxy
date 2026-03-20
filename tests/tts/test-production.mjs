import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateHybridSpeech } from '../../src/lib/ai/utils/hybridTts.js';
import fs from 'fs/promises';
import path from 'path';

async function runTest() {
  const samples = [
    { lang: 'yoruba', text: 'Bawo ni ojo re se ri? Inú mi dùn láti rí ọ.' },
    { lang: 'igbo', text: 'Kedu ka i mere? Daalụ maka ọrụ gị.' },
    { lang: 'hausa', text: 'Sannu yaya kake? Ina fatan kana lafiya.' },
    { lang: 'english', text: 'Hello, how are you doing today? Welcome to Voxy.' }
  ];

  console.log('\n=== Producing Multi-Tier TTS Test Files ===\n');

  for (const sample of samples) {
    try {
      console.log(`Processing ${sample.lang.toUpperCase()}...`);
      const dataUri = await generateHybridSpeech(sample.text, sample.lang);
      
      if (dataUri && dataUri.startsWith('data:audio/mp3;base64,')) {
        const base64 = dataUri.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        const filename = `test_${sample.lang}.mp3`;
        await fs.writeFile(path.join(process.cwd(), 'tests', 'tts', filename), buffer);
        console.log(`  ✅ Generated ${filename} (${buffer.length} bytes)`);
      } else {
        console.log(`  ❌ Failed to generate audio for ${sample.lang}`);
      }
    } catch (e) {
      console.error(`  ❌ Error for ${sample.lang}:`, e.message);
    }
  }

  console.log('\nTest files saved to ./tests/tts/\n');
}

runTest();

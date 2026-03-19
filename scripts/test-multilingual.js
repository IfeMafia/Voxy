import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { detectLanguageGemini, validateResponseLanguage } from '../src/lib/ai/utils/language.js';

const testCases = [
  { text: "How are you doing today?", expected: "english", name: "English Detection" },
  { text: "Bawo ni nkan? Se alaafia ni o wa?", expected: "yoruba", name: "Yoruba Detection" },
  { text: "Ina kwana? Lafiya lau, nagode.", expected: "hausa", name: "Hausa Detection" },
  { text: "Kedu ka i mere? A di m mma, imela.", expected: "igbo", name: "Igbo Detection" },
  { text: "Comment ça va?", expected: "unsupported", name: "French (Unsupported) Detection" },
  { text: "Hello, bawo ni?", expected: "english", name: "Mixed (English dominant) Detection" }, // Gemini might pick English or Yoruba, but English is first
  { text: "This is a test of the emergency broadcast system.", expected: "english", name: "Long English Detection" }
];

async function runTests() {
  console.log("🌍 Starting Multilingual Logic Verification...\n");
  
  let passed = 0;
  for (const tc of testCases) {
    try {
      const detected = await detectLanguageGemini(tc.text);
      if (detected === tc.expected) {
        console.log(`✅ [${tc.name}] Passed. Detected: ${detected}`);
        passed++;
      } else {
        console.log(`❌ [${tc.name}] Failed. Expected: ${tc.expected}, Got: ${detected}`);
      }
    } catch (err) {
      console.log(`❌ [${tc.name}] Error: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed.\n`);

  console.log("🧪 Testing Language Validation Layer...");
  const validYoruba = await validateResponseLanguage("E kaabo si ile itaja wa", "yoruba");
  console.log(`- Validate Yoruba in Yoruba: ${validYoruba}`);
  
  const invalidIgbo = await validateResponseLanguage("Hello how are you", "igbo");
  console.log(`- Validate English in Igbo (Should be false): ${invalidIgbo}`);

  console.log("\n🏁 Done.");
}

runTests();

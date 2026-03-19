import { generateHybridSpeech } from '../src/lib/ai/utils/hybridTts.js';

/**
 * 8. Example usage for Voxy Multilingual TTS Feature
 * Test run validating English, Yoruba, Igbo, and Hausa.
 */
async function runDemo() {
  console.log("=== Voxy Multilingual TTS Demo ===\n");

  const testCases = [
    { language: 'english', text: 'Welcome to Voxy. How can I assist you today?' },
    { language: 'yoruba', text: 'E kaabo si Voxy. Bawo ni mo se le ran o lowo loni?' },
    { language: 'igbo', text: 'Nnoo na Voxy. Kedu kem nwere ike isi nyere gi aka taa?' },
    { language: 'hausa', text: 'Barka da zuwa Voxy. Yaya zan iya taimaka muku a yau?' },
    
    // Testing unsupported language detection fallback (Feature 2 & 5)
    { language: 'german', text: 'Guten Tag, wie kann ich helfen?' }, 
    
    // Testing empty input safety (Feature 7)
    { language: 'yoruba', text: '' },
  ];

  for (const { language, text } of testCases) {
    try {
      console.log(`Testing [${language.toUpperCase()}]`);
      console.log(`Input: "${text}"`);
      
      const audioPath = await generateHybridSpeech(text, language);
      
      if (audioPath) {
        console.log(`SUCCESS: Audio ready to play in Voxy at: ${audioPath}\n`);
      } else {
        console.log(`SUCCESS: Empty text generation prevented safely.\n`);
      }
    } catch (error) {
      console.error(`ERROR: ${error.message}\n`);
    }
  }
}

// To run this demo, simply run:
// node examples/multilingual-tts-demo.js
runDemo();

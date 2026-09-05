import assert from 'node:assert';
import { detectLanguage, resolveLanguage, isPidgin } from '../../src/lib/langDetect.js';
import { buildGroundedSystemPrompt, MULTILINGUAL_GROUNDING_RULES } from '../../src/lib/ai/models/promptBuilder.js';
import { createConversationEngine } from '../../src/lib/ai/agent/conversationEngine.js';
import { getVoiceProvider } from '../../src/lib/ai/providers/voiceProvider.js';

async function runMultilingualTests() {
  console.log('🌐 Starting S11: Multilingual Support (Text + Voice) Tests (IFE-42)...\n');

  // ------------------------------------------------------------
  // Test 1: Yoruba Auto-Detection & Resolution
  // ------------------------------------------------------------
  console.log('======================================================================');
  console.log('Test 1: Yoruba Auto-Detection & Resolution');
  console.log('======================================================================');

  const yorubaMessage = "Ẹ kàásán o, mo fẹ́ ra bàtà àti ẹ̀wù tuntun gẹ́gẹ́ bí i àwọn fónù yi.";
  const yorubaDet = detectLanguage(yorubaMessage);
  console.log('  💬 Yoruba Input:', yorubaMessage);
  console.log('  🔍 Detected Language:', yorubaDet);
  assert.strictEqual(yorubaDet.langCode, 'yo');
  assert.strictEqual(yorubaDet.langName, 'Yoruba');
  console.log('✅ Test 1 passed: Yoruba message detected correctly\n');

  // ------------------------------------------------------------
  // Test 2: Code-Switched Nigerian Pidgin + English Handling
  // ------------------------------------------------------------
  console.log('======================================================================');
  console.log('Test 2: Code-Switched Nigerian Pidgin + English Handling');
  console.log('======================================================================');

  const pidginMessage = "How far, abeg wetin be the price of iPhone 15 Pro Max for your store?";
  console.log('  💬 Code-Switched Input:', pidginMessage);
  const pidginCheck = isPidgin(pidginMessage);
  console.log('  🇳🇬 Is Pidgin Heuristic Matched?:', pidginCheck);
  assert.strictEqual(pidginCheck, true);

  const pidginRes = resolveLanguage({ text: pidginMessage, supportedLanguages: ['en', 'pcm', 'yo', 'ha', 'ig'] });
  console.log('  🎯 Resolved Language Result:', pidginRes);
  assert.strictEqual(pidginRes.langCode, 'pcm');
  assert.strictEqual(pidginRes.langName, 'Nigerian Pidgin');
  assert.strictEqual(pidginRes.isSupported, true);
  console.log('✅ Test 2 passed: Code-switched Pidgin sentence handled without error or mis-classification\n');

  // ------------------------------------------------------------
  // Test 3: Business Data Preservation in Non-English System Prompts
  // ------------------------------------------------------------
  console.log('======================================================================');
  console.log('Test 3: Business Data Preservation Directives & System Prompt');
  console.log('======================================================================');

  const mockGrounding = {
    businessName: 'TechGadgets Nigeria',
    tone: 'consultative and friendly',
    language: 'Yoruba',
    isSupportedLanguage: true,
    businessSummary: 'Business Name: TechGadgets Nigeria\nOFFICIAL PRODUCT CATALOGUE:\n- MacBook Pro 14" M3: ₦2,450,000 | Stock: In stock',
  };

  const systemPrompt = buildGroundedSystemPrompt(mockGrounding);
  console.log('  📜 System Prompt Grounding Snippet:\n', systemPrompt.split('\n').filter(l => l.includes('Preservation') || l.includes('Language')).join('\n  '));
  assert.ok(systemPrompt.includes('MULTILINGUAL & DATA PRESERVATION RULES'));
  assert.ok(systemPrompt.includes('NEVER translate product names'));
  assert.ok(systemPrompt.includes('Primary Conversational Language: Yoruba'));
  console.log('✅ Test 3 passed: System prompt strictly protects product names and prices in non-English turns\n');

  // ------------------------------------------------------------
  // Test 4: Explicit Language Override
  // ------------------------------------------------------------
  console.log('======================================================================');
  console.log('Test 4: Explicit Language Preference Override');
  console.log('======================================================================');

  const overrideInput = {
    text: "Hello, I want to inquire about laptop prices",
    preferredLanguage: "Yoruba",
    supportedLanguages: ['en', 'yo', 'ha', 'ig', 'pcm']
  };
  const overrideRes = resolveLanguage(overrideInput);
  console.log('  💬 Input Text (English):', overrideInput.text);
  console.log('  ⚙️ Explicit Override:', overrideInput.preferredLanguage);
  console.log('  🎯 Resolved Output:', overrideRes);
  assert.strictEqual(overrideRes.langCode, 'yo');
  assert.strictEqual(overrideRes.langName, 'Yoruba');
  assert.strictEqual(overrideRes.isSupported, true);
  console.log('✅ Test 4 passed: Explicit language preference override takes precedence over auto-detection\n');

  // ------------------------------------------------------------
  // Test 5: Unsupported Language Graceful Fallback
  // ------------------------------------------------------------
  console.log('======================================================================');
  console.log('Test 5: Unsupported Language Graceful Fallback');
  console.log('======================================================================');

  const fallbackInput = {
    text: "Kèdèbè gbagbe mo fẹ́ ra fónù",
    preferredLanguage: "Igbo",
    supportedLanguages: ['en', 'yo'] // Store only supports English & Yoruba
  };
  const fallbackRes = resolveLanguage(fallbackInput);
  console.log('  💬 Customer Requested Language:', fallbackInput.preferredLanguage);
  console.log('  🏪 Store Supported Languages:', fallbackInput.supportedLanguages);
  console.log('  🛡️ Fallback Result:', fallbackRes);
  assert.strictEqual(fallbackRes.isSupported, false);
  assert.strictEqual(fallbackRes.isFallback, true);
  assert.strictEqual(fallbackRes.langCode, 'en'); // Defaults to primary supported language
  console.log('✅ Test 5 passed: Unsupported language fell back gracefully to business supported language\n');

  // ------------------------------------------------------------
  // Test 6: Voice TTS Synthesis in Hausa
  // ------------------------------------------------------------
  console.log('======================================================================');
  console.log('Test 6: Voice TTS Synthesis in Hausa');
  console.log('======================================================================');

  const hausaText = "Sannu! Muna da MacBook Pro a kan farashin naira miliyan biyu da dubu dari hudu da hamsin.";
  console.log('  🎙️ Hausa Text To Synthesize:', hausaText);
  const voiceProvider = getVoiceProvider({ forceHybrid: true });
  const ttsResult = await voiceProvider.synthesize(hausaText, { voice: 'Chinenye', language: 'Hausa' });
  console.log('  🔊 Synthesis Output:', {
    provider: ttsResult.provider,
    audioUrlLength: ttsResult.audioUrl?.length || 0,
    cleanText: ttsResult.cleanText
  });
  assert.ok(ttsResult.audioUrl && ttsResult.audioUrl.startsWith('data:audio/'));
  assert.strictEqual(ttsResult.cleanText, hausaText);
  console.log('✅ Test 6 passed: Hausa spoken response generated successfully through TTS layer\n');

  console.log('🎉 ALL S11 MULTILINGUAL SUPPORT (TEXT + VOICE) TESTS PASSED SUCCESSFULLY!\n');
}

runMultilingualTests().catch((err) => {
  console.error('❌ Multilingual Test Failed:', err);
  process.exit(1);
});

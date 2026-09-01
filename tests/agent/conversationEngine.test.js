/**
 * S4: Customer Conversation Engine & Intent Routing Tests (AI-104).
 *
 * Tests:
 * 1. Intent classification across all 6 intents (GREETING, PRODUCT_INQUIRY,
 *    RECOMMENDATION_REQUEST, ORDER_INTENT, SUPPORT_POLICY, HUMAN_HANDOFF).
 * 2. Complex complaints or explicit "let me talk to a human" trigger HUMAN_HANDOFF.
 * 3. Conversation context retains customer preferences across 5+ turns.
 * 4. Latency performance (< 1.5s).
 * 5. Full agent responses and details printed to console.
 */

import assert from 'node:assert';
import {
  IntentClassifier,
  classifyIntent
} from '../../src/lib/ai/agent/intentClassifier.js';
import {
  HandoffManager,
  createHandoffManager
} from '../../src/lib/ai/agent/handoffManager.js';
import {
  ConversationEngine,
  createConversationEngine
} from '../../src/lib/ai/agent/conversationEngine.js';
import { IntentType, HandoffReason } from '../../src/lib/ai/agent/types.js';

// Mock DB for business and conversation
const MOCK_BUSINESS = {
  id: 'biz_gadgets',
  ownerUserId: 'user_owner_001',
  name: 'Voxy Gadgets Lagos',
  description: 'Premium electronics and accessories in Lagos.',
  hours: 'Mon-Sat 9am - 6pm',
  policies: JSON.stringify({
    returns: 'Items can be returned within 7 days in original condition.',
    refunds: 'Refunds processed within 3 business days.',
    delivery: 'Delivery takes 24-48 hours within Lagos.',
    payment: 'Paystack, bank transfer, and card payment accepted.'
  }),
  deliveryInfo: 'Lagos Island, Victoria Island, Lekki, Ikeja',
  supportedLanguages: ['en', 'pcm']
};

const mockDb = {
  business: {
    findUnique: async () => MOCK_BUSINESS
  },
  conversation: {
    findUnique: async () => null,
    update: async () => ({ id: 'conv_test_1', status: 'handed_off' })
  }
};

async function runTests() {
  console.log('🧪 Starting S4: Customer Conversation Engine & Intent Routing Tests (AI-104)...\n');

  // =========================================================================
  // Test 1: Intent Classification across all 6 intents
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 1: Intent Classifier (all 6 intents + Nigerian vernacular)');

  const testCases = [
    { text: 'Hello, good afternoon!', expected: IntentType.GREETING },
    { text: 'How far, wetin dey happen?', expected: IntentType.GREETING },
    { text: 'Do you have iPhone 13 in stock and what is the price?', expected: IntentType.PRODUCT_INQUIRY },
    { text: 'Can you recommend a good laptop for video editing under 600k?', expected: IntentType.RECOMMENDATION_REQUEST },
    { text: 'I want to place an order for the blue headphones now', expected: IntentType.ORDER_INTENT },
    { text: 'What is your return policy for broken items?', expected: IntentType.SUPPORT_POLICY },
    { text: 'Do you deliver to Lekki Phase 1?', expected: IntentType.SUPPORT_POLICY },
    { text: 'Let me speak to a human agent right now', expected: IntentType.HUMAN_HANDOFF },
    { text: 'This is fraud! You charged me twice and sent nothing, I will report you to EFCC!', expected: IntentType.HUMAN_HANDOFF }
  ];

  for (const tc of testCases) {
    const res = IntentClassifier.classify(tc.text);
    console.log(`  💬 Input: "${tc.text}"`);
    console.log(`     -> Classified: [${res.intent}] (Confidence: ${(res.confidence * 100).toFixed(0)}%, Reason: ${res.reason})`);
    assert.strictEqual(res.intent, tc.expected);
  }
  console.log('✅ Test 1 passed: All 6 intents accurately classified including Pidgin\n');

  // =========================================================================
  // Test 2: Explicit Human Request Triggers HUMAN_HANDOFF Flag
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 2: Explicit "let me talk to a human" Triggers HUMAN_HANDOFF (PRD §4.8)');

  let notifiedUrgency = null;
  const mockNotifier = async (convId, urgency) => {
    notifiedUrgency = urgency;
  };

  const handoffManager = createHandoffManager({
    db: mockDb,
    notifier: mockNotifier
  });

  const engine = createConversationEngine({
    businessId: 'biz_gadgets',
    db: mockDb,
    handoffManager,
    reasoningRunner: async () => ({ text: 'Reasoning should not be called on handoff' })
  });

  const explicitMessage = 'I want to speak with a human manager immediately.';
  console.log(`  💬 Customer Input: "${explicitMessage}"`);

  const explicitResult = await engine.processMessage({
    conversationId: 'conv_handoff_1',
    message: explicitMessage
  });

  console.log('  🤖 Voxy Response:');
  console.log(`     "${explicitResult.response}"`);
  console.log('  [Handoff Payload]:', {
    triggered: explicitResult.handoff.triggered,
    reason: explicitResult.handoff.reason,
    customerMessage: explicitResult.handoff.customerMessage
  });
  console.log(`  [Business Owner Alert]: Urgency = ${notifiedUrgency}`);

  assert.strictEqual(explicitResult.intent, IntentType.HUMAN_HANDOFF);
  assert.strictEqual(explicitResult.handoff.triggered, true);
  assert.strictEqual(explicitResult.handoff.reason, HandoffReason.EXPLICIT_REQUEST);
  assert.ok(explicitResult.response.includes('human team member'));
  assert.strictEqual(notifiedUrgency, 'high');
  console.log('✅ Test 2 passed: Explicit human request cleanly triggered handoff & owner alert\n');

  // =========================================================================
  // Test 3: Complex Complaint Triggers HUMAN_HANDOFF Flag
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 3: Complex Complaint / Fraud Accusation Triggers Urgent Handoff');

  const complaintMessage = 'This store is a scam! You debited my account twice and your product is damaged. I am suing you!';
  console.log(`  💬 Customer Input: "${complaintMessage}"`);

  const complaintResult = await engine.processMessage({
    conversationId: 'conv_handoff_2',
    message: complaintMessage
  });

  console.log('  🤖 Voxy Empathy Response:');
  console.log(`     "${complaintResult.response}"`);
  console.log('  [Handoff Payload]:', {
    triggered: complaintResult.handoff.triggered,
    reason: complaintResult.handoff.reason
  });
  console.log(`  [Business Owner Alert]: Urgency = ${notifiedUrgency}`);

  assert.strictEqual(complaintResult.intent, IntentType.HUMAN_HANDOFF);
  assert.strictEqual(complaintResult.handoff.triggered, true);
  assert.strictEqual(complaintResult.handoff.reason, HandoffReason.COMPLEX_COMPLAINT);
  assert.strictEqual(notifiedUrgency, 'urgent');
  assert.ok(complaintResult.response.includes('management'));
  console.log('✅ Test 3 passed: Complaint automatically escalated to management with urgent priority\n');

  // =========================================================================
  // Test 4: Conversation Context Retains Customer Preferences Across 5+ Turns
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 4: Multi-Turn Context Retention Across 5+ Turns');

  // Mock reasoning runner that responds based on system prompt and input
  const multiTurnEngine = createConversationEngine({
    businessId: 'biz_gadgets',
    db: mockDb,
    reasoningRunner: async (req) => {
      // Echo key context back to verify retention
      return {
        text: `I understand you are looking for ${req.messages.slice(-1)[0].content}.`,
        provider: 'groq'
      };
    }
  });

  const conversationId = 'conv_multiturn_state_test';
  const turns = [
    { text: 'Hi, good morning!', expectedIntent: IntentType.GREETING },
    { text: 'I need a new phone for photography', expectedCategory: 'phone' },
    { text: 'My budget is around 450k', expectedBudget: 450000 },
    { text: 'I also like the iPhone 13 Pro', expectedProduct: 'iPhone 13 Pro' },
    { text: 'Can you deliver to Lekki Phase 1?', expectedLocation: 'Lekki' },
    { text: 'What is your return policy if it has an issue?', expectedIntent: IntentType.SUPPORT_POLICY }
  ];

  let turnIndex = 1;
  for (const turn of turns) {
    console.log(`\n  --- Turn ${turnIndex}: Customer Message ---`);
    console.log(`  💬 Customer: "${turn.text}"`);

    const turnResult = await multiTurnEngine.processMessage({
      conversationId,
      message: turn.text
    });

    console.log(`  🤖 Voxy: "${turnResult.response}"`);
    console.log(`  🧠 Retained Session State:`, {
      turnCount: turnResult.context.turnCount,
      preferredCategory: turnResult.context.preferredCategory,
      budget: turnResult.context.budget ? `₦${turnResult.context.budget.toLocaleString()}` : null,
      deliveryLocation: turnResult.context.deliveryLocation,
      interestedProducts: turnResult.context.interestedProducts
    });

    if (turn.expectedCategory) {
      assert.strictEqual(turnResult.context.preferredCategory, turn.expectedCategory);
    }
    if (turn.expectedBudget) {
      assert.strictEqual(turnResult.context.budget, turn.expectedBudget);
    }
    if (turn.expectedLocation) {
      assert.strictEqual(turnResult.context.deliveryLocation, turn.expectedLocation);
    }
    if (turn.expectedProduct) {
      assert.ok(turnResult.context.interestedProducts.includes(turn.expectedProduct));
    }
    if (turn.expectedIntent) {
      assert.strictEqual(turnResult.intent, turn.expectedIntent);
    }

    turnIndex++;
  }

  // Verify final state after 6 full turns
  const finalContext = multiTurnEngine.getSessionContext(conversationId);
  console.log('\n  [Final Retained Context after 6 turns]:');
  console.log('   - Total turns recorded: ', finalContext.turnCount);
  console.log('   - Category retained:    ', finalContext.preferredCategory);
  console.log('   - Budget retained:      ', `₦${finalContext.budget?.toLocaleString()}`);
  console.log('   - Delivery area retained:', finalContext.deliveryLocation);
  console.log('   - Products retained:    ', finalContext.interestedProducts.join(', '));

  assert.strictEqual(finalContext.turnCount, 6);
  assert.strictEqual(finalContext.preferredCategory, 'phone');
  assert.strictEqual(finalContext.budget, 450000);
  assert.strictEqual(finalContext.deliveryLocation, 'Lekki');
  assert.ok(finalContext.interestedProducts.includes('iPhone 13 Pro'));
  console.log('\n✅ Test 4 passed: Seamless customer state retention across 6 continuous turns\n');

  // =========================================================================
  // Test 5: Latency Performance (< 1.5s)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 5: Response Latency Performance Verification (< 1.5s)');

  const latencyEngine = createConversationEngine({
    businessId: 'biz_gadgets',
    db: mockDb,
    reasoningRunner: async () => ({ text: 'Here are our options under 450k.' })
  });

  const startPerf = Date.now();
  const perfResult = await latencyEngine.processMessage({
    conversationId: 'conv_perf_1',
    message: 'What phones do you have?'
  });
  const elapsed = Date.now() - startPerf;

  console.log(`  ⏱️ Total Process Turn Latency: ${elapsed}ms (Engine recorded: ${perfResult.latencyMs}ms)`);
  assert.ok(elapsed < 1500, `Expected latency < 1500ms, got ${elapsed}ms`);
  console.log('✅ Test 5 passed: Response latency well within < 1.5s threshold\n');

  console.log('======================================================================');
  console.log('🎉 ALL S4 CONVERSATION ENGINE & INTENT ROUTING TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ S4 test suite failed:', err);
  process.exit(1);
});

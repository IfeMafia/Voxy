/**
 * S5: Sales Employee Behavior & Objection Handling Tests (AI-105).
 *
 * Validates:
 * 1. Single clarifying question rule (never overwhelming the customer).
 * 2. Price objection handling: Suggests budget-friendly alternative rather than hallucinating unauthorized discounts.
 * 3. Value articulation: Highlights quality and verified benefits.
 * 4. Non-pushy cross-sell: Suggests 1 complementary accessory after interest is established.
 * 5. Delivery & sizing objection handling citing verified policies.
 * 6. End-to-end integration through ConversationEngine.
 */

import assert from 'node:assert';
import { SalesPlaybook, DiscoveryDimension } from '../../src/lib/ai/agent/sales/salesPlaybook.js';
import { ObjectionHandler, ObjectionType } from '../../src/lib/ai/agent/sales/objectionHandler.js';
import { ConversationEngine, createConversationEngine } from '../../src/lib/ai/agent/conversationEngine.js';
import { buildGroundedSystemPrompt, SALES_EMPLOYEE_RULES } from '../../src/lib/ai/models/promptBuilder.js';

// Sample verified business catalog
const MOCK_CATALOG = [
  {
    id: 'prod_1',
    name: 'iPhone 15 Pro',
    category: 'phone',
    price: 1350000,
    highlights: 'Aerospace-grade titanium frame with all-day battery life and pro cameras'
  },
  {
    id: 'prod_2',
    name: 'iPhone 13',
    category: 'phone',
    price: 650000,
    highlights: 'Incredible Super Retina OLED display and reliable dual-camera system at an accessible price'
  },
  {
    id: 'prod_3',
    name: 'Silicone Protective Case',
    category: 'phone',
    price: 25000,
    highlights: 'Drop-tested shock absorbent grip with microfiber interior'
  },
  {
    id: 'prod_4',
    name: '9H Tempered Glass Screen Protector',
    category: 'phone',
    price: 10000,
    highlights: 'Scratch-resistant ultra-clarity screen armor'
  }
];

const MOCK_POLICIES = {
  returns: 'Items in original sealed condition can be returned within 7 days.',
  refunds: 'Refunds are processed within 3 business days to the original account.',
  delivery: 'Standard dispatch takes 24 to 48 hours within covered areas in Lagos.',
  payment: 'Payment via secure transfer or debit card.'
};

const MOCK_BUSINESS = {
  id: 'biz_sales_test',
  name: 'Lagos Tech Hub',
  ownerUserId: 'owner_123',
  hours: 'Mon-Sat 9am-6pm',
  policies: JSON.stringify(MOCK_POLICIES),
  products: MOCK_CATALOG,
  deliveryInfo: 'Victoria Island, Lekki, Ikoyi, Ikeja'
};

const mockDb = {
  business: {
    findUnique: async () => MOCK_BUSINESS
  },
  conversation: {
    findUnique: async () => null,
    update: async () => ({ id: 'conv_s5', status: 'active' })
  }
};

async function runTests() {
  console.log('🧪 Starting S5: Sales Employee Behavior & Objection Handling Tests (AI-105)...\n');

  // =========================================================================
  // Test 1: Need Discovery — Exactly 1 targeted clarifying question at a time
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 1: Need Discovery — 1 Targeted Question Rule');
  console.log('======================================================================');

  const contextEmpty = {};
  const q1 = SalesPlaybook.determineDiscoveryQuestion(contextEmpty);
  console.log('  1. Empty context discovery:');
  console.log('     Dimension:', q1.dimension);
  console.log('     Question: ', q1.question);
  assert.strictEqual(q1.dimension, DiscoveryDimension.CATEGORY);
  assert.strictEqual(SalesPlaybook.adheresToSingleQuestionRule(q1.question), true);

  const contextWithCategory = { preferredCategory: 'phone' };
  const q2 = SalesPlaybook.determineDiscoveryQuestion(contextWithCategory);
  console.log('\n  2. Category known, budget missing:');
  console.log('     Dimension:', q2.dimension);
  console.log('     Question: ', q2.question);
  assert.strictEqual(q2.dimension, DiscoveryDimension.BUDGET);
  assert.strictEqual(SalesPlaybook.adheresToSingleQuestionRule(q2.question), true);

  const contextWithBudget = { preferredCategory: 'phone', budget: 700000 };
  const q3 = SalesPlaybook.determineDiscoveryQuestion(contextWithBudget);
  console.log('\n  3. Budget known, variant/spec missing:');
  console.log('     Dimension:', q3.dimension);
  console.log('     Question: ', q3.question);
  assert.strictEqual(q3.dimension, DiscoveryDimension.SIZE_OR_VARIANT);
  assert.strictEqual(SalesPlaybook.adheresToSingleQuestionRule(q3.question), true);

  console.log('✅ Test 1 passed!\n');

  // =========================================================================
  // Test 2: Price Objection — Budget Alternative over Hallucinated Discounts
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 2: Price Objection — Suggests Budget Alternative Without Discounts');
  console.log('======================================================================');

  const customerMessage = "Omo, 1.35m is too expensive! Can you reduce the price or give me 20% discount?";
  const objectionCheck = ObjectionHandler.detectObjection(customerMessage);
  console.log('  💬 Customer:', customerMessage);
  console.log('  🔍 Detected Objection:', objectionCheck.hasObjection, `(${objectionCheck.type})`);
  assert.strictEqual(objectionCheck.hasObjection, true);
  assert.strictEqual(objectionCheck.type, ObjectionType.PRICE);

  const handled = ObjectionHandler.handleObjection({
    objectionType: objectionCheck.type,
    customerMessage,
    currentProduct: MOCK_CATALOG[0], // iPhone 15 Pro
    catalog: MOCK_CATALOG,
    policies: MOCK_POLICIES,
    businessName: MOCK_BUSINESS.name
  });

  console.log('  🤖 Voxy Response:');
  console.log('    ', handled.response);
  console.log('  🎯 Suggested Alternative:', handled.suggestedAlternative?.name, `(₦${handled.suggestedAlternative?.price.toLocaleString()})`);

  // Assertions:
  assert.strictEqual(handled.handled, true);
  assert.strictEqual(handled.suggestedAlternative?.name, 'iPhone 13');
  // Strict rule: No hallucination of discounts or coupons
  assert.strictEqual(/20% discount/i.test(handled.response), false);
  assert.strictEqual(/promo code/i.test(handled.response), false);
  assert.strictEqual(/we can give you a discount/i.test(handled.response), false);
  assert.ok(handled.response.includes('iPhone 13'));

  console.log('✅ Test 2 passed!\n');

  // =========================================================================
  // Test 3: Value Articulation — Quality Selling Points vs Dry Specs
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 3: Value Articulation');
  console.log('======================================================================');

  const pitch = SalesPlaybook.articulateValue(MOCK_CATALOG[0]);
  console.log('  ✨ Articulated Pitch:');
  console.log('    ', pitch);
  assert.ok(pitch.includes('Aerospace-grade titanium'));
  assert.ok(pitch.includes('iPhone 15 Pro'));
  console.log('✅ Test 3 passed!\n');

  // =========================================================================
  // Test 4: Non-Pushy Upselling & Cross-Selling
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 4: Non-Pushy Cross-Selling Add-On');
  console.log('======================================================================');

  const addOn = SalesPlaybook.suggestAddOn(MOCK_CATALOG[0], MOCK_CATALOG);
  console.log('  🎁 Primary Product:', MOCK_CATALOG[0].name);
  console.log('  ➕ Suggested Add-on:', addOn?.suggestedProduct?.name);
  console.log('  🗣️ Pitch:');
  console.log('    ', addOn?.pitch);

  assert.ok(addOn);
  assert.strictEqual(addOn.suggestedProduct.name, 'Silicone Protective Case');
  assert.ok(addOn.pitch.includes('Silicone Protective Case'));
  assert.strictEqual(SalesPlaybook.adheresToSingleQuestionRule(addOn.pitch), true);

  console.log('✅ Test 4 passed!\n');

  // =========================================================================
  // Test 5: Delivery & Sizing Objections Citing Approved Policies
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 5: Delivery and Sizing Objections');
  console.log('======================================================================');

  const deliveryMsg = "Why does it take 2 days? That is too slow!";
  const delObj = ObjectionHandler.detectObjection(deliveryMsg);
  console.log('  💬 Customer Delivery Concern:', deliveryMsg);
  assert.strictEqual(delObj.type, ObjectionType.DELIVERY_TIME);
  const delRes = ObjectionHandler.handleObjection({
    objectionType: delObj.type,
    customerMessage: deliveryMsg,
    policies: MOCK_POLICIES
  });
  console.log('  🤖 Voxy Delivery Response:');
  console.log('    ', delRes.response);
  assert.ok(delRes.response.includes('24 to 48 hours'));

  const sizeMsg = "What if the size is wrong and it doesn't fit?";
  const sizeObj = ObjectionHandler.detectObjection(sizeMsg);
  console.log('\n  💬 Customer Sizing Concern:', sizeMsg);
  assert.strictEqual(sizeObj.type, ObjectionType.SIZING_OR_FIT);
  const sizeRes = ObjectionHandler.handleObjection({
    objectionType: sizeObj.type,
    customerMessage: sizeMsg,
    policies: MOCK_POLICIES
  });
  console.log('  🤖 Voxy Sizing Response:');
  console.log('    ', sizeRes.response);
  assert.ok(sizeRes.response.includes('7 days'));

  console.log('✅ Test 5 passed!\n');

  // =========================================================================
  // Test 6: Prompt Builder Injects PRD §6.4 Sales Directives
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 6: Prompt Builder Sales Guardrails');
  console.log('======================================================================');

  const prompt = buildGroundedSystemPrompt({
    businessName: MOCK_BUSINESS.name,
    businessSummary: 'Electronics retailer'
  });
  console.log('  📜 Verifying Prompt Directives:');
  assert.ok(prompt.includes('SALES EMPLOYEE BEHAVIOR & OBJECTION RULES (PRD §6.4)'));
  assert.ok(prompt.includes('Ask only ONE targeted question at a time'));
  assert.ok(prompt.includes('NEVER fabricate discounts'));
  console.log('  ✅ Sales rules verified in system prompt!');

  // =========================================================================
  // Test 7: Conversation Engine Full Integration Turn
  // =========================================================================
  console.log('\n======================================================================');
  console.log('Test 7: Conversation Engine End-to-End Objection Handling');
  console.log('======================================================================');

  const mockReasoningRunner = async (req) => {
    const turns = req.messages || req.history || [];
    const hasPriceObjection = turns.some(m => typeof m.content === 'string' && (m.content.toLowerCase().includes('expensive') || m.content.toLowerCase().includes('reduce')));
    if (hasPriceObjection) {
      return { text: "I understand your budget consideration! However, if you would prefer a more budget-friendly option, we have the iPhone 13 at ₦650,000. Would you like details on that?" };
    }
    return { text: "Welcome! We have the iPhone 15 Pro available." };
  };

  const engine = createConversationEngine({
    businessId: MOCK_BUSINESS.id,
    db: mockDb,
    reasoningRunner: mockReasoningRunner
  });

  // Turn 1: Product interest
  await engine.processMessage({
    conversationId: 'conv_sales_test',
    message: 'I am looking for an iPhone 15 Pro'
  });

  // Turn 2: Customer brings up price objection
  const result = await engine.processMessage({
    conversationId: 'conv_sales_test',
    message: 'That is too expensive for me. Can you reduce the price?'
  });

  console.log('  💬 Customer: "That is too expensive for me. Can you reduce the price?"');
  console.log('  🤖 Voxy:');
  console.log('    ', result.response);

  assert.strictEqual(result.ok, true);
  assert.ok(result.response.includes('iPhone 13'));
  assert.ok(result.response.includes('budget-friendly'));
  assert.strictEqual(result.handoff.triggered, false);

  console.log('\n🎉 ALL S5 SALES EMPLOYEE BEHAVIOR & OBJECTION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n❌ S5 TEST SUITE FAILED:');
  console.error(err);
  process.exit(1);
});

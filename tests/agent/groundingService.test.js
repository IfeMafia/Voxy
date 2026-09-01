/**
 * Tests for S3: Business Knowledge Grounding & Policies Engine (AI-103).
 *
 * Requirements:
 * 1. Asking about a delivery area the business doesn't serve returns a truthful refusal
 *    grounded in the actual business profile — not a guess.
 * 2. Return-policy questions quote the business's exact stored return terms verbatim,
 *    not a paraphrase or invention.
 * 3. Zero hallucination: if information is missing or unconfigured, replies with
 *    "I'll check with the business owner" rather than making up answers.
 * 4. Multi-tenant scoping: correct isolation per businessId without cross-tenant leakage.
 * 5. Handles success and error states (missing policy, missing profile, T4 backend error).
 */

import assert from 'node:assert';
import {
  BusinessDataGateway,
  createBusinessDataGateway
} from '../../src/lib/ai/agent/businessData.js';
import {
  PolicyChecker,
  createPolicyChecker
} from '../../src/lib/ai/agent/knowledge/policyChecker.js';
import {
  GroundingService,
  createGroundingService
} from '../../src/lib/ai/agent/knowledge/groundingService.js';
import {
  buildGroundedSystemPrompt,
  GROUNDING_POLICY_RULES
} from '../../src/lib/ai/models/promptBuilder.js';
import { buildSystemInstruction } from '../../src/lib/ai/agent/systemInstruction.js';

// Mock DB data for two distinct tenants
const MOCK_BUSINESSES = {
  'biz_electronics': {
    id: 'biz_electronics',
    ownerUserId: 'secret_user_999',
    name: 'TechHub Lagos',
    description: 'Premier gadget store in Lagos.',
    hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      sunday: { closed: true }
    },
    policies: JSON.stringify({
      returns: 'All electronic items have a strict 7-day return window in original seal.',
      refunds: 'Refunds will be credited to original bank account within 48 hours.',
      delivery: 'Same-day delivery within Lagos Island for orders before 2pm.',
      payment: 'Accepts Paystack card payments and direct bank transfer.'
    }),
    deliveryInfo: 'Lagos Island, Victoria Island, Lekki Phase 1, Ikoyi',
    supportedLanguages: ['en', 'pcm'],
    aiConfig: {
      tone: 'professional and crisp',
      instructions: 'Always emphasize genuine warranty.'
    }
  },
  'biz_bakery': {
    id: 'biz_bakery',
    ownerUserId: 'secret_user_888',
    name: 'Sweet Crust Abuja',
    description: 'Artisan pastries and custom cakes.',
    hours: 'Mon-Sat 8am - 6pm',
    policies: JSON.stringify({
      returns: 'Perishable bakery items cannot be returned once delivered.',
      refunds: 'Replacements provided only for damaged deliveries reported within 2 hours.',
      delivery: 'Deliveries across central Abuja only.',
      payment: 'Card and transfer on confirmation.'
    }),
    deliveryInfo: 'Wuse, Garki, Maitama, Asokoro',
    supportedLanguages: ['en', 'ha'],
    aiConfig: {
      tone: 'warm and delightful',
      instructions: 'Offer birthday cake customisation.'
    }
  },
  'biz_sparse': {
    id: 'biz_sparse',
    ownerUserId: 'secret_user_777',
    name: 'Minimal Store',
    description: 'Store with no policies or delivery info configured yet.',
    hours: null,
    policies: null,
    deliveryInfo: null,
    supportedLanguages: ['en'],
    aiConfig: null
  }
};

// Mock DB client implementing findUnique
const mockDb = {
  business: {
    findUnique: async ({ where }) => {
      return MOCK_BUSINESSES[where.id] ?? null;
    }
  }
};

async function runTests() {
  console.log('🧪 Starting S3: Business Knowledge Grounding & Policies Engine Tests...\n');

  // =========================================================================
  // Test 1: Delivery Area Truthful Refusal (Requirement 1)
  // =========================================================================
  console.log('Test 1: Asking about an unserved delivery area returns truthful refusal...');
  const electronicsGateway = createBusinessDataGateway({ businessId: 'biz_electronics', db: mockDb });
  const electronicsProfile = await electronicsGateway.getBusinessProfile();
  const electronicsPolicies = await electronicsGateway.getPolicies();

  const electronicsChecker = createPolicyChecker({
    profile: electronicsProfile,
    policies: electronicsPolicies
  });

  // Query location not in delivery areas (e.g. "Kano" or "Ibadan" or "Ikorodu")
  const refusalResult = electronicsChecker.checkDeliveryArea('Kano');
  assert.strictEqual(refusalResult.supported, false);
  assert.ok(
    refusalResult.message.includes('We do not deliver to Kano'),
    'Expected refusal message to explicitly state location is not served'
  );
  assert.ok(
    refusalResult.message.includes('Lagos Island'),
    'Expected refusal message to cite approved delivery areas truthfully'
  );

  // Query location that IS served (e.g. "Victoria Island")
  const servedResult = electronicsChecker.checkDeliveryArea('Victoria Island');
  assert.strictEqual(servedResult.supported, true);
  assert.ok(
    servedResult.message.includes('Yes, we deliver to Victoria Island'),
    'Expected confirmation for served area'
  );
  console.log('✅ Test 1 passed!');

  // =========================================================================
  // Test 2: Return Policy Quoted Verbatim (Requirement 2)
  // =========================================================================
  console.log('Test 2: Return policy queries quote exact business return terms verbatim...');
  const returnPolicy = electronicsChecker.getReturnPolicy();
  assert.strictEqual(returnPolicy.available, true);
  assert.strictEqual(
    returnPolicy.terms,
    'All electronic items have a strict 7-day return window in original seal.',
    'Expected exact verbatim match of stored return policy'
  );
  assert.strictEqual(
    returnPolicy.message,
    'All electronic items have a strict 7-day return window in original seal.'
  );

  // Check bakery return policy
  const bakeryGateway = createBusinessDataGateway({ businessId: 'biz_bakery', db: mockDb });
  const bakeryProfile = await bakeryGateway.getBusinessProfile();
  const bakeryPolicies = await bakeryGateway.getPolicies();
  const bakeryChecker = createPolicyChecker({ profile: bakeryProfile, policies: bakeryPolicies });

  const bakeryReturns = bakeryChecker.getReturnPolicy();
  assert.strictEqual(
    bakeryReturns.terms,
    'Perishable bakery items cannot be returned once delivered.',
    'Expected exact verbatim return policy for bakery'
  );
  console.log('✅ Test 2 passed!');

  // =========================================================================
  // Test 3: Strict Honesty when Information is Missing (Requirement 3)
  // =========================================================================
  console.log('Test 3: Missing or unconfigured policies return strict honesty ("I\'ll check with the business owner")...');
  const sparseGateway = createBusinessDataGateway({ businessId: 'biz_sparse', db: mockDb });
  const sparseProfile = await sparseGateway.getBusinessProfile();
  const sparsePolicies = await sparseGateway.getPolicies();
  const sparseChecker = createPolicyChecker({ profile: sparseProfile, policies: sparsePolicies });

  // Missing return policy
  const missingReturns = sparseChecker.getReturnPolicy();
  assert.strictEqual(missingReturns.available, false);
  assert.ok(
    missingReturns.message.includes("check with the business owner"),
    `Expected honesty message, got: ${missingReturns.message}`
  );

  // Missing delivery area
  const unconfiguredDelivery = sparseChecker.checkDeliveryArea('Lagos');
  assert.strictEqual(unconfiguredDelivery.supported, false);
  assert.ok(
    unconfiguredDelivery.message.includes("check with the business owner"),
    `Expected honesty message for unconfigured delivery, got: ${unconfiguredDelivery.message}`
  );

  // Arbitrary topic via extractPolicyAnswer
  const unknownAnswer = sparseChecker.extractPolicyAnswer('international warranty');
  assert.strictEqual(unknownAnswer.available, false);
  assert.ok(
    unknownAnswer.answer.includes("check with the business owner"),
    `Expected honesty fallback for unknown policy, got: ${unknownAnswer.answer}`
  );
  console.log('✅ Test 3 passed!');

  // =========================================================================
  // Test 4: Multi-Tenant Scoping & Zero Cross-Tenant Data Leakage
  // =========================================================================
  console.log('Test 4: Correct scoping per businessId with zero cross-tenant leakage...');
  const groundingServiceA = createGroundingService({ businessId: 'biz_electronics', db: mockDb });
  const groundingServiceB = createGroundingService({ businessId: 'biz_bakery', db: mockDb });

  const contextA = await groundingServiceA.getGroundingContext();
  const contextB = await groundingServiceB.getGroundingContext();

  assert.strictEqual(contextA.profile.name, 'TechHub Lagos');
  assert.strictEqual(contextB.profile.name, 'Sweet Crust Abuja');

  // Verify A does not contain B facts
  assert.ok(!contextA.businessSummary.includes('Sweet Crust Abuja'));
  assert.ok(!contextA.businessSummary.includes('Perishable bakery items'));
  assert.ok(!contextA.businessSummary.includes('Maitama'));

  // Verify B does not contain A facts
  assert.ok(!contextB.businessSummary.includes('TechHub Lagos'));
  assert.ok(!contextB.businessSummary.includes('7-day return window in original seal'));
  assert.ok(!contextB.businessSummary.includes('Lekki Phase 1'));

  // Verify sanitization: NO internal user/owner IDs leaked
  assert.ok(!contextA.businessSummary.includes('secret_user_999'));
  assert.ok(!contextB.businessSummary.includes('secret_user_888'));
  console.log('✅ Test 4 passed!');

  // =========================================================================
  // Test 5: Prompt Builder & System Instruction Anti-Hallucination Guardrails
  // =========================================================================
  console.log('Test 5: Prompt builder injects dynamic business context and strict rules...');
  const promptGrounding = await groundingServiceA.buildPromptGrounding();
  const systemPrompt = buildGroundedSystemPrompt(promptGrounding);

  // Check persona & guardrails
  assert.ok(systemPrompt.includes('You are Voxy'));
  assert.ok(systemPrompt.includes('STRICT POLICY & FACTUAL GROUNDING RULES'));
  assert.ok(systemPrompt.includes('Zero Hallucination'));
  assert.ok(systemPrompt.includes("I'll check with the business owner"));

  // Check business-specific context
  assert.ok(systemPrompt.includes('TechHub Lagos'));
  assert.ok(systemPrompt.includes('All electronic items have a strict 7-day return window in original seal.'));
  assert.ok(systemPrompt.includes('Lagos Island, Victoria Island, Lekki Phase 1, Ikoyi'));

  // Check buildSystemInstruction integration
  const sysInst = buildSystemInstruction(promptGrounding);
  assert.ok(sysInst.includes('TechHub Lagos'));
  assert.ok(sysInst.includes('PRD §4.1'));
  assert.ok(sysInst.includes("I'll check with the business owner"));
  console.log('✅ Test 5 passed!');

  // =========================================================================
  // Test 6: Error Handling (Missing Business / Unknown ID)
  // =========================================================================
  console.log('Test 6: Handles missing business profile gracefully...');
  const missingGateway = createBusinessDataGateway({ businessId: 'non_existent_id', db: mockDb });
  const missingProfile = await missingGateway.getBusinessProfile();
  assert.strictEqual(missingProfile, null);

  const missingPolicies = await missingGateway.getPolicies();
  assert.strictEqual(missingPolicies.returns, null);
  assert.strictEqual(missingPolicies.delivery, null);

  const missingGrounding = createGroundingService({ businessId: 'non_existent_id', db: mockDb });
  const missingContext = await missingGrounding.getGroundingContext();
  assert.strictEqual(missingContext.profile, null);
  assert.ok(missingContext.businessSummary.includes('No business profile found'));
  console.log('✅ Test 6 passed!');

  console.log('\n🎉 ALL S3 BUSINESS GROUNDING & POLICY TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ S3 test suite failed:', err);
  process.exit(1);
});

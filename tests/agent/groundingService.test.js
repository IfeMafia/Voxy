/**
 * Tests for S3: Business Knowledge Grounding & Policies Engine (AI-103).
 *
 * Demonstrates the actual responses of the agent and policy checker
 * rather than simple pass/fail placeholders.
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

const mockDb = {
  business: {
    findUnique: async ({ where }) => {
      return MOCK_BUSINESSES[where.id] ?? null;
    }
  }
};

async function runTests() {
  console.log('🧪 Starting S3: Business Knowledge Grounding & Policies Engine Tests (AI-103)...\n');

  // =========================================================================
  // Test 1: Delivery Area Truthful Refusal (Requirement 1)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 1: Delivery Area Verification & Truthful Refusal (PRD §4.1)');
  const electronicsGateway = createBusinessDataGateway({ businessId: 'biz_electronics', db: mockDb });
  const electronicsProfile = await electronicsGateway.getBusinessProfile();
  const electronicsPolicies = await electronicsGateway.getPolicies();

  const electronicsChecker = createPolicyChecker({
    profile: electronicsProfile,
    policies: electronicsPolicies
  });

  console.log('  [Business Profile]:', electronicsProfile.name);
  console.log('  [Approved Delivery Areas]:', electronicsProfile.deliveryAreas.join(', '));

  // Case A: Unserved Location (Truthful Refusal)
  const queryUnserved = 'Kano';
  console.log(`\n  💬 Customer Question: "Do you deliver to ${queryUnserved}?"`);
  const refusalResult = electronicsChecker.checkDeliveryArea(queryUnserved);
  console.log('  🤖 Voxy Response:');
  console.log(`     "${refusalResult.message}"`);
  console.log('  [Grounding Details]:', {
    supported: refusalResult.supported,
    locationChecked: refusalResult.location,
    allowedAreas: refusalResult.areas
  });
  assert.strictEqual(refusalResult.supported, false);
  assert.ok(refusalResult.message.includes('We do not deliver to Kano'));
  assert.ok(refusalResult.message.includes('Lagos Island'));

  // Case B: Served Location
  const queryServed = 'Victoria Island';
  console.log(`\n  💬 Customer Question: "Can you deliver to ${queryServed}?"`);
  const servedResult = electronicsChecker.checkDeliveryArea(queryServed);
  console.log('  🤖 Voxy Response:');
  console.log(`     "${servedResult.message}"`);
  assert.strictEqual(servedResult.supported, true);
  console.log('✅ Test 1 passed: Truthfully refused unserved location without hallucination\n');

  // =========================================================================
  // Test 2: Return Policy Quoted Verbatim (Requirement 2)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 2: Return Policy Queries Quoted Exact & Verbatim (PRD §4.1)');
  console.log('  💬 Customer Question: "What is your return policy for laptops?"');
  const returnPolicy = electronicsChecker.getReturnPolicy();
  console.log('  🤖 Voxy Response:');
  console.log(`     "${returnPolicy.message}"`);
  console.log('  [Stored Record Match]:', returnPolicy.terms === 'All electronic items have a strict 7-day return window in original seal.');
  assert.strictEqual(returnPolicy.available, true);
  assert.strictEqual(
    returnPolicy.terms,
    'All electronic items have a strict 7-day return window in original seal.'
  );

  // Check Bakery Return Policy
  const bakeryGateway = createBusinessDataGateway({ businessId: 'biz_bakery', db: mockDb });
  const bakeryProfile = await bakeryGateway.getBusinessProfile();
  const bakeryPolicies = await bakeryGateway.getPolicies();
  const bakeryChecker = createPolicyChecker({ profile: bakeryProfile, policies: bakeryPolicies });

  console.log('\n  💬 Customer Question (Bakery): "Can I return a cake after delivery?"');
  const bakeryReturns = bakeryChecker.getReturnPolicy();
  console.log('  🤖 Voxy Response:');
  console.log(`     "${bakeryReturns.message}"`);
  assert.strictEqual(
    bakeryReturns.terms,
    'Perishable bakery items cannot be returned once delivered.'
  );
  console.log('✅ Test 2 passed: Quoted exact business return terms verbatim\n');

  // =========================================================================
  // Test 3: Strict Honesty when Information is Missing (Requirement 3)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 3: Strict Honesty for Missing/Unconfigured Policies');
  const sparseGateway = createBusinessDataGateway({ businessId: 'biz_sparse', db: mockDb });
  const sparseProfile = await sparseGateway.getBusinessProfile();
  const sparsePolicies = await sparseGateway.getPolicies();
  const sparseChecker = createPolicyChecker({ profile: sparseProfile, policies: sparsePolicies });

  console.log('  [Store]:', sparseProfile.name, '(No policies or delivery configured)');

  console.log('\n  💬 Customer Question: "What is your return policy?"');
  const missingReturns = sparseChecker.getReturnPolicy();
  console.log('  🤖 Voxy Response:');
  console.log(`     "${missingReturns.message}"`);
  assert.strictEqual(missingReturns.available, false);
  assert.ok(missingReturns.message.includes("check with the business owner"));

  console.log('\n  💬 Customer Question: "Can you ship to Lagos?"');
  const unconfiguredDelivery = sparseChecker.checkDeliveryArea('Lagos');
  console.log('  🤖 Voxy Response:');
  console.log(`     "${unconfiguredDelivery.message}"`);
  assert.strictEqual(unconfiguredDelivery.supported, false);
  assert.ok(unconfiguredDelivery.message.includes("check with the business owner"));

  console.log('\n  💬 Customer Question: "What is your international warranty coverage?"');
  const unknownAnswer = sparseChecker.extractPolicyAnswer('international warranty');
  console.log('  🤖 Voxy Response:');
  console.log(`     "${unknownAnswer.answer}"`);
  assert.strictEqual(unknownAnswer.available, false);
  assert.ok(unknownAnswer.answer.includes("check with the business owner"));
  console.log('✅ Test 3 passed: Never fabricated missing policy details\n');

  // =========================================================================
  // Test 4: Multi-Tenant Scoping & Zero Cross-Tenant Leakage
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 4: Scoping per businessId & Data Sanitization');
  const groundingServiceA = createGroundingService({ businessId: 'biz_electronics', db: mockDb });
  const groundingServiceB = createGroundingService({ businessId: 'biz_bakery', db: mockDb });

  const contextA = await groundingServiceA.getGroundingContext();
  const contextB = await groundingServiceB.getGroundingContext();

  console.log('  [Tenant A Grounding]:', contextA.profile.name);
  console.log('    Operating Hours:', JSON.stringify(contextA.profile.hours));
  console.log('    Delivery Areas: ', contextA.profile.deliveryAreas.join(', '));
  console.log('    Return Terms:   ', contextA.policies.returns);

  console.log('\n  [Tenant B Grounding]:', contextB.profile.name);
  console.log('    Operating Hours:', contextB.profile.hours);
  console.log('    Delivery Areas: ', contextB.profile.deliveryAreas.join(', '));
  console.log('    Return Terms:   ', contextB.policies.returns);

  assert.strictEqual(contextA.profile.name, 'TechHub Lagos');
  assert.strictEqual(contextB.profile.name, 'Sweet Crust Abuja');

  // Check no cross-leakage
  assert.ok(!contextA.businessSummary.includes('Sweet Crust Abuja'));
  assert.ok(!contextA.businessSummary.includes('Perishable bakery items'));
  assert.ok(!contextB.businessSummary.includes('TechHub Lagos'));
  assert.ok(!contextB.businessSummary.includes('7-day return window'));

  // Sanitization check
  assert.ok(!contextA.businessSummary.includes('secret_user_999'));
  assert.ok(!contextB.businessSummary.includes('secret_user_888'));
  console.log('\n✅ Test 4 passed: Zero cross-tenant data leakage and sensitive IDs stripped\n');

  // =========================================================================
  // Test 5: Dynamic Prompt Injection & Anti-Hallucination Guardrails
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 5: Dynamic Prompt Builder & Grounded System Instruction');
  const promptGrounding = await groundingServiceA.buildPromptGrounding();
  const systemPrompt = buildGroundedSystemPrompt(promptGrounding);

  console.log('  [Injected Business Summary Snippet]:');
  console.log('  ' + promptGrounding.businessSummary.split('\n').map(l => '  ' + l).join('\n'));

  console.log('\n  [Strict Anti-Hallucination Directives in Prompt]:');
  console.log('  ' + GROUNDING_POLICY_RULES.split('\n').map(l => '  ' + l).join('\n'));

  assert.ok(systemPrompt.includes('TechHub Lagos'));
  assert.ok(systemPrompt.includes('Zero Product Invention') || systemPrompt.includes('Zero Hallucination'));
  assert.ok(systemPrompt.includes("I'll check with the business owner"));

  const sysInst = buildSystemInstruction(promptGrounding);
  assert.ok(sysInst.includes('TechHub Lagos'));
  assert.ok(sysInst.includes('PRD §4.1'));
  console.log('✅ Test 5 passed: Prompt successfully wired with dynamic context and guardrails\n');

  // =========================================================================
  // Test 6: Error Handling (Missing Business / Unknown ID)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 6: Graceful Handling of Missing / Unknown Business Profile');
  const missingGateway = createBusinessDataGateway({ businessId: 'non_existent_id', db: mockDb });
  const missingProfile = await missingGateway.getBusinessProfile();
  console.log('  [Non-existent Business ID]: Returns ->', missingProfile);
  assert.strictEqual(missingProfile, null);

  const missingGrounding = createGroundingService({ businessId: 'non_existent_id', db: mockDb });
  const missingContext = await missingGrounding.getGroundingContext();
  console.log('  [Grounding Context Summary]:\n   ', missingContext.businessSummary);
  assert.strictEqual(missingContext.profile, null);
  assert.ok(missingContext.businessSummary.includes('No business profile found'));
  console.log('✅ Test 6 passed: Graceful fallback without throwing exceptions\n');

  console.log('======================================================================');
  console.log('🎉 ALL S3 BUSINESS GROUNDING & POLICY VERIFICATION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ S3 test suite failed:', err);
  process.exit(1);
});

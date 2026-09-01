/**
 * S7: Order Builder & Draft Construction Agent Tests (AI-107).
 *
 * Validates:
 * 1. Price Integrity: The model CANNOT override prices. Total is strictly computed
 *    by multiplying server unit prices from the database by quantity.
 *    Any model-asserted discount or price override is discarded and server price wins.
 * 2. Unavailable variant detection: Attempting to order an unavailable/out-of-stock
 *    variant flags a clear error to the customer, not a silent failure or invented substitution.
 * 3. Out-of-stock product rejection: Ordering an unlisted or completely out-of-stock item fails cleanly.
 * 4. Structured Draft Order Output: Emits status "draft", computed subtotal, delivery fee,
 *    and frontend confirmation card object (consumed by A9).
 * 5. OrderStateManager extraction: Correctly extracts items, variants, and quantities from text dialogue.
 */

import assert from 'node:assert';
import {
  BusinessDataGateway,
  createBusinessDataGateway
} from '../../src/lib/ai/agent/businessData.js';
import { orderBuilderTool } from '../../src/lib/ai/agent/tools/orderBuilder.js';
import { OrderStateManager } from '../../src/lib/ai/agent/order/orderStateManager.js';
import { createDefaultToolRegistry } from '../../src/lib/ai/agent/tools/index.js';
import { ToolPermission } from '../../src/lib/ai/agent/types.js';

// Authoritative test catalogue
const TEST_CATALOG = [
  {
    id: 'prod_macbook_pro',
    name: 'MacBook Pro 14" M3',
    description: 'Apple M3 Pro chip, 18GB RAM',
    price: 2450000, // Authoritative: ₦2,450,000
    category: 'laptop',
    available: true,
    stockQuantity: 5,
    variant: 'Space Black 512GB',
    variants: [
      { id: 'var_sb_512', name: 'Space Black 512GB', price: 2450000, stockQuantity: 5 },
      { id: 'var_sil_1tb', name: 'Silver 1TB', price: 2850000, stockQuantity: 2 },
      { id: 'var_gold_2tb', name: 'Gold 2TB Limited', price: 3500000, stockQuantity: 0 } // OUT OF STOCK VARIANT
    ]
  },
  {
    id: 'prod_hp_envy',
    name: 'HP Envy x360 15',
    description: 'Intel Core i7 13th Gen',
    price: 950000, // Authoritative: ₦950,000
    category: 'laptop',
    available: true,
    stockQuantity: 10,
    variant: 'Natural Silver',
    variants: []
  },
  {
    id: 'prod_samsung_tv',
    name: 'Samsung 65" QLED 4K',
    description: 'Smart QLED TV',
    price: 1200000,
    available: false, // COMPLETELY OUT OF STOCK
    stockQuantity: 0
  }
];

const MOCK_BUSINESS = {
  id: 'biz_super_store',
  name: 'Super Store Lagos',
  ownerUserId: 'user_boss',
  products: TEST_CATALOG,
  deliveryAreas: ['Lekki', 'Victoria Island', 'Ikeja'],
  policies: {
    deliveryFee: 5000
  }
};

const mockDb = {
  business: {
    findUnique: async () => MOCK_BUSINESS
  }
};

async function runTests() {
  console.log('🧪 Starting S7: Order Builder & Draft Construction Tests (AI-107)...\n');

  const gateway = createBusinessDataGateway({
    businessId: MOCK_BUSINESS.id,
    db: mockDb
  });

  const agentContext = {
    businessId: MOCK_BUSINESS.id,
    customerId: 'cust_ade_123',
    conversationId: 'conv_456',
    data: gateway
  };

  // =========================================================================
  // Test 1: The Model CANNOT Override Price (Critical PRD Rule #2 Requirement)
  // Server-computed authoritative total MUST win even if model asserts a different price.
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 1: Server Authoritative Price Integrity (Model Price Override Fails)');
  console.log('======================================================================');

  // The model hallucinates or tries to assert that MacBook is ₦50,000 or offers an unauthorized discount
  const maliciousModelPayload = {
    customerId: 'cust_ade_123',
    lines: [
      {
        productId: 'prod_macbook_pro',
        quantity: 2,
        price: 50000, // Malicious / hallucinated unit price! (Actual is ₦2,450,000)
        lineTotal: 100000 // Malicious line total
      }
    ]
  };

  console.log('  🤖 Model asserts unitPrice = ₦50,000 (total = ₦100,000) for 2x MacBook Pro');
  const draftResult = await orderBuilderTool.execute(maliciousModelPayload, agentContext);

  assert.strictEqual(draftResult.ok, true, 'Tool execution should succeed');
  const draft = draftResult.data.draftOrder;

  console.log('  🔒 Server Evaluated Draft Order:');
  console.log(`     - Product: ${draft.lines[0].name}`);
  console.log(`     - Quantity: ${draft.lines[0].quantity}`);
  console.log(`     - Server Authoritative Unit Price: ₦${draft.lines[0].unitPrice.toLocaleString()}`);
  console.log(`     - Server Authoritative Line Total:  ₦${draft.lines[0].lineTotal.toLocaleString()}`);
  console.log(`     - Server Subtotal: ₦${draft.subtotal.toLocaleString()}`);
  console.log(`     - Configured Delivery Fee: ₦${draft.deliveryFee.toLocaleString()}`);
  console.log(`     - Server Final Total: ₦${draft.total.toLocaleString()}`);

  // Verification:
  // Unit price MUST be exactly 2,450,000
  assert.strictEqual(draft.lines[0].unitPrice, 2450000, 'Server unit price must overwrite any model-passed price');
  // Line total MUST be 2 * 2,450,000 = 4,900,000
  assert.strictEqual(draft.lines[0].lineTotal, 4900000, 'Server line total must equal server unit price * quantity');
  // Subtotal MUST be 4,900,000
  assert.strictEqual(draft.subtotal, 4900000);
  // Total MUST include delivery fee: 4,900,000 + 5,000 = 4,905,000
  assert.strictEqual(draft.total, 4905000, 'Server total must include delivery fee and authoritative line totals');
  assert.strictEqual(draft.status, 'draft');

  console.log('✅ Test 1 passed: Server strictly enforced authoritative pricing over model assertions!\n');

  // =========================================================================
  // Test 2: Attempting to Order Unavailable Variant Flags Clear Error
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 2: Unavailable Variant Detection & Honest Error Handling');
  console.log('======================================================================');

  // Case A: Variant that does not exist for this product
  console.log('  🔍 Case A: Request non-existent variant "Pink 64GB"');
  const nonExistentVariantResult = await orderBuilderTool.execute({
    lines: [
      {
        productId: 'prod_macbook_pro',
        variant: 'Pink 64GB',
        quantity: 1
      }
    ]
  }, agentContext);

  console.log('  ⚠️ Response:', nonExistentVariantResult.error);
  assert.strictEqual(nonExistentVariantResult.ok, false);
  assert.strictEqual(nonExistentVariantResult.code, 'INVALID_VARIANT');
  assert.ok(nonExistentVariantResult.error.includes('is not available'));

  // Case B: Variant exists in catalog but stock is 0
  console.log('  🔍 Case B: Request out-of-stock variant "Gold 2TB Limited" (stockQuantity: 0)');
  const outOfStockVariantResult = await orderBuilderTool.execute({
    lines: [
      {
        productId: 'prod_macbook_pro',
        variantId: 'var_gold_2tb',
        quantity: 1
      }
    ]
  }, agentContext);

  console.log('  ⚠️ Response:', outOfStockVariantResult.error);
  assert.strictEqual(outOfStockVariantResult.ok, false);
  assert.strictEqual(outOfStockVariantResult.code, 'VARIANT_OUT_OF_STOCK');
  assert.ok(outOfStockVariantResult.error.includes('currently out of stock'));

  console.log('✅ Test 2 passed: Unavailable variants flagged honest, actionable errors!\n');

  // =========================================================================
  // Test 3: Completely Out-of-Stock Product Flagged
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 3: Out-of-Stock Product Rejection');
  console.log('======================================================================');

  const outOfStockProdResult = await orderBuilderTool.execute({
    lines: [{ productId: 'prod_samsung_tv', quantity: 1 }]
  }, agentContext);

  console.log('  ⚠️ Response:', outOfStockProdResult.error);
  assert.strictEqual(outOfStockProdResult.ok, false);
  assert.strictEqual(outOfStockProdResult.code, 'OUT_OF_STOCK');
  assert.ok(outOfStockProdResult.error.includes('currently out of stock'));

  console.log('✅ Test 3 passed: Out of stock product rejected cleanly!\n');

  // =========================================================================
  // Test 4: Structured Frontend Confirmation Card Output (A9 Integration)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 4: Structured Confirmation Card (A9 Integration)');
  console.log('======================================================================');

  const validOrderResult = await orderBuilderTool.execute({
    customerId: 'cust_ade_123',
    lines: [
      { productId: 'prod_hp_envy', quantity: 1 },
      { productId: 'prod_macbook_pro', variantId: 'var_sil_1tb', quantity: 1 }
    ]
  }, agentContext);

  assert.strictEqual(validOrderResult.ok, true);
  const card = validOrderResult.data.confirmationCard;
  console.log('  💳 Emitted Confirmation Card for Abraham (A9):', JSON.stringify(card, null, 2));

  assert.strictEqual(card.type, 'draft_order_card');
  assert.strictEqual(card.status, 'draft');
  assert.strictEqual(card.requiresConfirmation, true);
  assert.strictEqual(card.lines.length, 2);
  assert.strictEqual(card.summary.formattedSubtotal, '₦3,800,000'); // 950,000 + 2,850,000
  assert.strictEqual(card.summary.formattedDeliveryFee, '₦5,000');
  assert.strictEqual(card.summary.formattedTotal, '₦3,805,000');
  assert.strictEqual(card.actions[0].action, 'confirm_order');

  console.log('  🗣️ Spoken Summary for Customer:');
  console.log(`     "${validOrderResult.data.spokenSummary}"`);
  assert.ok(validOrderResult.data.spokenSummary.includes('₦3,805,000'));
  assert.ok(validOrderResult.data.spokenSummary.includes('confirm'));

  console.log('✅ Test 4 passed: Emitted structured draft order for frontend card & voice summary!\n');

  // =========================================================================
  // Test 5: OrderStateManager Extraction from User Dialogue
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 5: OrderStateManager Dialogue Extraction');
  console.log('======================================================================');

  const orderManager = new OrderStateManager({
    businessId: MOCK_BUSINESS.id,
    gateway
  });

  const extracted = orderManager.extractOrderCandidates(
    'Please I want to order 2 HP Envy x360 15 and 1 MacBook Pro Silver 1TB',
    TEST_CATALOG
  );

  console.log('  💬 Input Dialogue: "Please I want to order 2 HP Envy x360 15 and 1 MacBook Pro Silver 1TB"');
  console.log('  📦 Extracted Candidates:', JSON.stringify(extracted, null, 2));

  assert.strictEqual(extracted.length, 2);
  assert.strictEqual(extracted[0].name, 'MacBook Pro 14" M3');
  assert.strictEqual(extracted[0].quantity, 1);
  assert.strictEqual(extracted[0].variant, 'Silver 1TB');

  assert.strictEqual(extracted[1].name, 'HP Envy x360 15');
  assert.strictEqual(extracted[1].quantity, 2);

  console.log('✅ Test 5 passed: Extracted order items, quantities, and variants from dialogue!\n');

  console.log('🎉 ALL S7 ORDER BUILDER & DRAFT CONSTRUCTION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n❌ S7 TEST SUITE FAILED:');
  console.error(err);
  process.exit(1);
});

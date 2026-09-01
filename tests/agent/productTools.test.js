/**
 * S6: Product Catalogue & Recommendation Tools Tests (AI-106).
 *
 * Validates:
 * 1. Searching for a non-existent product returns an empty array; the agent communicates
 *    that the product isn't in stock / doesn't exist honestly (not a vague answer).
 * 2. Prices returned in a recommendation match database records exactly, down to the Naira.
 * 3. product_lookup: filters by text, category, price ceiling.
 * 4. product_detail: returns specs, variants, stock; detects out-of-stock items honestly and suggests in-stock alternatives.
 * 5. recommend_products: budget-aware ranking with structured metadata for frontend card rendering (A8).
 * 6. Latency performance: tool response is fast (< 100ms).
 */

import assert from 'node:assert';
import {
  BusinessDataGateway,
  createBusinessDataGateway
} from '../../src/lib/ai/agent/businessData.js';
import { productLookupTool } from '../../src/lib/ai/agent/tools/productLookup.js';
import { productDetailTool } from '../../src/lib/ai/agent/tools/productDetail.js';
import { recommendProductsTool } from '../../src/lib/ai/agent/tools/recommendProducts.js';
import { createDefaultToolRegistry } from '../../src/lib/ai/agent/tools/index.js';
import { ToolPermission } from '../../src/lib/ai/agent/types.js';

// Authoritative test catalogue with exact Naira pricing
const AUTHORITATIVE_CATALOG = [
  {
    id: 'prod_macbook_pro',
    name: 'MacBook Pro 14" M3',
    description: 'Apple M3 Pro chip, 18GB Unified Memory, 512GB SSD Space Black',
    price: 2450000, // Exactly ₦2,450,000
    category: 'laptop',
    tags: ['laptop', 'apple', 'computers', 'professional'],
    available: true,
    stockQuantity: 5,
    variant: 'Space Black 512GB',
    variants: [
      { id: 'var_1', name: 'Space Black 512GB', price: 2450000, stockQuantity: 5 },
      { id: 'var_2', name: 'Silver 1TB', price: 2850000, stockQuantity: 2 }
    ],
    highlights: 'Incredible performance with up to 22 hours of battery life'
  },
  {
    id: 'prod_hp_envy',
    name: 'HP Envy x360 15',
    description: 'Intel Core i7 13th Gen, 16GB RAM, 512GB SSD, Touchscreen 2-in-1',
    price: 950000, // Exactly ₦950,000
    category: 'laptop',
    tags: ['laptop', 'hp', 'computers', 'student'],
    available: true,
    stockQuantity: 12,
    variant: 'Natural Silver',
    highlights: 'Versatile 2-in-1 convertible with vibrant OLED touchscreen'
  },
  {
    id: 'prod_dell_xps',
    name: 'Dell XPS 13 Plus',
    description: '13.4" 3.5K OLED, Intel Core i7, 32GB RAM, 1TB SSD',
    price: 1850000, // Exactly ₦1,850,000
    category: 'laptop',
    tags: ['laptop', 'dell', 'ultrabook'],
    available: false, // OUT OF STOCK
    stockQuantity: 0,
    variant: 'Platinum',
    highlights: 'Zero-lattice keyboard and capacitive touch function row'
  },
  {
    id: 'prod_laptop_sleeve',
    name: 'Waterproof Leather Laptop Sleeve 14"',
    description: 'Premium faux leather sleeve with magnetic clasp and soft velvet lining',
    price: 28500, // Exactly ₦28,500
    category: 'accessory',
    tags: ['accessory', 'case', 'sleeve'],
    available: true,
    stockQuantity: 25,
    highlights: 'Slim waterproof everyday protection'
  }
];

const MOCK_BUSINESS = {
  id: 'biz_gadget_mart',
  name: 'Gadget Mart Nigeria',
  ownerUserId: 'owner_999',
  hours: 'Mon-Sat 9am-6pm',
  products: AUTHORITATIVE_CATALOG,
  deliveryAreas: ['Lagos Island', 'Victoria Island', 'Lekki Phase 1', 'Ikeja']
};

const mockDb = {
  business: {
    findUnique: async () => MOCK_BUSINESS
  }
};

async function runTests() {
  console.log('🧪 Starting S6: Product Catalogue & Recommendation Tools Tests (AI-106)...\n');

  const gateway = createBusinessDataGateway({
    businessId: MOCK_BUSINESS.id,
    db: mockDb
  });

  const agentContext = {
    businessId: MOCK_BUSINESS.id,
    data: gateway
  };

  // =========================================================================
  // Test 1: Search for non-existent product returns empty array
  // PRD §4.1: Agent communicates non-existence honestly, zero hallucination.
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 1: Non-Existent Product Search (Honest Zero Match)');
  console.log('======================================================================');

  const emptySearch = await productLookupTool.execute({ text: 'PlayStation 5 Console' }, agentContext);
  console.log('  🔍 Lookup: "PlayStation 5 Console"');
  console.log('  📦 Tool Output:', JSON.stringify(emptySearch, null, 2));

  assert.strictEqual(emptySearch.ok, true);
  assert.strictEqual(emptySearch.data.count, 0);
  assert.strictEqual(emptySearch.data.hasMatches, false);
  assert.deepStrictEqual(emptySearch.data.items, []);
  console.log('✅ Test 1 passed: Non-existent product returned clean empty array without hallucination\n');

  // =========================================================================
  // Test 2: Recommendation Prices Match Database Records Down to the Naira
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 2: Exact Price Matching Down to the Naira');
  console.log('======================================================================');

  const recResult = await recommendProductsTool.execute(
    { category: 'laptop', budget: 1000000 },
    agentContext
  );

  console.log('  🔍 Recommendation Request: Category=laptop, Budget=₦1,000,000');
  console.log('  💡 Recommendations Found:', recResult.data.count);

  assert.strictEqual(recResult.ok, true);
  assert.ok(recResult.data.count > 0);

  const topRec = recResult.data.recommendations[0];
  console.log(`  🥇 Top Pick: ${topRec.name}`);
  console.log(`     Exact Price Returned: ₦${topRec.price.toLocaleString()}`);
  console.log(`     Formatted Price:      ${topRec.formattedPrice}`);
  console.log(`     Card Reason:          ${topRec.recommendationReason}`);

  // Find corresponding DB record
  const dbRecord = AUTHORITATIVE_CATALOG.find(p => p.id === topRec.id);
  assert.ok(dbRecord, 'Recommended product must exist in database');
  assert.strictEqual(topRec.price, dbRecord.price, 'Price must match database record down to the Naira');
  assert.strictEqual(topRec.price, 950000, 'HP Envy x360 must be exactly ₦950,000');
  assert.strictEqual(topRec.formattedPrice, '₦950,000');

  console.log('✅ Test 2 passed: Prices verified to match database records exactly\n');

  // =========================================================================
  // Test 3: Product Lookup Filtering (Text, Category, Max Price)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 3: Product Lookup Filtering');
  console.log('======================================================================');

  // Query under ₦1,000,000
  const budgetLookup = await productLookupTool.execute(
    { category: 'laptop', maxPrice: 1000000 },
    agentContext
  );

  console.log('  🔍 Lookup: Category=laptop, MaxPrice=₦1,000,000');
  console.log(`  📦 Matches Found: ${budgetLookup.data.count}`);
  budgetLookup.data.items.forEach(item => {
    console.log(`     - ${item.name} (₦${item.price.toLocaleString()})`);
    assert.ok(item.price <= 1000000, 'All returned items must respect maxPrice');
  });
  assert.strictEqual(budgetLookup.data.count, 1);
  assert.strictEqual(budgetLookup.data.items[0].id, 'prod_hp_envy');

  console.log('✅ Test 3 passed: Filtering by category and price ceiling verified\n');

  // =========================================================================
  // Test 4: Product Detail & Out-of-Stock Handling
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 4: Product Detail & Out-of-Stock Honest Communication');
  console.log('======================================================================');

  // Case A: In-stock product details
  const inStockDetail = await productDetailTool.execute(
    { productId: 'prod_macbook_pro' },
    agentContext
  );
  console.log('  📦 In-Stock Product:', inStockDetail.data.product.name);
  console.log('     Available:', inStockDetail.data.product.available);
  console.log('     Stock Quantity:', inStockDetail.data.product.stockQuantity);
  console.log('     Variants Count:', inStockDetail.data.product.variants.length);
  assert.strictEqual(inStockDetail.data.found, true);
  assert.strictEqual(inStockDetail.data.product.isOutOfStock, false);
  assert.strictEqual(inStockDetail.data.product.variants.length, 2);

  // Case B: Out-of-stock product details
  const outOfStockDetail = await productDetailTool.execute(
    { productId: 'prod_dell_xps' },
    agentContext
  );
  console.log('\n  ⚠️ Out-of-Stock Product:', outOfStockDetail.data.product.name);
  console.log('     Available:', outOfStockDetail.data.product.available);
  console.log('     Stock Quantity:', outOfStockDetail.data.product.stockQuantity);
  console.log('     Is Out Of Stock:', outOfStockDetail.data.product.isOutOfStock);
  console.log('     Suggested In-Stock Alternatives:', outOfStockDetail.data.inStockAlternatives.map(a => `${a.name} (${a.formattedPrice})`));

  assert.strictEqual(outOfStockDetail.data.found, true);
  assert.strictEqual(outOfStockDetail.data.product.isOutOfStock, true);
  assert.ok(outOfStockDetail.data.inStockAlternatives.length > 0, 'Must provide available alternatives');
  assert.strictEqual(outOfStockDetail.data.inStockAlternatives[0].name, 'MacBook Pro 14" M3');

  console.log('✅ Test 4 passed: Out-of-stock state detected honestly with in-stock alternatives\n');

  // =========================================================================
  // Test 5: Tool Registry Integration & Permission Gates
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 5: Tool Registry Resolution & Permissions');
  console.log('======================================================================');

  const registry = createDefaultToolRegistry();
  const lookupTool = registry.resolve('product_lookup', [ToolPermission.READ_CATALOGUE]);
  const detailTool = registry.resolve('product_detail', [ToolPermission.READ_CATALOGUE]);
  const recTool = registry.resolve('recommend_products', [ToolPermission.READ_CATALOGUE]);

  assert.ok(lookupTool);
  assert.ok(detailTool);
  assert.ok(recTool);
  console.log('  🔐 Successfully resolved product_lookup, product_detail, and recommend_products with READ_CATALOGUE');

  assert.throws(
    () => registry.resolve('product_lookup', []),
    /PermissionDeniedError/,
    'Must deny execution if READ_CATALOGUE permission is missing'
  );
  console.log('  🛡️ PermissionDeniedError thrown when permission is missing');
  console.log('✅ Test 5 passed!\n');

  // =========================================================================
  // Test 6: Performance Latency Verification (< 100ms)
  // =========================================================================
  console.log('======================================================================');
  console.log('Test 6: Latency Benchmark (< 100ms)');
  console.log('======================================================================');

  const benchStart = Date.now();
  await productLookupTool.execute({ text: 'MacBook' }, agentContext);
  const benchDuration = Date.now() - benchStart;

  console.log(`  ⏱️ Lookup Execution Time: ${benchDuration}ms`);
  assert.ok(benchDuration < 100, `Execution latency (${benchDuration}ms) must be under 100ms`);
  console.log('✅ Test 6 passed: Sub-100ms speed threshold met!\n');

  console.log('🎉 ALL S6 PRODUCT CATALOGUE & RECOMMENDATION TOOL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n❌ S6 TEST SUITE FAILED:');
  console.error(err);
  process.exit(1);
});

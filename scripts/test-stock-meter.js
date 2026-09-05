import { createBusinessDataGateway } from '../src/lib/ai/agent/businessData.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';

console.log('====================================================');
console.log('  TESTING QUALITATIVE STOCK LEVEL METER');
console.log('====================================================\n');

const mockDb = {
  business: {
    findFirst: async () => ({
      id: 'biz_stock_test',
      name: 'Beans Haven',
      slug: 'beanshaven',
      products: [
        { id: 'p1', name: 'Agbado', priceKobo: 138000, stockQuantity: 1, isAvailable: true },
        { id: 'p2', name: 'Beef Pack', priceKobo: 248000, stockQuantity: 10, isAvailable: true },
        { id: 'p3', name: 'Out of Stock Pack', priceKobo: 50000, stockQuantity: 0, isAvailable: false }
      ]
    })
  }
};

const gateway = createBusinessDataGateway({ businessId: 'beanshaven', db: mockDb });
const groundingService = createGroundingService({ gateway });
const grounding = await groundingService.buildPromptGrounding();

console.log('GROUNDED SUMMARY:\n', grounding.businessSummary);

const summary = grounding.businessSummary;

if (
  summary.includes('Agbado: ₦1,380 | Stock Level: Low stock (selling fast)') &&
  summary.includes('Beef Pack: ₦2,480 | Stock Level: In stock') &&
  summary.includes('Out of Stock Pack: ₦500 | Stock Level: Out of stock')
) {
  console.log('\n✅ QUALITATIVE STOCK METER TEST PASSED! No raw numeric counts output.');
} else {
  console.error('\n❌ TEST FAILED! Quantitative numbers found or stock levels improperly formatted.');
  process.exit(1);
}

import { createBusinessDataGateway } from '../src/lib/ai/agent/businessData.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';

console.log('====================================================');
console.log('  TESTING BUSINESS SLUG LOOKUP & REAL STOCK DATA');
console.log('====================================================\n');

// Mock Prisma DB with Products having priceKobo and stockQuantity
const mockDb = {
  business: {
    findFirst: async ({ where }) => {
      const isMatch = where.OR.some(cond => cond.id === 'beanshaven' || cond.slug === 'beanshaven');
      if (!isMatch) return null;

      return {
        id: 'biz_uuid_999',
        name: 'Beans Haven',
        slug: 'beanshaven',
        description: 'Specialty bean and meal store',
        hours: 'Mon-Sat 8am-6pm',
        deliveryInfo: 'Lagos Island, Ikeja',
        products: [
          {
            id: 'prod-beef-pack',
            name: 'Beef Pack',
            description: 'Delicious seasoned beef pack',
            priceKobo: 248000,
            discountKobo: 0,
            stockQuantity: 10,
            isAvailable: true
          },
          {
            id: 'prod-agbado',
            name: 'Agbado',
            description: 'Fresh roasted agbado',
            priceKobo: 138000,
            discountKobo: 0,
            stockQuantity: 1,
            isAvailable: true
          }
        ]
      };
    }
  }
};

const gateway = createBusinessDataGateway({
  businessId: 'beanshaven', // Slug lookup test!
  db: mockDb
});

const groundingService = createGroundingService({ gateway });
const grounding = await groundingService.buildPromptGrounding();

console.log('Business Name:', grounding.businessName);
console.log('\nGROUNDED BUSINESS SUMMARY:\n', grounding.businessSummary);

const summary = grounding.businessSummary;

if (
  summary.includes('Beef Pack: ₦2,480 | Stock Status: 10 left in stock') &&
  summary.includes('Agbado: ₦1,380 | Stock Status: 1 left in stock')
) {
  console.log('\n✅ SLUG LOOKUP & STOCK QUANTITY VERIFICATION PASSED!');
} else {
  console.error('\n❌ VERIFICATION FAILED! Stock quantity or price missing in grounding summary.');
  process.exit(1);
}

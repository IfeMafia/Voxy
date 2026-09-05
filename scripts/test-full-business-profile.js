import { createBusinessDataGateway } from '../src/lib/ai/agent/businessData.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';

console.log('====================================================');
console.log('  TESTING FULL BUSINESS PROFILE GROUNDING EXTRACTION');
console.log('====================================================\n');

const mockFullProfile = {
  id: 'biz_full_test',
  name: 'Beans Haven',
  slug: 'beanshaven',
  category: 'Restaurant & Grains',
  description: 'Best beans in Lagos',
  hours: 'Mon-Sat 8am-8pm',
  address: {
    street: '12 Admiralty Way',
    city: 'Lekki Phase 1',
    state: 'Lagos',
    country: 'Nigeria'
  },
  socialLinks: {
    whatsapp: '2348050694825',
    instagram: 'samkiell',
    twitter: 'samkieldev',
    website: 'https://samkiel.tech'
  },
  contactPhone: '234-897-63452',
  email: 'samuelezekiel488@gmail.com',
  deliveryAreas: ['Lekki', 'Victoria Island'],
  deliveryInfo: 'Delivery is ₦1,500',
  products: [
    { id: 'p1', name: 'Beef Pack', priceKobo: 248000, stockQuantity: 10, isAvailable: true }
  ],
  policies: {
    returns: 'No returns on cooked meals.',
    refunds: 'Contact store manager.',
    delivery: 'Same day delivery.',
    payment: 'Paystack, Card, Transfer.'
  },
  aiConfig: {
    instructions: 'Always suggest adding plantain to beef pack orders!'
  }
};

const mockDb = {
  business: {
    findFirst: async () => mockFullProfile
  }
};

const gateway = createBusinessDataGateway({ businessId: 'beanshaven', db: mockDb });
const groundingService = createGroundingService({ gateway });
const grounding = await groundingService.buildPromptGrounding();

console.log('FULL GROUNDED BUSINESS SUMMARY:\n', grounding.businessSummary);

const summary = grounding.businessSummary;

if (
  summary.includes('12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria') &&
  summary.includes('WhatsApp: 2348050694825') &&
  summary.includes('Instagram: @samkiell') &&
  summary.includes('Twitter/X: @samkieldev') &&
  summary.includes('Website: https://samkiel.tech') &&
  summary.includes('Custom Business Owner Instructions: Always suggest adding plantain to beef pack orders!')
) {
  console.log('\n✅ FULL BUSINESS PROFILE EXTRACTION PASSED PERFECTLY!');
} else {
  console.error('\n❌ TEST FAILED! Social channels, address, or custom instructions missing.');
  process.exit(1);
}

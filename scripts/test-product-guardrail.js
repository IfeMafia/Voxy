import { createConversationEngine } from '../src/lib/ai/agent/conversationEngine.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';

console.log('====================================================');
console.log('  TESTING ZERO PRODUCT INVENTION GUARDRAIL');
console.log('====================================================\n');

// Mock business named "Beans Haven" with ZERO products
const emptyCatalogProfile = {
  id: 'biz-beans-haven',
  name: 'Beans Haven',
  description: 'Specialty bean restaurant & grain store',
  hours: 'Mon-Sat 8am-6pm',
  deliveryAreas: ['Lagos Island', 'Ikeja'],
  deliveryInfo: 'Delivery is ₦1,500',
  products: [], // EMPTY CATALOGUE!
  policies: {
    returns: 'No returns on cooked food.',
    refunds: 'Contact management.',
    delivery: 'Same day delivery.',
    payment: 'Card and Transfer.'
  },
  assistantConfig: {
    tone: 'warm and helpful',
    languages: ['en'],
    instructions: ''
  }
};

const gateway = {
  businessId: 'biz-beans-haven',
  getBusinessProfile: async () => emptyCatalogProfile,
  getPolicies: async () => emptyCatalogProfile.policies,
  searchProducts: async () => [],
  getProductById: async () => null,
};

const groundingService = createGroundingService({ gateway });
const engine = createConversationEngine({
  businessId: 'biz-beans-haven',
  groundingService
});

console.log('Asking Beans Haven (empty catalogue) for product recommendations...');
const result = await engine.processMessage({
  conversationId: 'test-beans-haven-001',
  message: 'What are your most popular or recommended items?'
});

console.log('\nAI RESPONSE:\n', result.response);

const lowerResp = result.response.toLowerCase();

if (
  !lowerResp.includes('black beans') &&
  !lowerResp.includes('kidney beans') &&
  !lowerResp.includes('cannellini') &&
  !lowerResp.includes('lentils') &&
  !lowerResp.includes('medley')
) {
  console.log('\n✅ GUARDRAIL PASSED! The AI did NOT invent fake products for Beans Haven!');
} else {
  console.error('\n❌ GUARDRAIL FAILED! The AI hallucinated products not in the catalogue.');
  process.exit(1);
}

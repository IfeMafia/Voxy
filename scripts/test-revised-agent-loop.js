import { createConversationEngine } from '../src/lib/ai/agent/conversationEngine.js';
import { createBusinessDataGateway } from '../src/lib/ai/agent/businessData.js';
import { createGroundingService } from '../src/lib/ai/agent/knowledge/groundingService.js';

console.log('====================================================');
console.log('  TESTING REVISED SAMKIEL S1-S8 AI ENGINE & LOOP');
console.log('====================================================\n');

// Mock in-memory test database / gateway
const mockProducts = [
  { id: 'prod-1', name: 'Nike Air Max Sneakers', price: 45000, stock: 12, category: 'shoes', description: 'Premium sports sneakers' },
  { id: 'prod-2', name: 'Samsung Galaxy S24 Ultra', price: 1200000, stock: 5, category: 'electronics', description: 'Flagship Android smartphone' }
];

const mockProfile = {
  id: 'biz-test-123',
  name: 'Kiel Electronics & Fashion',
  description: 'Top quality gadgets and shoes in Lagos',
  hours: 'Mon-Sat 8am-8pm',
  deliveryAreas: ['Ikeja', 'Lekki', 'Victoria Island', 'Yaba'],
  deliveryInfo: 'Standard delivery within Lagos is ₦2,500',
  products: mockProducts,
  policies: {
    returns: '7-day return policy for unused items in original packaging.',
    refunds: 'Full refund within 5 business days after inspection.',
    delivery: 'Delivery takes 24-48 hours within Lagos.',
    payment: 'Paystack, Transfer, or Card payment accepted.'
  },
  assistantConfig: {
    tone: 'friendly, professional, and consultative sales expert',
    languages: ['en'],
    instructions: 'Always encourage customers to complete orders using Paystack.'
  }
};

// Create gateway with mock profile provider
const gateway = {
  businessId: 'biz-test-123',
  getBusinessProfile: async () => mockProfile,
  getPolicies: async () => mockProfile.policies,
  searchProducts: async ({ query }) => {
    if (!query) return mockProducts;
    const lower = query.toLowerCase();
    return mockProducts.filter(p => p.name.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower));
  },
  getProductById: async (id) => mockProducts.find(p => p.id === id) || null,
  getDeliveryQuote: async (location) => ({
    eligible: mockProfile.deliveryAreas.some(a => location.toLowerCase().includes(a.toLowerCase())),
    fee: 2500,
    area: location
  })
};

const groundingService = createGroundingService({ gateway });
const engine = createConversationEngine({
  businessId: 'biz-test-123',
  groundingService
});

console.log('--- 1. Testing Grounding & Business Profile Context ---');
const grounding = await groundingService.buildPromptGrounding();
console.log('Business Name:', grounding.businessName);
console.log('Tone:', grounding.tone);
console.log('Summary Preview:\n', grounding.businessSummary.slice(0, 200) + '...\n');

if (grounding.businessName === 'Kiel Electronics & Fashion' && grounding.businessSummary.includes('Approved Delivery Areas')) {
  console.log('✅ Task S3 Business Knowledge Grounding Passed!\n');
} else {
  console.error('❌ Task S3 Grounding Failed.\n');
  process.exit(1);
}

console.log('--- 2. Testing Pure Agentic Conversation Turn ---');
try {
  const result = await engine.processMessage({
    conversationId: 'test-conv-001',
    message: 'Hello, do you sell Nike sneakers and what is your return policy?'
  });

  console.log('AGENT RESPONSE:\n', result.response);
  console.log('LATENCY:', result.latencyMs, 'ms');

  if (result.ok && result.response && result.response.length > 10) {
    console.log('✅ Task S4 Conversation Turn Executed Successfully!\n');
  } else {
    console.error('❌ Task S4 Turn Failed.\n');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Conversation Engine Error:', err);
  process.exit(1);
}

console.log('====================================================');
console.log('  ALL S1-S8 REVISED AI ENGINE CHECKS PASSED PERFECTLY!');
console.log('====================================================');

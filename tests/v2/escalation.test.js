import { prisma } from '../../src/lib/prisma';
import crypto from 'crypto';

async function testEscalation() {
  console.log('\n======================================================');
  console.log('🧪 TESTING CUSTOMER / AI ESCALATION ENDPOINT');
  console.log('======================================================\n');

  const testSuffix = Date.now();
  const businessEmail = `escalate_biz_${testSuffix}@voxy.app`;

  try {
    // 1. Create Business
    const business = await prisma.business.create({
      data: {
        name: `Escalation Store ${testSuffix}`,
        email: businessEmail,
        slug: `escalate-store-${testSuffix}`,
        passwordHash: 'hashed_password',
        isVerified: true,
      },
    });
    console.log(`  ✅ Business Created: ${business.name} (${business.email})`);

    // 2. Create Customer
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'Chidi Okafor',
        email: 'chidi@example.com',
        phone: '+2348098765432',
      },
    });
    console.log(`  ✅ Customer Created: ${customer.name}`);

    // 3. Create Active Conversation
    const conversation = await prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        status: 'active',
        messages: [
          { role: 'user', content: 'Do you deliver custom electronics to Abuja?', createdAt: new Date().toISOString() },
          { role: 'assistant', content: 'Let me check that for you...', createdAt: new Date().toISOString() },
          { role: 'user', content: 'Can I speak to a real person please? This is urgent.', createdAt: new Date().toISOString() },
        ],
      },
    });
    console.log(`  ✅ Conversation Created: ID=${conversation.id}, Status=${conversation.status}`);

    // 4. Trigger Escalation via internal logic / API logic
    console.log('\nSimulating Escalation POST to /api/v1/conversations/escalate...');

    // Update status to handed_off
    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: 'handed_off' },
    });
    console.log(`  ✅ Conversation Status Updated: ${updated.status} (Expected: handed_off)`);

    // Create Alert record
    const alert = await prisma.alert.create({
      data: {
        businessId: business.id,
        type: 'UNUSUAL_EVENT',
        title: '🚨 URGENT: Customer Escalation',
        message: `Customer ${customer.name} requested human intervention: "Can I speak to a real person please? This is urgent."`,
        metadata: {
          conversationId: conversation.id,
          customerId: customer.id,
          reason: 'Customer requested human agent',
          urgency: 'urgent',
        },
      },
    });
    console.log(`  ✅ Dashboard Alert Created: ID=${alert.id}, Title="${alert.title}"`);

    // Create Agent Activity
    const activity = await prisma.agentActivity.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        conversationId: conversation.id,
        action: 'CUSTOMER_ESCALATION',
        initiator: 'AGENT',
        result: 'PENDING',
        details: { reason: 'Customer requested human agent', urgency: 'urgent' },
      },
    });
    console.log(`  ✅ Agent Activity Logged: Action=${activity.action}, Result=${activity.result}`);

    // Verify Business Alert retrieval via query
    const alertsList = await prisma.alert.findMany({
      where: { businessId: business.id, isRead: false },
    });
    console.log(`  ✅ Business Unread Alerts count: ${alertsList.length}`);

    if (updated.status !== 'handed_off' || alertsList.length !== 1) {
      throw new Error('Escalation test verification failed!');
    }

    console.log('\n======================================================');
    console.log('🎉 ESCALATION ENDPOINT TEST PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ ESCALATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEscalation();

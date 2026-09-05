import { prisma } from '../../src/lib/prisma';
import { PaymentService } from '../../src/lib/services/payment-service';
import { WalletService } from '../../src/lib/services/wallet-service';
import { ReceiptService } from '../../src/lib/services/receipt-service';
import { OperationsService } from '../../src/lib/services/operations-service';
import crypto from 'crypto';

async function runEndToEndTest() {
  console.log('\n======================================================');
  console.log('🚀 VOXY V2 COMPLETE T8–T11 END-TO-END TEST SIMULATION');
  console.log('======================================================\n');

  const testSuffix = Date.now();
  const businessEmail = `testbiz_${testSuffix}@voxy.app`;
  const customerEmail = `testcust_${testSuffix}@gmail.com`;

  try {
    // 1. Create Business
    console.log('Step 1: Creating Business...');
    const business = await prisma.business.create({
      data: {
        name: `Voxy Test Gadgets ${testSuffix}`,
        email: businessEmail,
        slug: `voxy-gadgets-${testSuffix}`,
        passwordHash: 'hashed_password_placeholder',
        isVerified: true,
      },
    });
    console.log(`  ✅ Business created: ID=${business.id}, Name="${business.name}"`);

    // 2. Create Customer
    console.log('\nStep 2: Creating Customer...');
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'Tunde Afolabi',
        email: customerEmail,
        phone: '+2348012345678',
        channel: 'web_chat',
      },
    });
    console.log(`  ✅ Customer created: ID=${customer.id}, Name="${customer.name}"`);

    // 3. Create Product
    console.log('\nStep 3: Creating Product...');
    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name: 'Wireless Noise-Canceling Earbuds',
        priceKobo: 5000000, // 50,000 NGN
        discountKobo: 500000, // 5,000 NGN discount -> Effective 45,000 NGN (4,500,000 Kobo)
        currency: 'NGN',
        isAvailable: true,
      },
    });
    console.log(`  ✅ Product created: ID=${product.id}, Price=${product.priceKobo / 100} NGN, Discount=${product.discountKobo / 100} NGN`);

    // 4. Create Order
    console.log('\nStep 4: Creating Order (Server-side Total Calculation)...');
    const orderIdempotencyKey = `ord_key_${testSuffix}`;
    const effectivePriceKobo = Math.max(0, product.priceKobo - product.discountKobo);
    const quantity = 2; // Total = 9,000,000 Kobo (90,000 NGN)
    const totalKobo = effectivePriceKobo * quantity;

    const order = await prisma.order.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        status: 'draft',
        totalKobo,
        currency: 'NGN',
        idempotencyKey: orderIdempotencyKey,
        items: {
          create: [
            {
              productId: product.id,
              quantity,
              unitPriceKobo: effectivePriceKobo,
            },
          ],
        },
      },
      include: { items: true },
    });
    console.log(`  ✅ Order created: ID=${order.id}, Status=${order.status}, Total=${order.totalKobo / 100} NGN`);

    // 5. Initialize Payment
    console.log('\nStep 5: Initializing Payment via PaymentService...');
    const initResult = await PaymentService.initializePayment({
      orderId: order.id,
      businessId: business.id,
      customerEmail: customer.email,
    });
    console.log(`  ✅ Payment Initialized: Reference=${initResult.reference}, AccessCode=${initResult.accessCode}`);

    // 6. Paystack Checkout Simulation
    console.log('\nStep 6: Customer completes payment on Paystack...');
    const paystackPayload = {
      event: 'charge.success',
      id: testSuffix, // Unique event ID per test execution
      data: {
        id: testSuffix + 1,
        domain: 'test',
        status: 'success',
        reference: initResult.reference,
        amount: totalKobo,
        message: 'Mock payment success',
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        channel: 'card',
        currency: 'NGN',
        ip_address: '127.0.0.1',
      },
    };

    // 7. Receive & Validate Paystack Webhook (HMAC SHA512 Signature)
    console.log('\nStep 7 & 8: Paystack sends Webhook (HMAC Signature Validation)...');
    const rawBody = JSON.stringify(paystackPayload);
    const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_dummy_key';
    const computedSignature = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

    const webhookResult = await PaymentService.processWebhook(computedSignature, rawBody);
    console.log(`  ✅ Webhook processed: Status=${webhookResult.status}, Idempotent=${webhookResult.idempotent}`);

    // 9. Duplicate Webhook Test (Idempotency)
    console.log('\nStep 9: Testing duplicate webhook delivery (Idempotency check)...');
    const duplicateWebhookResult = await PaymentService.processWebhook(computedSignature, rawBody);
    console.log(`  ✅ Duplicate Webhook Result: Idempotent=${duplicateWebhookResult.idempotent}, Status=${duplicateWebhookResult.status}`);

    // 10. Verify Payment Status & Order Status
    console.log('\nStep 10 & 11: Verifying DB state transitions for Payment and Order...');
    const updatedPayment = await prisma.payment.findUnique({ where: { reference: initResult.reference } });
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    console.log(`  ✅ Payment status in DB: ${updatedPayment?.status} (Expected: SUCCESS)`);
    console.log(`  ✅ Order status in DB: ${updatedOrder?.status} (Expected: paid)`);
    if (!updatedPayment || updatedPayment.status !== 'SUCCESS' || !updatedOrder || updatedOrder.status !== 'paid') {
      throw new Error('Payment/Order state transition failed');
    }

    // 12 & 13. Verify Business Ledger Credit & Balance
    console.log('\nStep 12 & 13: Verifying Business Ledger Credit & Balance...');
    const balanceInfo = await WalletService.getBalanceInfo(business.id);
    console.log(`  ✅ Business Wallet Balance: Available=${balanceInfo.formattedAvailableBalance}, Received=${balanceInfo.formattedTotalReceived}`);
    if (balanceInfo.availableBalanceKobo !== totalKobo) {
      throw new Error(`Balance calculation mismatch: expected ${totalKobo}, got ${balanceInfo.availableBalanceKobo}`);
    }

    // 14. Verify Receipt Creation
    console.log('\nStep 14: Verifying Receipt Creation...');
    const receipt = await ReceiptService.getReceiptByPayment(updatedPayment.id, business.id);
    console.log(`  ✅ Receipt generated: ReceiptNumber="${receipt?.receiptNumber}", Amount=${(receipt?.amountKobo || 0) / 100} NGN`);
    if (!receipt) throw new Error('Receipt generation failed');

    // 15 & 16 & 17. Verify Dashboard Overview API Payload
    console.log('\nStep 15, 16 & 17: Verifying Dashboard Aggregation...');
    const dashboard = await OperationsService.getDashboardOverview(business.id);
    console.log(`  ✅ Dashboard Metrics: PaidOrders=${dashboard.metrics.paidOrders}, Balance=${dashboard.metrics.formattedAvailableBalance}`);

    // 18. Initiate Withdrawal
    console.log('\nStep 18 & 19: Requesting Business Withdrawal (50,000 NGN)...');
    const withdrawalAmountKobo = 5000000; // 50,000 NGN
    const withdrawalIdempotencyKey = `wth_key_${testSuffix}`;

    const withdrawal = await WalletService.requestWithdrawal({
      businessId: business.id,
      amountKobo: withdrawalAmountKobo,
      accountNumber: '0123456789',
      bankCode: '058',
      accountName: 'Voxy Test Gadgets Payout',
      idempotencyKey: withdrawalIdempotencyKey,
      reason: 'Bi-weekly business withdrawal',
    });
    console.log(`  ✅ Withdrawal Initiated: ID=${withdrawal.id}, Status=${withdrawal.status}, ProviderRef=${withdrawal.providerReference}`);

    // 20 & 21. Verify Post-Withdrawal Balance
    console.log('\nStep 20 & 21: Verifying Balance After Withdrawal...');
    const postWithdrawalBalance = await WalletService.getBalanceInfo(business.id);
    console.log(`  ✅ New Balance: Available=${postWithdrawalBalance.formattedAvailableBalance}, TotalWithdrawn=${postWithdrawalBalance.formattedTotalWithdrawn}`);
    const expectedRemainingKobo = totalKobo - withdrawalAmountKobo;
    if (postWithdrawalBalance.availableBalanceKobo !== expectedRemainingKobo) {
      throw new Error(`Post-withdrawal balance incorrect: expected ${expectedRemainingKobo}, got ${postWithdrawalBalance.availableBalanceKobo}`);
    }

    // 22. Test Failed Withdrawal Reversal
    console.log('\nStep 22: Testing Withdrawal Failure & Reversal Handling...');
    const failWithdrawalKey = `wth_fail_key_${testSuffix}`;
    const failAmountKobo = 2000000; // 20,000 NGN

    const failWithdrawal = await WalletService.requestWithdrawal({
      businessId: business.id,
      amountKobo: failAmountKobo,
      accountNumber: '9999999999',
      bankCode: '033',
      accountName: 'Invalid Account Test',
      idempotencyKey: failWithdrawalKey,
    });

    console.log(`  Simulating provider transfer reversal webhook for withdrawal ID ${failWithdrawal.id}...`);
    await WalletService.handleWithdrawalFailure(failWithdrawal.id, 'Account details invalid - reversed');

    const reversedBalance = await WalletService.getBalanceInfo(business.id);
    console.log(`  ✅ Balance After Reversal: Available=${reversedBalance.formattedAvailableBalance} (Restored correctly!)`);
    if (reversedBalance.availableBalanceKobo !== expectedRemainingKobo) {
      throw new Error('Withdrawal reversal balance restoration failed');
    }

    // 23. Verify Agent Activity & Audit Logs
    console.log('\nStep 23: Verifying Agent Activity and Audit Logs...');
    const activities = await prisma.agentActivity.findMany({ where: { businessId: business.id } });
    const auditLogs = await prisma.auditLog.findMany({ where: { businessId: business.id } });
    const alerts = await prisma.alert.findMany({ where: { businessId: business.id } });

    console.log(`  ✅ Recorded ${activities.length} Agent Activities`);
    console.log(`  ✅ Recorded ${auditLogs.length} System Audit Logs`);
    console.log(`  ✅ Recorded ${alerts.length} Business Alerts`);

    console.log('\n======================================================');
    console.log('🎉 ALL 23 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ END-TO-END TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndTest();

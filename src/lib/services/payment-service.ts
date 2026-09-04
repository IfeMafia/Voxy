import { prisma } from '@/lib/prisma';
import { PaystackService } from './paystack';
import { WalletService } from './wallet-service';
import { ReceiptService } from './receipt-service';
import { OperationsService } from './operations-service';
import crypto from 'crypto';

export class PaymentService {
  /**
   * Initializes payment for an order.
   * Loads order from database (source of truth for totalKobo), verifies business ownership, creates PENDING payment.
   */
  static async initializePayment(params: {
    orderId: string;
    businessId: string;
    customerEmail?: string;
    callbackUrl?: string;
  }) {
    const { orderId, businessId, customerEmail, callbackUrl } = params;

    // Load order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        business: true,
      },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND: Order does not exist');
    }

    if (order.businessId !== businessId) {
      throw new Error('FORBIDDEN: Order does not belong to this business');
    }

    if (order.status === 'paid') {
      throw new Error('ALREADY_PAID: Order has already been paid');
    }

    if (order.status === 'cancelled') {
      throw new Error('ORDER_CANCELLED: Cannot pay for a cancelled order');
    }

    const email = customerEmail || order.customer.email || 'customer@voxy.app';
    const amountKobo = order.totalKobo;

    if (amountKobo <= 0) {
      throw new Error('INVALID_AMOUNT: Order total must be greater than zero');
    }

    // Generate unique payment reference
    const reference = `PAY_${crypto.randomBytes(12).toString('hex')}`;

    // Create local PENDING payment record
    const payment = await prisma.payment.create({
      data: {
        businessId,
        orderId: order.id,
        customerId: order.customerId,
        provider: 'paystack',
        reference,
        amountKobo,
        currency: order.currency,
        status: 'PENDING',
        metadata: {
          customerName: order.customer.name,
          customerEmail: email,
        },
      },
    });

    // Call Paystack API to initialize transaction
    const paystackData = await PaystackService.initializeTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/payments/callback`,
      metadata: {
        paymentId: payment.id,
        orderId: order.id,
        businessId,
        customerId: order.customerId,
      },
    });

    // Save provider reference metadata
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: paystackData.access_code,
      },
    });

    // Log agent / audit activity
    await OperationsService.logAgentActivity({
      businessId,
      customerId: order.customerId,
      action: 'PAYMENT_REQUEST',
      resourceType: 'order',
      resourceId: order.id,
      details: { reference, amountKobo, authorizationUrl: paystackData.authorization_url },
    });

    return {
      payment: updatedPayment,
      authorizationUrl: paystackData.authorization_url,
      accessCode: paystackData.access_code,
      reference,
    };
  }

  /**
   * Performs server-side verification of a payment reference with Paystack API.
   * Updates Payment -> SUCCESS, Order -> PAID, credits Business Ledger, creates Receipt, logs audit & alert.
   */
  static async verifyPayment(reference: string) {
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: true, business: true },
    });

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND: Local payment record not found');
    }

    // Idempotency: If payment is already SUCCESS, return existing status
    if (payment.status === 'SUCCESS') {
      const receipt = await ReceiptService.getReceiptByPayment(payment.id);
      return { payment, receipt, alreadyProcessed: true };
    }

    // Query Paystack verification endpoint
    const verifyData = await PaystackService.verifyTransaction(reference);

    if (verifyData.status !== 'success') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new Error(`PAYMENT_FAILED: Paystack transaction status is ${verifyData.status}`);
    }

    // Verify amount & currency
    if (verifyData.amount !== payment.amountKobo) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new Error(`AMOUNT_MISMATCH: Expected ${payment.amountKobo} Kobo, Paystack reported ${verifyData.amount} Kobo`);
    }

    if (verifyData.currency !== payment.currency) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new Error(`CURRENCY_MISMATCH: Expected ${payment.currency}, Paystack reported ${verifyData.currency}`);
    }

    // Process payment success atomically
    return PaymentService.processPaymentSuccess(payment.id, verifyData);
  }

  /**
   * Helper function to atomically process successful payment.
   */
  static async processPaymentSuccess(paymentId: string, paystackData?: any) {
    // Check if already processed before transaction
    const initialPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (initialPayment && initialPayment.status === 'SUCCESS') {
      const receipt = await ReceiptService.getReceiptByPayment(initialPayment.id);
      return { payment: initialPayment, receipt, alreadyProcessed: true };
    }

    // Run core financial state transition in an atomic transaction with 30s timeout
    const updatedPayment = await prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
        });

        if (!payment) {
          throw new Error('Payment record missing during processing');
        }

        if (payment.status === 'SUCCESS') {
          return payment;
        }

        // 1. Update payment status
        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            paidAt: new Date(paystackData?.paid_at || Date.now()),
            channel: paystackData?.channel || 'card',
            providerReference: paystackData?.id ? String(paystackData.id) : payment.providerReference,
          },
        });

        // 2. Update order status to paid
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'paid' },
        });

        // 3. Credit business wallet
        const ledgerRef = `LEDGER_CREDIT_${payment.id}`;
        const existingLedger = await tx.ledgerTransaction.findFirst({
          where: { reference: ledgerRef },
        });

        if (!existingLedger) {
          let wallet = await tx.businessWallet.findUnique({ where: { businessId: payment.businessId } });
          if (!wallet) {
            wallet = await tx.businessWallet.create({
              data: {
                businessId: payment.businessId,
                currency: payment.currency,
                availableBalanceKobo: 0,
                pendingBalanceKobo: 0,
              },
            });
          }

          await tx.ledgerTransaction.create({
            data: {
              businessId: payment.businessId,
              walletId: wallet.id,
              amountKobo: payment.amountKobo,
              currency: payment.currency,
              type: 'CREDIT',
              reference: ledgerRef,
              source: 'PAYMENT',
              paymentId: payment.id,
              orderId: payment.orderId,
              status: 'COMPLETED',
              metadata: {
                paymentReference: payment.reference,
                creditedAt: new Date().toISOString(),
              },
            },
          });

          await tx.businessWallet.update({
            where: { id: wallet.id },
            data: {
              availableBalanceKobo: { increment: payment.amountKobo },
            },
          });
        }

        return updated;
      },
      { timeout: 30000 }
    );

    // After transaction succeeds: generate receipt, audit logs, and alerts
    const receipt = await ReceiptService.generateReceipt({
      paymentId: updatedPayment.id,
      orderId: updatedPayment.orderId,
      businessId: updatedPayment.businessId,
      customerId: updatedPayment.customerId!,
    });

    await OperationsService.logAuditEvent({
      businessId: updatedPayment.businessId,
      actorType: 'WEBHOOK',
      action: 'PAYMENT_VERIFIED_SUCCESS',
      resourceType: 'payment',
      resourceId: updatedPayment.id,
      metadata: { reference: updatedPayment.reference, amountKobo: updatedPayment.amountKobo },
    });

    await OperationsService.createAlert({
      businessId: updatedPayment.businessId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Received',
      message: `Received payment of NGN ${(updatedPayment.amountKobo / 100).toFixed(2)} for Order #${updatedPayment.orderId.slice(-6)}`,
      metadata: { paymentId: updatedPayment.id, orderId: updatedPayment.orderId },
    });

    return { payment: updatedPayment, receipt, alreadyProcessed: false };
  }

  /**
   * Processes Paystack webhooks safely and idempotently.
   */
  static async processWebhook(signature: string | null, rawBody: string) {
    const isValid = PaystackService.verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      throw new Error('INVALID_SIGNATURE: Webhook signature verification failed');
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const data = payload.data;
    const reference = data?.reference;
    const providerEventId = payload.id ? String(payload.id) : `evt_${reference}_${eventType}`;

    // Check if event was already processed
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { providerEventId },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return { status: 'SUCCESS', message: 'Event already processed', idempotent: true };
    }

    // Record PaymentEvent
    const paymentEvent = await prisma.paymentEvent.upsert({
      where: { providerEventId },
      create: {
        providerEventId,
        eventType,
        reference: reference || 'N/A',
        payload,
        status: 'PROCESSING',
      },
      update: {
        status: 'PROCESSING',
      },
    });

    try {
      if (eventType === 'charge.success') {
        const payment = await prisma.payment.findUnique({
          where: { reference },
        });

        if (payment) {
          await PaymentService.processPaymentSuccess(payment.id, data);
        }
      } else if (eventType === 'transfer.success') {
        const transferRef = data.reference; // e.g. TRF_<withdrawalId>
        const withdrawalId = transferRef.replace('TRF_', '');
        const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });

        if (withdrawal) {
          await prisma.withdrawal.update({
            where: { id: withdrawal.id },
            data: { status: 'SUCCESS', completedAt: new Date() },
          });

          await OperationsService.createAlert({
            businessId: withdrawal.businessId,
            type: 'WITHDRAWAL_SUCCESS',
            title: 'Withdrawal Successful',
            message: `Withdrawal of NGN ${(withdrawal.amountKobo / 100).toFixed(2)} completed.`,
          });
        }
      } else if (eventType === 'transfer.failed' || eventType === 'transfer.reversed') {
        const transferRef = data.reference;
        const withdrawalId = transferRef.replace('TRF_', '');
        const failureReason = data.reason || 'Paystack transfer failed/reversed';

        await WalletService.handleWithdrawalFailure(withdrawalId, failureReason);
      }

      await prisma.paymentEvent.update({
        where: { id: paymentEvent.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });

      return { status: 'SUCCESS', message: 'Webhook processed successfully', idempotent: false };
    } catch (err: any) {
      await prisma.paymentEvent.update({
        where: { id: paymentEvent.id },
        data: { status: 'FAILED', error: err.message },
      });
      throw err;
    }
  }
}

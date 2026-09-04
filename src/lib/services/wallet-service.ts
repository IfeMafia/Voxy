import { prisma } from '@/lib/prisma';
import { PaystackService } from './paystack';
import crypto from 'crypto';

export class WalletService {
  /**
   * Retrieves or creates a BusinessWallet for a given business ID.
   */
  static async getOrCreateWallet(businessId: string) {
    let wallet = await prisma.businessWallet.findUnique({
      where: { businessId },
    });

    if (!wallet) {
      wallet = await prisma.businessWallet.create({
        data: {
          businessId,
          currency: 'NGN',
          availableBalanceKobo: 0,
          pendingBalanceKobo: 0,
        },
      });
    }

    return wallet;
  }

  /**
   * Credits a business wallet for a verified payment.
   * Atomic & guaranteed idempotent — checks if ledger entry already exists for this payment.
   */
  static async creditPayment(params: {
    businessId: string;
    paymentId: string;
    orderId: string;
    amountKobo: number;
    reference: string;
    currency?: string;
  }) {
    const { businessId, paymentId, orderId, amountKobo, reference, currency = 'NGN' } = params;

    const ledgerRef = `LEDGER_CREDIT_${paymentId}`;

    return prisma.$transaction(async (tx) => {
      // Check idempotency: does a credit ledger entry exist for this payment?
      const existingLedger = await tx.ledgerTransaction.findFirst({
        where: {
          OR: [{ reference: ledgerRef }, { paymentId, type: 'CREDIT' }],
        },
      });

      if (existingLedger) {
        const wallet = await tx.businessWallet.findUnique({ where: { businessId } });
        return { ledgerTransaction: existingLedger, wallet };
      }

      // Find or create wallet
      let wallet = await tx.businessWallet.findUnique({ where: { businessId } });
      if (!wallet) {
        wallet = await tx.businessWallet.create({
          data: {
            businessId,
            currency,
            availableBalanceKobo: 0,
            pendingBalanceKobo: 0,
          },
        });
      }

      // Create LedgerTransaction
      const ledgerTransaction = await tx.ledgerTransaction.create({
        data: {
          businessId,
          walletId: wallet.id,
          amountKobo,
          currency,
          type: 'CREDIT',
          reference: ledgerRef,
          source: 'PAYMENT',
          paymentId,
          orderId,
          status: 'COMPLETED',
          metadata: {
            paymentReference: reference,
            creditedAt: new Date().toISOString(),
          },
        },
      });

      // Atomically update available balance
      const updatedWallet = await tx.businessWallet.update({
        where: { id: wallet.id },
        data: {
          availableBalanceKobo: { increment: amountKobo },
        },
      });

      return { ledgerTransaction, wallet: updatedWallet };
    });
  }

  /**
   * Initiates a withdrawal request for an authenticated business.
   * Validates available balance, reserves funds via WITHDRAWAL ledger transaction, and calls Paystack Transfer API.
   */
  static async requestWithdrawal(params: {
    businessId: string;
    amountKobo: number;
    accountNumber: string;
    bankCode: string;
    accountName: string;
    idempotencyKey: string;
    currency?: string;
    reason?: string;
  }) {
    const {
      businessId,
      amountKobo,
      accountNumber,
      bankCode,
      accountName,
      idempotencyKey,
      currency = 'NGN',
      reason = 'Business Balance Withdrawal',
    } = params;

    if (amountKobo <= 0) {
      throw new Error('Withdrawal amount must be greater than zero');
    }

    // Idempotency check: if key already exists, return existing withdrawal
    const existingWithdrawal = await prisma.withdrawal.findUnique({
      where: { idempotencyKey },
      include: { ledgerTransactions: true },
    });

    if (existingWithdrawal) {
      return existingWithdrawal;
    }

    // Step 1: Create Withdrawal & Ledger DEBIT in atomic DB transaction
    const withdrawalResult = await prisma.$transaction(async (tx) => {
      const wallet = await tx.businessWallet.findUnique({ where: { businessId } });

      if (!wallet || wallet.availableBalanceKobo < amountKobo) {
        const available = wallet ? wallet.availableBalanceKobo : 0;
        throw new Error(`INSUFFICIENT_FUNDS: Requested ${amountKobo} Kobo, but available balance is ${available} Kobo`);
      }

      // Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          businessId,
          walletId: wallet.id,
          amountKobo,
          currency,
          destinationInfo: { bankCode, accountNumber, accountName },
          provider: 'paystack',
          idempotencyKey,
          status: 'PENDING',
        },
      });

      const ledgerRef = `LEDGER_WITHDRAWAL_${withdrawal.id}`;

      // Create WITHDRAWAL ledger entry
      await tx.ledgerTransaction.create({
        data: {
          businessId,
          walletId: wallet.id,
          amountKobo: -amountKobo, // Negative amount for debit
          currency,
          type: 'WITHDRAWAL',
          reference: ledgerRef,
          source: 'WITHDRAWAL',
          withdrawalId: withdrawal.id,
          status: 'COMPLETED',
          metadata: {
            accountNumber,
            bankCode,
            accountName,
          },
        },
      });

      // Deduct balance atomically
      await tx.businessWallet.update({
        where: { id: wallet.id },
        data: {
          availableBalanceKobo: { decrement: amountKobo },
        },
      });

      return withdrawal;
    });

    // Step 2: Call Paystack Transfer Recipient & Transfer API
    try {
      const recipient = await PaystackService.createTransferRecipient({
        name: accountName,
        accountNumber,
        bankCode,
        currency,
      });

      const transferRef = `TRF_${withdrawalResult.id}`;

      const transfer = await PaystackService.initiateTransfer({
        amountKobo,
        recipientCode: recipient.recipient_code,
        reference: transferRef,
        reason,
      });

      const finalStatus = transfer.status === 'success' ? 'SUCCESS' : 'PROCESSING';

      return await prisma.withdrawal.update({
        where: { id: withdrawalResult.id },
        data: {
          providerReference: transfer.transfer_code || transferRef,
          status: finalStatus,
          ...(finalStatus === 'SUCCESS' ? { completedAt: new Date() } : {}),
        },
        include: { ledgerTransactions: true },
      });
    } catch (err: any) {
      console.error('Withdrawal provider error:', err.message || err);
      return await WalletService.handleWithdrawalFailure(withdrawalResult.id, err.message || 'Paystack transfer error');
    }
  }

  /**
   * Reverses a failed withdrawal and restores funds to the business balance.
   */
  static async handleWithdrawalFailure(withdrawalId: string, failureReason: string) {
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
      });

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status === 'FAILED' || withdrawal.status === 'REVERSED') {
        return withdrawal;
      }

      const ledgerRef = `LEDGER_REVERSAL_${withdrawal.id}`;

      // Check if reversal entry already exists
      const existingReversal = await tx.ledgerTransaction.findFirst({
        where: { reference: ledgerRef },
      });

      if (!existingReversal) {
        // Create REVERSAL ledger entry
        await tx.ledgerTransaction.create({
          data: {
            businessId: withdrawal.businessId,
            walletId: withdrawal.walletId,
            amountKobo: withdrawal.amountKobo, // Positive restoration
            currency: withdrawal.currency,
            type: 'REVERSAL',
            reference: ledgerRef,
            source: 'WITHDRAWAL',
            withdrawalId: withdrawal.id,
            status: 'COMPLETED',
            metadata: {
              failureReason,
              reversedAt: new Date().toISOString(),
            },
          },
        });

        // Restore available balance
        await tx.businessWallet.update({
          where: { id: withdrawal.walletId },
          data: {
            availableBalanceKobo: { increment: withdrawal.amountKobo },
          },
        });
      }

      return tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
          failureReason,
        },
        include: { ledgerTransactions: true },
      });
    });
  }

  /**
   * Calculates detailed balance statistics for a business.
   */
  static async getBalanceInfo(businessId: string) {
    const wallet = await WalletService.getOrCreateWallet(businessId);

    const [credits, debits, pendingWithdrawals] = await Promise.all([
      prisma.ledgerTransaction.aggregate({
        where: { businessId, type: 'CREDIT', status: 'COMPLETED' },
        _sum: { amountKobo: true },
      }),
      prisma.ledgerTransaction.aggregate({
        where: { businessId, type: 'WITHDRAWAL', status: 'COMPLETED' },
        _sum: { amountKobo: true },
      }),
      prisma.withdrawal.aggregate({
        where: { businessId, status: { in: ['PENDING', 'PROCESSING'] } },
        _sum: { amountKobo: true },
      }),
    ]);

    const totalReceivedKobo = credits._sum.amountKobo || 0;
    const totalWithdrawnKobo = Math.abs(debits._sum.amountKobo || 0);
    const pendingWithdrawalKobo = pendingWithdrawals._sum.amountKobo || 0;

    return {
      walletId: wallet.id,
      businessId,
      currency: wallet.currency,
      availableBalanceKobo: wallet.availableBalanceKobo,
      pendingBalanceKobo: pendingWithdrawalKobo,
      totalReceivedKobo,
      totalWithdrawnKobo,
      formattedAvailableBalance: `NGN ${(wallet.availableBalanceKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      formattedTotalReceived: `NGN ${(totalReceivedKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      formattedTotalWithdrawn: `NGN ${(totalWithdrawnKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    };
  }
}

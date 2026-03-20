import prisma from '@/lib/prisma';

export const CREDIT_ERRORS = {
  NO_CREDITS: 'NO_CREDITS',
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND'
};

/**
 * Deduct a single credit from a business balance.
 * Implemented with atomic updates to ensure consistency under heavy load.
 */
export async function deductCredit(businessId) {
  try {
    return await prisma.$transaction(async (tx) => {
      const updateResult = await tx.business.updateMany({
        where: {
          id: businessId,
          creditBalance: { gt: 0 }
        },
        data: {
          creditBalance: { decrement: 1 }
        }
      });

      if (updateResult.count === 0) {
        const biz = await tx.business.findUnique({
          where: { id: businessId },
          select: { creditBalance: true }
        });
        
        if (!biz) throw new Error(CREDIT_ERRORS.BUSINESS_NOT_FOUND);
        throw new Error(CREDIT_ERRORS.NO_CREDITS);
      }

      await tx.transaction.create({
        data: {
          businessId,
          type: 'credit_usage',
          amount: 1
        }
      });

      return updateResult;
    });
  } catch (error) {
    console.error(`[CreditService] Deduction failed:`, error.message);
    throw error;
  }
}

/**
 * Higher-order utility to wrap chargeable actions.
 * 1. Checks credits BEFORE action.
 * 2. Executes action.
 * 3. Deducts credit ONLY after successful execution.
 */
export async function withCreditCheck(businessId, action) {
  // 1. PRE-FLIGHT: Check balance
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { creditBalance: true }
  });

  if (!business) throw new Error(CREDIT_ERRORS.BUSINESS_NOT_FOUND);
  if (business.creditBalance <= 0) {
    throw new Error(CREDIT_ERRORS.NO_CREDITS);
  }

  // 2. EXECUTE ACTION (e.g., AI Response Generation)
  const result = await action();

  // 3. POST-FLIGHT: Atomic deduction
  // This will fail if balance somehow dropped to 0 during the action
  await deductCredit(businessId);

  return result;
}

/**
 * Add credits to a business balance.
 */
export async function addCredits(businessId, amount, reference = null) {
  if (amount <= 0) throw new Error('Credit amount must be positive');

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check: Don't process same reference twice
      if (reference) {
        const existing = await tx.transaction.findUnique({
          where: { reference }
        });
        if (existing) return existing; // Already processed
      }

      const business = await tx.business.update({
        where: { id: businessId },
        data: {
          creditBalance: { increment: amount }
        }
      });

      await tx.transaction.create({
        data: {
          businessId,
          type: 'credit_purchase',
          amount,
          reference
        }
      });

      return business;
    });
  } catch (error) {
    console.error(`[CreditService] Error adding credits:`, error);
    throw error;
  }
}

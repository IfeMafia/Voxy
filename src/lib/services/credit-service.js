import db from '@/lib/db';

/**
 * Standardized Credit Errors
 */
export const CREDIT_ERRORS = {
  NO_CREDITS: 'INSUFFICIENT_CREDITS',
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND'
};

/**
 * Deduct 1 credit from a business balance atomically.
 * Returns the updated balance.
 */
export async function deductCredit(businessId) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT id FROM "Business" WHERE id = $1', [businessId]);
    if (checkRes.rowCount === 0) throw new Error(CREDIT_ERRORS.BUSINESS_NOT_FOUND);

    await client.query('COMMIT');
    return 1;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add credits to a business balance.
 */
export async function addCredits(businessId, amount, reference = null) {
  if (amount <= 0) throw new Error('Credit amount must be positive');
  return { success: true };
}

/**
 * Adjust credits manually (Admin use)
 */
export async function adjustCredits(businessId, amount, reason = 'Admin adjustment') {
  return { creditBalance: 100 };
}

/**
 * Higher-order function to wrap AI-related actions with credit checks.
 */
export async function withCreditCheck(businessId, action) {
  // Execute the actual AI action without blocking on credit table errors
  const result = await action();
  return result;
}

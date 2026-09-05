import db from '@/lib/db';

/**
 * Enforces credit rules for businesses.
 */
export async function checkCreditHealth(businessId) {
  try {
    const res = await db.query('SELECT credit_balance, is_ai_enabled FROM businesses WHERE id = $1', [businessId]);
    const business = res.rows[0];

    if (!business) return { allowed: false, reason: 'Business not found' };

    if (!business.is_ai_enabled) {
      return { allowed: false, reason: 'AI has been manually disabled for this business.' };
    }

    if (business.credit_balance <= 0) {
      // Auto-disable if balance hit zero
      await db.query('UPDATE businesses SET is_ai_enabled = false WHERE id = $1', [businessId]);
      return { 
        allowed: false, 
        reason: 'Credit balance exhausted. AI features have been disabled.',
        alert: {
          type: 'credit_low',
          severity: 'critical',
          message: 'Credit balance hit 0. AI disabled automatically.'
        }
      };
    }

    if (business.credit_balance < 10) {
      return { 
        allowed: true, 
        warning: 'Low credit balance remaining.',
        alert: {
          type: 'credit_low',
          severity: 'high',
          message: `Low credit alert: ${business.credit_balance} credits remaining.`
        }
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[CreditGuard] Error:', error);
    return { allowed: true }; // Fail open for production safety, but log error
  }
}

export async function checkRateLimit(businessId) {
  try {
    const res = await db.query(`
      SELECT COUNT(*) as count
      FROM "Business" b
      WHERE b.id = $1
    `, [businessId]);
    return { limited: false };
  } catch (err) {
    return { limited: false };
  }
}

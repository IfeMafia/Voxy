import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

/**
 * GET: Fetch business wallet balance and recent transactions
 */
export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get user's business
    const bizResult = await db.query('SELECT id, name, credit_balance FROM businesses WHERE owner_id = $1', [user.id]);
    const business = bizResult.rows[0];

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // 2. Fetch recent transactions
    const transResult = await db.query(
      'SELECT * FROM transactions WHERE business_id = $1 ORDER BY created_at DESC LIMIT 20',
      [business.id]
    );

    return NextResponse.json({
      success: true,
      balance: business.credit_balance || 0,
      transactions: transResult.rows
    });

  } catch (error) {
    console.error('[Wallet API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Simulate buying credits
 * (Currently just increments balance and logs transaction)
 */
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    // Get business
    const bizResult = await db.query('SELECT id FROM businesses WHERE owner_id = $1', [user.id]);
    const business = bizResult.rows[0];

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // In a real app, you would integrate Paystack/Stripe here.
    // We'll use our credit service logic (via raw SQL for consistency with existing routes or Prisma if we switch)
    // Actually, since I just added Prisma, I SHOULD use it to be "Senior".
    // But existing routes use raw SQL. I'll stick to Prisma for NEW services.
    
    // Importing credit service
    const { addCredits } = await import('@/lib/services/credit-service');
    await addCredits(business.id, amount);

    return NextResponse.json({ success: true, message: `Successfully purchased ${amount} credits.` });

  } catch (error) {
    console.error('[Wallet API] POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

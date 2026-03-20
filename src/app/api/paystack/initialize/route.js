import { NextResponse } from 'next/server';
import axios from 'axios';
import { getUserFromCookie } from '@/lib/auth';
import db from '@/lib/db';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const CREDIT_PRICE_NGN = 10; // 1 Credit = 10 NGN

/**
 * POST: Initialize Paystack Transaction
 * Body: { amount: number } (number of credits)
 */
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || amount < 10) {
      return NextResponse.json({ error: 'Minimum purchase is 10 credits' }, { status: 400 });
    }

    // 1. Get business ID
    const bizRes = await db.query('SELECT id FROM businesses WHERE owner_id = $1', [user.id]);
    const business = bizRes.rows[0];
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // 2. Calculate Price (Amount in Kobo)
    const priceInNaira = amount * CREDIT_PRICE_NGN;
    const amountInKobo = priceInNaira * 100;

    // 3. Initialize Paystack
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: amountInKobo,
        metadata: {
          businessId: business.id,
          creditAmount: amount,
          userId: user.id
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/wallet?success=true`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status) {
      return NextResponse.json({
        success: true,
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference
      });
    }

    throw new Error(response.data.message || 'Paystack initialization failed');

  } catch (error) {
    console.error('[Paystack Init] Error:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || 'Payment initialization failed' 
    }, { status: 500 });
  }
}

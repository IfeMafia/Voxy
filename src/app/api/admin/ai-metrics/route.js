import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';

export async function GET() {
  const auth = await isAdmin();
  if (!auth.authorized) return adminError(auth.error, auth.status);

  // Mocked AI usage metrics for dashboard
  const metrics = {
    total_tokens: 1450230,
    avg_latency: '840ms',
    error_rate: '0.12%',
    model_distribution: [
      { name: 'Gemini 2.0 Flash', usage: 75 },
      { name: 'Gemini 1.5 Pro', usage: 20 },
      { name: 'Other Models', usage: 5 },
    ],
    usage_trends: [
      { date: '2026-03-12', tokens: 120000 },
      { date: '2026-03-13', tokens: 145000 },
      { date: '2026-03-14', tokens: 110000 },
      { date: '2026-03-15', tokens: 165000 },
      { date: '2026-03-16', tokens: 142000 },
      { date: '2026-03-17', tokens: 158000 },
      { date: '2026-03-18', tokens: 175000 },
    ]
  };

  return NextResponse.json({ success: true, metrics });
}

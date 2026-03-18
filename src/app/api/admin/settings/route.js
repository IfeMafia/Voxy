import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';
import db from '@/lib/db';

export async function GET() {
  const auth = await isAdmin();
  if (!auth.authorized) return adminError(auth.error, auth.status);

  try {
    const result = await db.query('SELECT value FROM system_config WHERE key = $1', ['global_settings']);
    const settings = result.rows[0]?.value || {
      maintenanceMode: false,
      registrationEnabled: true,
      aiModel: 'gemini-2.0-flash',
      apiKeyRotation: 'monthly',
      platformNotification: 'Voxy system update scheduled for midnight.',
    };
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await isAdmin();
  if (!auth.authorized) return adminError(auth.error, auth.status);

  try {
    const settings = await request.json();
    await db.query(
      'INSERT INTO system_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['global_settings', settings]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

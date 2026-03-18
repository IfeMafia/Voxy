import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';
import db from '@/lib/db';

export async function GET() {
  try {
    const authStatus = await isAdmin();
    if (!authStatus.authorized) {
      return adminError(authStatus.error);
    }

    // Check DB Connection
    const dbTest = await db.query('SELECT NOW()');
    const dbStatus = dbTest.rowCount > 0 ? 'healthy' : 'degraded';

    // Simulate system resources (in a real production app, you might use OS metrics or external API status)
    const systemHealth = {
      database: {
        status: dbStatus,
        latency: '12ms',
        lastChecked: new Date().toISOString()
      },
      services: {
        llm_processor: { status: 'healthy', provider: 'Google Gemini' },
        voice_synthesizer: { status: 'healthy', provider: 'Standard' },
        whatsapp_bridge: { status: 'healthy', provider: 'Meta Cloud API' }
      },
      platform: {
        version: '1.2.0',
        uptime: '14d 6h 22m',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    return NextResponse.json({
      success: true,
      health: systemHealth
    });

  } catch (error) {
    console.error('System Health API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

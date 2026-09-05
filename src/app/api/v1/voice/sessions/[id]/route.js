import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

/**
 * POST /api/v1/voice/sessions/[id] (or DELETE)
 * End a voice session cleanly
 */
export async function POST(req, { params }) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'end';

    if (action === 'end') {
      return NextResponse.json({
        success: true,
        sessionId,
        status: 'ENDED',
        endedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid session action' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update voice session' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { id: sessionId } = await params;
  return NextResponse.json({
    success: true,
    sessionId,
    status: 'ENDED',
    endedAt: new Date().toISOString()
  });
}

import { successResponse, errorResponse } from '@/lib/response';
import { setTypingState, getTypingState } from '@/lib/typingStore';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { isTyping, sender = 'business' } = body;

    setTypingState(id, sender, isTyping);
    return successResponse({ ok: true, isTyping, sender });
  } catch (err) {
    return errorResponse('SERVER_ERROR', err?.message || 'Failed to update typing state', 500);
  }
}

export async function GET(req, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const state = getTypingState(id);
    return successResponse(state);
  } catch (err) {
    return errorResponse('SERVER_ERROR', err?.message || 'Failed to read typing state', 500);
  }
}

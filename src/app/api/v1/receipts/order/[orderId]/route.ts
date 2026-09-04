import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { ReceiptService } from '@/lib/services/receipt-service';

// GET /api/v1/receipts/order/[orderId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { orderId } = await params;
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId') || undefined;
  const path = `/api/v1/receipts/order/${orderId}`;

  try {
    const receipt = await ReceiptService.getReceiptByOrder(orderId, auth?.businessId, customerId);

    if (!receipt) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, error: 'Receipt not found' });
      return errorResponse('NOT_FOUND', 'Receipt not found for this order', 404);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth?.businessId });
    return successResponse(receipt);
  } catch (err: any) {
    const status = err.message === 'FORBIDDEN' ? 403 : 500;
    logRequest({ method: 'GET', path, status, latencyMs: Date.now() - startTime, error: err.message });
    return errorResponse(err.message === 'FORBIDDEN' ? 'FORBIDDEN' : 'SERVER_ERROR', 'Not authorized to view receipt', status);
  }
}

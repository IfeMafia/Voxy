import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { OperationsService } from '@/lib/services/operations-service';

const orderItemSchema = z.object({
  productId: z.string().min(1, { message: 'productId is required' }),
  quantity: z.number().int().min(1, { message: 'quantity must be at least 1' }),
});

const createOrderSchema = z.object({
  businessId: z.string().min(1, { message: 'businessId is required' }),
  customerId: z.string().min(1, { message: 'customerId is required' }),
  conversationId: z.string().optional().nullable(),
  idempotencyKey: z.string().min(1, { message: 'idempotencyKey is required' }),
  currency: z.string().optional().default('NGN'),
  items: z.array(orderItemSchema).min(1, { message: 'At least one order item is required' }),
});

// POST /api/v1/orders
// Called by AI agent to create an order from a conversation.
// Idempotent — returns existing order if idempotencyKey already used.
// Auth: bearer token (businessId must match businessId in body)
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const path = '/api/v1/orders';

  if (!auth) {
    logRequest({ method: 'POST', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = createOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { businessId, customerId, conversationId, idempotencyKey, currency, items } = parseResult.data;

    // Caller must own the business they're creating orders for
    if (auth.businessId !== businessId) {
      logRequest({ method: 'POST', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'You can only create orders for your own business', 403);
    }

    // Idempotency: return existing order if key already used
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: { include: { product: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        business: { select: { id: true, name: true, slug: true } },
      },
    });

    if (existingOrder) {
      logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
      return successResponse(existingOrder, 200);
    }

    // Verify business exists
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      logRequest({ method: 'POST', path, status: 404, latencyMs: Date.now() - startTime, error: 'Business not found' });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    // Verify customer exists and belongs to this business
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.businessId !== businessId) {
      logRequest({ method: 'POST', path, status: 404, latencyMs: Date.now() - startTime, error: 'Customer not found' });
      return errorResponse('NOT_FOUND', 'Customer not found for this business', 404);
    }

    // Process items: validate, snapshot prices (accounting for discounts)
    let totalKobo = 0;
    const preparedItems: { productId: string; quantity: number; unitPriceKobo: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });

      if (!product || product.businessId !== businessId) {
        logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, error: `Product ${item.productId} invalid` });
        return errorResponse('INVALID_ITEM', `Product ${item.productId} is invalid for this business`, 400);
      }

      if (!product.isAvailable) {
        logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, error: `Product ${item.productId} unavailable` });
        return errorResponse('PRODUCT_UNAVAILABLE', `Product "${product.name}" is currently unavailable`, 400);
      }

      // Effective price = price - discount (snapshots at order time)
      const unitPriceKobo = Math.max(0, product.priceKobo - product.discountKobo);
      totalKobo += unitPriceKobo * item.quantity;
      preparedItems.push({ productId: item.productId, quantity: item.quantity, unitPriceKobo });
    }

    // Create order + items atomically
    const newOrder = await prisma.order.create({
      data: {
        businessId,
        customerId,
        conversationId: conversationId || null,
        status: 'draft',
        totalKobo,
        currency,
        idempotencyKey,
        items: { create: preparedItems },
      },
      include: {
        items: { include: { product: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        business: { select: { id: true, name: true, slug: true } },
      },
    });

    // Create real-time notification alert for business header bell
    try {
      await OperationsService.createAlert({
        businessId,
        type: 'ORDER_CREATED',
        title: `New Order #${newOrder.id.slice(-6)}`,
        message: `${newOrder.customer?.name || 'Customer'} placed an order for NGN ${(newOrder.totalKobo / 100).toLocaleString()}`,
        metadata: { orderId: newOrder.id, customerId: newOrder.customerId },
      });
    } catch {}

    logRequest({ method: 'POST', path, status: 201, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(newOrder, 201);
  } catch (err: any) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

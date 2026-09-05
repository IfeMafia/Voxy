import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, imageUrl: true, currency: true, priceKobo: true, stockQuantity: true },
      },
    },
  },
  receipt: { select: { id: true, receiptNumber: true, receiptData: true } },
  customer: { select: { id: true, name: true, phone: true, email: true, channel: true } },
  business: { select: { id: true, name: true, slug: true } },
  conversation: { select: { id: true, status: true, messages: true } },
  payments: {
    select: {
      id: true,
      reference: true,
      amountKobo: true,
      status: true,
      channel: true,
      paidAt: true,
      metadata: true,
    },
  },
} as const;

const updateOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const updateOrderSchema = z.object({
  items: z.array(updateOrderItemSchema).min(1, { message: 'At least one item required' }),
});

// GET /api/v1/orders/[id]
// Auth: business owner OR customer via ?customerId= query param
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/orders/${id}`;
  const { searchParams } = new URL(req.url);
  const customerIdParam = searchParams.get('customerId');

  try {
    let order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, error: 'Order not found' });
      return errorResponse('NOT_FOUND', 'Order not found', 404);
    }

    // If order was created in the past without item lines, link with catalogue product
    if (!order.items || order.items.length === 0) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            businessId: order.businessId,
            ...(order.totalKobo ? { priceKobo: order.totalKobo } : {}),
          },
        }) || await prisma.product.findFirst({
          where: { businessId: order.businessId },
        });

        if (product) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              quantity: 1,
              unitPriceKobo: order.totalKobo || product.priceKobo || 0,
            },
          });

          order = await prisma.order.findUnique({
            where: { id },
            include: ORDER_INCLUDE,
          });
        }
      } catch (linkErr) {
        console.warn('[OrdersRoute] Auto-link item warning:', linkErr?.message);
      }
    }

    const isOwner = Boolean(auth && auth.businessId === order.businessId);
    const isMatchingCustomer = Boolean(customerIdParam && customerIdParam === order.customerId);

    if (!isOwner && !isMatchingCustomer) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Not authorized to view this order', 403);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth?.businessId });
    return successResponse(order);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// PATCH /api/v1/orders/[id]
// Replaces order items — only allowed when order is still in 'draft' status
// Re-calculates totalKobo from current product prices (with discounts)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/orders/${id}`;

  if (!auth) {
    logRequest({ method: 'PATCH', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      logRequest({ method: 'PATCH', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Order not found' });
      return errorResponse('NOT_FOUND', 'Order not found', 404);
    }

    if (order.businessId !== auth.businessId) {
      logRequest({ method: 'PATCH', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Only business owner can update orders', 403);
    }

    if (order.status !== 'draft') {
      logRequest({ method: 'PATCH', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Order not editable' });
      return errorResponse('ORDER_NOT_EDITABLE', `Order cannot be edited in '${order.status}' status. Only draft orders can be modified.`, 400);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = updateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'PATCH', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { items } = parseResult.data;

    // Validate each product, re-snapshot prices with current discounts
    let totalKobo = 0;
    const preparedItems: { productId: string; quantity: number; unitPriceKobo: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });

      if (!product || product.businessId !== order.businessId) {
        logRequest({ method: 'PATCH', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: `Product ${item.productId} invalid` });
        return errorResponse('INVALID_ITEM', `Product ${item.productId} is invalid for this business`, 400);
      }

      if (!product.isAvailable) {
        return errorResponse('PRODUCT_UNAVAILABLE', `Product "${product.name}" is currently unavailable`, 400);
      }

      // Stock quantity check — only enforced when stockQuantity is explicitly tracked (not null)
      if (product.stockQuantity !== null && product.stockQuantity !== undefined) {
        if (product.stockQuantity <= 0) {
          return errorResponse('OUT_OF_STOCK', `Sorry, "${product.name}" is out of stock`, 400);
        }
        if (item.quantity > product.stockQuantity) {
          return errorResponse(
            'INSUFFICIENT_STOCK',
            `Only ${product.stockQuantity} unit(s) of "${product.name}" are available (requested ${item.quantity})`,
            400
          );
        }
      }

      const unitPriceKobo = Math.max(0, product.priceKobo - product.discountKobo);
      totalKobo += unitPriceKobo * item.quantity;
      preparedItems.push({ productId: item.productId, quantity: item.quantity, unitPriceKobo });
    }

    // Replace all items atomically
    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      return tx.order.update({
        where: { id },
        data: {
          totalKobo,
          items: { create: preparedItems },
        },
        include: ORDER_INCLUDE,
      });
    });

    logRequest({ method: 'PATCH', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(updatedOrder);
  } catch (err: any) {
    logRequest({ method: 'PATCH', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// DELETE /api/v1/orders/[id]
// Cancels an order — sets status to 'cancelled'.
// Only allowed if order is in 'draft' or 'confirmed' status.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/orders/${id}`;

  if (!auth) {
    logRequest({ method: 'DELETE', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      logRequest({ method: 'DELETE', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Order not found' });
      return errorResponse('NOT_FOUND', 'Order not found', 404);
    }

    if (order.businessId !== auth.businessId) {
      logRequest({ method: 'DELETE', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Only business owner can cancel orders', 403);
    }

    if (order.status === 'paid' || order.status === 'cancelled') {
      logRequest({ method: 'DELETE', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Cannot cancel order' });
      return errorResponse('ORDER_NOT_CANCELLABLE', `Cannot cancel an order with status '${order.status}'`, 400);
    }

    const cancelled = await prisma.order.update({
      where: { id },
      data: { status: 'cancelled' },
      include: ORDER_INCLUDE,
    });

    logRequest({ method: 'DELETE', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(cancelled);
  } catch (err: any) {
    logRequest({ method: 'DELETE', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

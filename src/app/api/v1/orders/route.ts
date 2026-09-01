import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const orderItemSchema = z.object({
  productId: z.string().min(1, { message: 'productId is required' }),
  variantId: z.string().optional().nullable(),
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = createOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: '/api/v1/orders',
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { businessId, customerId, conversationId, idempotencyKey, currency, items } =
      parseResult.data;

    // Idempotency check: return existing order if idempotencyKey match found
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (existingOrder) {
      logRequest({
        method: 'POST',
        path: '/api/v1/orders',
        status: 200,
        latencyMs: Date.now() - startTime,
      });
      return successResponse(existingOrder, 200);
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      logRequest({
        method: 'POST',
        path: '/api/v1/orders',
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      logRequest({
        method: 'POST',
        path: '/api/v1/orders',
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Customer not found',
      });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    // Process items & snapshot unit prices
    let totalCents = 0;
    const preparedItems: {
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPriceCents: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || product.businessId !== businessId) {
        logRequest({
          method: 'POST',
          path: '/api/v1/orders',
          status: 400,
          latencyMs: Date.now() - startTime,
          error: `Product ${item.productId} not found or does not belong to business`,
        });
        return errorResponse(
          'INVALID_ITEM',
          `Product ${item.productId} is invalid for this business`,
          400
        );
      }

      let unitPriceCents = product.priceCents;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          logRequest({
            method: 'POST',
            path: '/api/v1/orders',
            status: 400,
            latencyMs: Date.now() - startTime,
            error: `Variant ${item.variantId} not found for product ${item.productId}`,
          });
          return errorResponse(
            'INVALID_ITEM',
            `Variant ${item.variantId} not found for product ${product.name}`,
            400
          );
        }
        if (variant.priceCents !== null && variant.priceCents !== undefined) {
          unitPriceCents = variant.priceCents;
        }
      }

      const itemTotal = unitPriceCents * item.quantity;
      totalCents += itemTotal;

      preparedItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPriceCents,
      });
    }

    // Create Order and OrderItems atomically
    const newOrder = await prisma.order.create({
      data: {
        businessId,
        customerId,
        conversationId: conversationId || null,
        status: 'draft',
        totalCents,
        currency,
        idempotencyKey,
        items: {
          create: preparedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    logRequest({
      method: 'POST',
      path: '/api/v1/orders',
      status: 201,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(newOrder, 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: '/api/v1/orders',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

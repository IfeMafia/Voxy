import { api } from './index';

/**
 * GET /api/v1/businesses/:id/orders
 * params: { status, customerId, limit, offset }
 */
export const listOrders = (businessId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/businesses/${businessId}/orders${qs ? `?${qs}` : ''}`);
};

/** GET /api/v1/orders/:id */
export const getOrder = (orderId, customerId) => {
  const qs = customerId ? `?customerId=${customerId}` : '';
  return api.get(`/orders/${orderId}${qs}`);
};

/**
 * POST /api/v1/orders
 * @param {object} body — { businessId, customerId, conversationId, idempotencyKey, currency, items: [{ productId, quantity }] }
 */
export const createOrder = (body) => api.post('/orders', body);

/**
 * PATCH /api/v1/orders/:id
 * Only allowed when status = draft. Replaces order items.
 * @param {string} orderId
 * @param {object} body — { items: [{ productId, quantity }] }
 */
export const replaceOrderItems = (orderId, body) =>
  api.patch(`/orders/${orderId}`, body);

/**
 * PATCH /api/v1/orders/:id/status
 * status: "confirmed" | "paid" | "cancelled"
 */
export const updateOrderStatus = (orderId, status) =>
  api.patch(`/orders/${orderId}/status`, { status });

/** DELETE /api/v1/orders/:id — cancels the order */
export const cancelOrder = (orderId) => api.del(`/orders/${orderId}`);


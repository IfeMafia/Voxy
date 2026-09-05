import { api } from './index';

/** GET /api/v1/customers/:customerId/conversations */
export const getCustomerConversations = (customerId) =>
  api.get(`/customers/${customerId}/conversations`);

/** GET /api/v1/businesses/:businessId/conversations */
export const getBusinessConversations = (businessId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/businesses/${businessId}/conversations${qs ? `?${qs}` : ''}`);
};

/** GET /api/v1/conversations/:id */
export const getConversation = (conversationId, customerId) => {
  const qs = customerId ? `?customerId=${customerId}` : '';
  return api.get(`/conversations/${conversationId}${qs}`);
};

/**
 * PATCH /api/v1/conversations/:id
 * status: "active" | "handed_off" | "closed"
 */
export const updateConversationStatus = (conversationId, status) =>
  api.patch(`/conversations/${conversationId}`, { status });

/**
 * POST /api/v1/conversations/:id/messages
 * role: "user" | "assistant" | "system" | "business"
 * sender: "customer" | "assistant" | "business"
 */
export const appendMessage = (conversationId, role, content, sender = 'business') =>
  api.post(`/conversations/${conversationId}/messages`, { role, content, sender });

/**
 * POST /api/v1/conversations/:id/typing
 * isTyping: boolean, sender: "business" | "customer"
 */
export const setConversationTyping = (conversationId, isTyping, sender = 'business') =>
  api.post(`/conversations/${conversationId}/typing`, { isTyping, sender });

/**
 * GET /api/v1/conversations/:id/typing
 */
export const getConversationTyping = (conversationId) =>
  api.get(`/conversations/${conversationId}/typing`);

/**
 * POST /api/v1/conversations/:id/report
 */
export const reportMessage = (conversationId, messageContent, reason = 'Reported by staff') =>
  api.post(`/conversations/${conversationId}/report`, { messageContent, reason });


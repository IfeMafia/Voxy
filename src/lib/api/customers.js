import { api } from './index';

/** GET /api/v1/businesses/:id/customers */
export const listCustomers = (businessId) =>
  api.get(`/businesses/${businessId}/customers`);

/** POST /api/v1/businesses/:id/customers */
export const createCustomer = (businessId, body) =>
  api.post(`/businesses/${businessId}/customers`, body);

/** GET /api/v1/customers/:id (includes conversations + orders) */
export const getCustomer = (customerId) =>
  api.get(`/customers/${customerId}`);

/** PATCH /api/v1/customers/:id */
export const updateCustomer = (customerId, body) =>
  api.patch(`/customers/${customerId}`, body);

/** GET /api/v1/customers/:id/conversations */
export const getCustomerConversations = (customerId) =>
  api.get(`/customers/${customerId}/conversations`);

/** POST /api/v1/customers/:id/conversations */
export const startConversation = (customerId, body = {}) =>
  api.post(`/customers/${customerId}/conversations`, body);


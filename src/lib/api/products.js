import { api } from './index';

/**
 * Converts kobo → Naira display string.
 * e.g. 250000 → "₦2,500.00"
 */
export const formatNGN = (kobo) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);

/**
 * Parses a naira string (e.g. "2500" or "2,500.00") → kobo integer.
 */
export const nairaToKobo = (nairaStr) =>
  Math.round(parseFloat(String(nairaStr).replace(/,/g, '')) * 100);

/** GET /api/v1/businesses/:id/products */
export const listProducts = (businessId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/businesses/${businessId}/products${qs ? `?${qs}` : ''}`);
};

/** POST /api/v1/businesses/:id/products */
export const createProduct = (businessId, body) =>
  api.post(`/businesses/${businessId}/products`, body);

/** PATCH /api/v1/products/:id */
export const updateProduct = (productId, body) =>
  api.patch(`/products/${productId}`, body);

/** DELETE /api/v1/products/:id (soft-delete → isAvailable: false) */
export const deleteProduct = (productId) => api.del(`/products/${productId}`);

/** GET /api/v1/products/:id */
export const getProduct = (productId) => api.get(`/products/${productId}`);

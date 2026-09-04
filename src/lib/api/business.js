import { api } from './index';

/** GET /api/v1/auth/me */
export const getMe = () => api.get('/auth/me');

/** GET /api/v1/businesses/:id */
export const getBusiness = (id) => api.get(`/businesses/${id}`);

/**
 * PATCH /api/v1/businesses/:id
 * @param {string} id
 * @param {object} updates — any combination of profile or aiConfig fields
 */
export const updateBusiness = (id, updates) => api.patch(`/businesses/${id}`, updates);

/** GET /api/v1/businesses/by-slug/:slug (public — no auth) */
export const getBusinessBySlug = (slug) => api.get(`/businesses/by-slug/${slug}`);

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

/** GET /api/v1/business/balance — Wallet balance */
export const getWalletBalance = () => api.get('/business/balance');

/** GET /api/v1/business/ledger — Ledger transaction history */
export const getLedgerTransactions = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/business/ledger${query ? `?${query}` : ''}`);
};

/** GET /api/v1/business/withdrawals — Withdrawal history */
export const getWithdrawals = () => api.get('/business/withdrawals');

/** POST /api/v1/business/withdrawals — Request withdrawal */
export const requestWithdrawal = (data) => api.post('/business/withdrawals', data);

/** GET /api/v1/business/dashboard — High-level merchant metrics */
export const getDashboardMetrics = () => api.get('/business/dashboard');


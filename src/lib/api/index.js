/**
 * Voxy V2 — Base API Client
 *
 * All API calls go through this file. Token is pulled from the cookie
 * that the server sets on login/signup. For protected routes the browser
 * automatically sends the httpOnly cookie, so we don't need to manually
 * attach it for same-origin requests. For completeness we also read
 * the zustand store's persisted token when available.
 */

const BASE = '/api/v1';

/**
 * Core fetch wrapper. All domain helpers call this.
 * @param {string} path   — path after /api/v1, e.g. '/auth/me'
 * @param {object} opts   — standard fetch options
 * @returns {Promise<any>} — parsed JSON `data` field, throws on error
 */
export async function apiFetch(path, opts = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    credentials: 'include', // send httpOnly auth cookie
  });

  const contentType = res.headers.get('content-type');
  let json;
  if (contentType && contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      throw new Error(`Invalid JSON response from server`);
    }
  } else {
    throw new Error(`Server returned ${res.status}: ${res.statusText}`);
  }

  if (!json.success) {
    const msg = json.error?.message || json.error || 'Something went wrong';
    throw new Error(msg);
  }

  return json.data;
}

export const api = {
  get: (path, opts) => apiFetch(path, { method: 'GET', ...opts }),
  post: (path, body, opts) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
  patch: (path, body, opts) =>
    apiFetch(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  del: (path, opts) => apiFetch(path, { method: 'DELETE', ...opts }),
};

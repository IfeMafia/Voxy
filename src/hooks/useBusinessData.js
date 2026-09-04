/**
 * Voxy V2 — Data Hooks (React Query)
 *
 * Replace useEffect+fetch+setLoading patterns with these hooks.
 * Each hook returns { data, isLoading, isFetching, error } from React Query.
 *
 *   isLoading  = true only on the FIRST load (no cached data yet) → show skeleton
 *   isFetching = true during background revalidation → show subtle indicator,
 *                existing data stays visible — no blank screen
 */

import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getBusiness, getWalletBalance, getLedgerTransactions } from "@/lib/api/business";
import { listCustomers, getCustomer } from "@/lib/api/customers";
import { listOrders, getOrder } from "@/lib/api/orders";
import { listProducts } from "@/lib/api/products";

// ── Query key factory ────────────────────────────────────────────────────────
export const keys = {
  business:  (id)             => ["business", id],
  customers: (businessId)     => ["customers", businessId],
  customer:  (id)             => ["customer", id],
  orders:    (businessId, p)  => ["orders", businessId, p ?? {}],
  order:     (id)             => ["order", id],
  products:  (businessId, p)  => ["products", businessId, p ?? {}],
  wallet:    (businessId)     => ["wallet", businessId],
  ledger:    (businessId, p)  => ["ledger", businessId, p ?? {}],
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/** Business profile. staleTime: 5 min — rarely changes */
export function useBusiness(businessId, options = {}) {
  return useQuery({
    queryKey: keys.business(businessId),
    queryFn:  () => getBusiness(businessId),
    enabled:  !!businessId,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

/** Customer list for a business. staleTime: 2 min */
export function useCustomers(businessId, options = {}) {
  return useQuery({
    queryKey: keys.customers(businessId),
    queryFn:  () => listCustomers(businessId),
    enabled:  !!businessId,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    select: (data) => data || [],
    ...options,
  });
}

/** Single customer detail (includes orders + conversations) */
export function useCustomer(customerId, options = {}) {
  return useQuery({
    queryKey: keys.customer(customerId),
    queryFn:  () => getCustomer(customerId),
    enabled:  !!customerId,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

/** Order list for a business. staleTime: 30 s — orders are dynamic */
export function useOrders(businessId, params = {}, options = {}) {
  // Stable key — JSON-stringify avoids object reference issues
  const stableParams = JSON.stringify(params);
  return useQuery({
    queryKey: keys.orders(businessId, stableParams),
    queryFn:  () => listOrders(businessId, params),
    enabled:  !!businessId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    select: (data) => data?.orders || data || [],
    ...options,
  });
}

/** Single order detail */
export function useOrder(orderId, options = {}) {
  return useQuery({
    queryKey: keys.order(orderId),
    queryFn:  () => getOrder(orderId),
    enabled:  !!orderId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

/**
 * Product list for a business. staleTime: 2 min.
 * `params` may include { q, available, category }
 */
export function useProducts(businessId, params = {}, options = {}) {
  const stableParams = JSON.stringify(params);
  return useQuery({
    queryKey: keys.products(businessId, stableParams),
    queryFn:  () => listProducts(businessId, params),
    enabled:  !!businessId,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    select: (data) => data?.products || data || [],
    ...options,
  });
}

/** Wallet balance. staleTime: 30 s */
export function useWallet(businessId, options = {}) {
  return useQuery({
    queryKey: keys.wallet(businessId),
    queryFn:  () => getWalletBalance(),
    enabled:  !!businessId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

/** Ledger transaction stream. staleTime: 30 s */
export function useLedger(businessId, params = { limit: 30 }, options = {}) {
  const stableParams = JSON.stringify(params);
  return useQuery({
    queryKey: keys.ledger(businessId, stableParams),
    queryFn:  () => getLedgerTransactions(params),
    enabled:  !!businessId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    select: (data) => data?.transactions || [],
    ...options,
  });
}

// ── Prefetch helper ──────────────────────────────────────────────────────────
/**
 * Call on sidebar hover for likely navigation targets.
 * Does nothing if data is already fresh.
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchCustomers: (businessId) =>
      queryClient.prefetchQuery({
        queryKey: keys.customers(businessId),
        queryFn:  () => listCustomers(businessId),
        staleTime: 2 * 60_000,
      }),
    prefetchOrders: (businessId) =>
      queryClient.prefetchQuery({
        queryKey: keys.orders(businessId, "{}"),
        queryFn:  () => listOrders(businessId),
        staleTime: 30_000,
      }),
    prefetchProducts: (businessId) =>
      queryClient.prefetchQuery({
        queryKey: keys.products(businessId, "{}"),
        queryFn:  () => listProducts(businessId),
        staleTime: 2 * 60_000,
      }),
    prefetchWallet: (businessId) =>
      queryClient.prefetchQuery({
        queryKey: keys.wallet(businessId),
        queryFn:  () => getWalletBalance(),
        staleTime: 30_000,
      }),
  };
}

// ── Invalidation helpers ──────────────────────────────────────────────────────
/** After a mutation, call these to invalidate and trigger background refetch */
export function useInvalidators() {
  const queryClient = useQueryClient();
  return {
    invalidateBusiness:  (id) => queryClient.invalidateQueries({ queryKey: keys.business(id) }),
    invalidateCustomers: (id) => queryClient.invalidateQueries({ queryKey: ["customers", id] }),
    invalidateOrders:    (id) => queryClient.invalidateQueries({ queryKey: ["orders", id] }),
    invalidateProducts:  (id) => queryClient.invalidateQueries({ queryKey: ["products", id] }),
    invalidateOrder:     (id) => queryClient.invalidateQueries({ queryKey: keys.order(id) }),
    invalidateWallet:    (id) => queryClient.invalidateQueries({ queryKey: keys.wallet(id) }),
    invalidateLedger:    (id) => queryClient.invalidateQueries({ queryKey: ["ledger", id] }),
  };
}


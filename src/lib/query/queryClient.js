/**
 * Voxy V2 — Singleton QueryClient
 *
 * Shared across the app. Configured for SaaS-style UX:
 *   - staleTime: data is considered fresh for 60 s after fetch; no refetch on re-navigation within that window
 *   - gcTime:    keep unused cache entries for 5 min before garbage collecting
 *   - refetchOnWindowFocus: revalidates in background when user returns to the tab
 *   - retry: 1 — don't hammer a failing API; surface errors quickly
 */

import { QueryClient } from "@tanstack/react-query";

let client;

export function getQueryClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,          // 1 minute fresh
          gcTime: 5 * 60_000,         // 5 minutes in cache
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          retry: 1,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }
  return client;
}

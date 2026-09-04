"use client";

/**
 * SidebarContext
 *
 * Provides sidebar collapsed state to the whole app shell.
 * State is persisted to localStorage so it survives navigation and refreshes.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "voxy_sidebar_collapsed";

const SidebarContext = createContext({
  collapsed: false,
  toggleCollapsed: () => {},
});

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted state after hydration (avoids SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setCollapsed(saved === "true");
    } catch {
      // localStorage not available (e.g. SSR or private mode)
    }
    setHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Prevent flash of wrong state before hydration
  if (!hydrated) {
    return (
      <SidebarContext.Provider value={{ collapsed: false, toggleCollapsed }}>
        {children}
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
